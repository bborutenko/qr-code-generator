
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createQRCodeAction, createCodeAction, deleteQRCodeAction, getProjectsAction, createProjectAction } from "./actions";
import type { HovercodeCreateCode } from "@/schemas/hovercode";
import type { Project as ProjectModel } from "@/generated/prisma";


const QR_TYPES = ["Link", "Text"] as const;

const PATTERNS = ["Original", "Circles", "Squares", "Diamonds", "Triangles"] as const;

const EYE_STYLES = ["Square", "Rounded", "Drop", "Leaf"] as const;

const FRAMES = [
  "none",
  "border",
  "border-small",
  "border-large",
  "square",
  "speech-bubble",
  "speech-bubble-above",
  "card",
  "card-above",
  "text-frame",
  "round-frame",
  "circle-viewfinder",
  "solid-spin",
  "burst",
  "scattered-lines",
  "polkadot",
  "swirl",
] as const;

const COLOR_PRESETS = [
  "#111111", "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#6366f1",
  "#14b8a6", "#e11d48", "#84cc16", "#0ea5e9", "#a855f7",
];

const BG_COLOR_PRESETS = [
  "transparent", "#FFFFFF", "#F8FAFC", "#F1F5F9", "#E2E8F0",
  "#FEF2F2", "#FFF7ED", "#FFFBEB", "#F0FDF4", "#ECFDF5",
  "#F0F9FF", "#EFF6FF", "#F5F3FF", "#FAF5FF", "#FDF2F8",
];

// ── Helper: download remote file via fetch (bypasses cross-origin download block) ──
async function downloadUrl(url: string, filename: string) {
  const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
  const res = await fetch(proxyUrl);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function CreateCodePage() {
  const router = useRouter();

  // ── Helper: delete preview by id via fetch (keepalive-safe) ───
  const deletePreviewById = useCallback((id: string | null) => {
    if (!id) return;
    // Use fetch with keepalive=true so the request survives page unload
    fetch(`/api/delete-qr/${id}`, { method: "POST", keepalive: true }).catch(() => {});
  }, []);
  // ── Basic fields ───────────────────────────────────────────
  const [qrType, setQrType] = useState<"Link" | "Text">("Link");
  const [qrData, setQrData] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [dynamic, setDynamic] = useState(false);
  const [generatePng, setGeneratePng] = useState(false);

  // ── Validation helpers ─────────────────────────────────────
  const isValidUrl = (val: string) => {
    if (!val) return true;
    try { new URL(val); return true; } catch { return false; }
  };
  const [urlTouched, setUrlTouched] = useState(false);
  const [logoUrlTouched, setLogoUrlTouched] = useState(false);

  // ── Logo ───────────────────────────────────────────────────
  const [logoUrl, setLogoUrl] = useState("");
  const [logoRound, setLogoRound] = useState(false);
  const [showLogoTab, setShowLogoTab] = useState(false);

  const clearLogo = () => {
    setLogoUrl("");
    setLogoRound(false);
  };

  // Computed validation errors (after all state is declared)
  const urlError = qrType === "Link" && urlTouched && qrData && !isValidUrl(qrData)
    ? "Please enter a valid URL (e.g. https://example.com)"
    : null;
  const logoUrlError = logoUrlTouched && logoUrl && !isValidUrl(logoUrl)
    ? "Please enter a valid image URL"
    : null;
  const hasValidationErrors = !!urlError || !!logoUrlError;

  // ── Style ──────────────────────────────────────────────────
  const [showStyleTab, setShowStyleTab] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#111111");
  const [backgroundColor, setBackgroundColor] = useState("");
  const [pattern, setPattern] = useState<string>("Original");
  const [eyeStyle, setEyeStyle] = useState<string>("Square");
  const [frame, setFrame] = useState<string>("none");
  const [hasBorder, setHasBorder] = useState(false);
  const [frameText, setFrameText] = useState("");

  // ── Preview / live state ───────────────────────────────────
  const [previewCode, setPreviewCode] = useState<HovercodeCreateCode | null>(null);
  const [currentQRId, setCurrentQRId] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // ── Final submit state ─────────────────────────────────────
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // ── Project state ──────────────────────────────────────────
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [createProjectLoading, setCreateProjectLoading] = useState(false);
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);

  useEffect(() => {
    getProjectsAction().then((res) => {
      if (res.success) setProjects(res.data);
    });
  }, []);

  // ── Debounce + id ref ──────────────────────────────────────
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref keeps latest ID visible inside async callbacks without stale closure
  const currentQRIdRef = useRef<string | null>(null);
  useEffect(() => { currentQRIdRef.current = currentQRId; }, [currentQRId]);

  // ── Cleanup: delete preview on page unload (tab close / refresh) ──
  useEffect(() => {
    const handleBeforeUnload = () => {
      deletePreviewById(currentQRIdRef.current);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [deletePreviewById]);

  // ── Cleanup: delete preview on SPA unmount (Next.js navigation) ──
  useEffect(() => {
    return () => {
      // currentQRIdRef.current is always up-to-date (no stale closure)
      deletePreviewById(currentQRIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Build params ───────────────────────────────────────────
  const buildParams = useCallback(() => ({
    qr_data: qrData,
    qr_type: qrType,
    display_name: displayName || "Preview",
    ...(qrType === "Link" && { dynamic }),
    ...(generatePng && { generate_png: true }),
    ...(logoUrl && { logo_url: logoUrl }),
    ...(logoUrl && logoRound && { logo_round: true }),
    ...(primaryColor !== "#111111" && { primary_color: primaryColor }),
    ...(backgroundColor && backgroundColor !== "transparent" && { background_color: backgroundColor }),
    ...(pattern !== "Original" && { pattern }),
    ...(eyeStyle !== "Square" && { eye_style: eyeStyle }),
    ...(frame !== "none" && { frame }),
    ...(frame !== "none" && hasBorder && { has_border: true }),
    ...(frame !== "none" && frameText && { text: frameText }),
  }), [qrData, qrType, displayName, dynamic, generatePng, logoUrl, logoRound,
       primaryColor, backgroundColor, pattern, eyeStyle, frame, hasBorder, frameText]);

  // ── Core: delete old preview → create new ─────────────────
  const refreshPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);

    const prevId = currentQRIdRef.current;
    if (prevId) {
      await deleteQRCodeAction(prevId);
      setCurrentQRId(null);
      currentQRIdRef.current = null;
    }

    const res = await createQRCodeAction(buildParams());
    setPreviewLoading(false);

    if (res.success) {
      setPreviewCode(res.data);
      setCurrentQRId(res.data.id);
      currentQRIdRef.current = res.data.id;
    } else {
      setPreviewError(res.error);
    }
  }, [buildParams]);

  // ── Auto-refresh on style / logo changes (debounced 700ms) ─
  useEffect(() => {
    if (!qrData || !displayName || hasValidationErrors) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(refreshPreview, 700);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoUrl, logoRound, primaryColor, backgroundColor, pattern, eyeStyle, frame, hasBorder, frameText]);

  // ── Auto-refresh on basic field changes (debounced 1000ms) ─
  useEffect(() => {
    if (!qrData || !displayName || hasValidationErrors) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(refreshPreview, 1000);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrData, qrType, dynamic, displayName, generatePng]);

  // ── Final submit ───────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);

    // If preview already exists — save it to DB, then clear preview ref
    if (previewCode) {
      const params = {
        ...buildParams(),
        display_name: displayName,
        ...(selectedProjectId && { projectId: selectedProjectId }),
        existingHovercodeId: previewCode.id,
        existingCode: previewCode,
      };
      const res = await createCodeAction(params);
      setSubmitLoading(false);
      if (res.success) {
        // Clear the ref so unmount/unload cleanup won't delete the saved code
        currentQRIdRef.current = null;
        setCurrentQRId(null);
        setSubmitted(true);
      } else {
        setSubmitError(res.error);
      }
      return;
    }

    const params = {
      ...buildParams(),
      ...(selectedProjectId && { projectId: selectedProjectId }),
    };
    const res = await createCodeAction(params);
    setSubmitLoading(false);
    if (res.success) {
      setPreviewCode(res.data);
      // Clear ref immediately — the code is now saved, must not be deleted
      currentQRIdRef.current = null;
      setCurrentQRId(null);
      setSubmitted(true);
    } else {
      setSubmitError(res.error);
    }
  };

  const handleCreateAnother = () => {
    setSubmitted(false);
    setPreviewCode(null);
    setCurrentQRId(null);
    currentQRIdRef.current = null;
    setQrData("");
    setDisplayName("");
    setDynamic(false);
    setGeneratePng(false);
    clearLogo();
    setPrimaryColor("#111111");
    setBackgroundColor("");
    setPattern("Original");
    setEyeStyle("Square");
    setFrame("none");
    setHasBorder(false);
    setFrameText("");
    setSelectedProjectId("");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 bg-zinc-50/90 dark:bg-black/90 backdrop-blur border-b border-gray-200 dark:border-zinc-800 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground dark:text-white">Create QR Code</h1>
          <button
            type="button"
            onClick={async () => {
              // Delete the temporary preview before navigating away
              if (currentQRIdRef.current) {
                await deleteQRCodeAction(currentQRIdRef.current);
                currentQRIdRef.current = null;
                setCurrentQRId(null);
              }
              router.push("/codes/all");
            }}
            className="px-4 py-2 bg-gray-800 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold transition text-sm"
          >
            My Codes
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* ── Final success screen ── */}
        {submitted && previewCode ? (
          <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 border border-green-300 dark:border-green-800 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-2">✅ QR Code saved!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{previewCode.display_name}</p>
            <div className="flex justify-center mb-6 bg-zinc-50 dark:bg-zinc-950 p-6 rounded-lg">
              <div dangerouslySetInnerHTML={{ __html: previewCode.svg }} className="max-w-[280px]" />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 mb-6">
              {/* Save PNG */}
              {previewCode.png ? (
                <button
                  type="button"
                  onClick={() => downloadUrl(previewCode.png!, `${previewCode.display_name || "qr-code"}.png`)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition shadow"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Save as PNG
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gray-300 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 rounded-xl font-semibold cursor-not-allowed"
                  title="PNG was not generated. Enable 'Generate PNG' next time."
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Save as PNG <span className="text-xs font-normal">(not generated)</span>
                </button>
              )}

              {/* Save SVG */}
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([previewCode.svg], { type: "image/svg+xml;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${previewCode.display_name || "qr-code"}.svg`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center justify-center gap-2 w-full py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-semibold transition shadow"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Save as SVG
              </button>

              {/* View Details */}
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams();
                  if (previewCode.qr_data) params.set("qrData", previewCode.qr_data);
                  params.set("dynamic", String(previewCode.dynamic ?? false));
                  router.push(`/codes/${previewCode.id}?${params.toString()}`);
                }}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-white rounded-xl font-semibold transition border border-gray-200 dark:border-zinc-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                View Details
              </button>
            </div>

            <button
              onClick={handleCreateAnother}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition underline underline-offset-2"
            >
              + Create Another
            </button>
          </div>
        ) : (
          /* ── Main 2-column layout ── */
          <div className="flex flex-col lg:flex-row gap-8 lg:items-start">

            {/* ── LEFT: Form ── */}
            <form onSubmit={handleSubmit} className="flex-1 min-w-0 space-y-6">

              {submitError && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{submitError}</p>
                </div>
              )}

              {/* ── Section: Basic ── */}
              <section className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6 space-y-6">
                <h2 className="text-lg font-bold text-foreground dark:text-white border-b border-gray-200 dark:border-zinc-700 pb-3">
                  Basic Settings
                </h2>

                {/* QR Type */}
                <div>
                  <label className="block text-sm font-semibold text-foreground dark:text-white mb-1">
                    QR Type <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Choose the type of content</p>
                  <div className="flex gap-3">
                    {QR_TYPES.map((t) => (
                      <button key={t} type="button"
                        onClick={() => { setQrType(t); if (t === "Text") setDynamic(false); }}
                        className={`px-5 py-2 rounded-lg font-medium transition border ${qrType === t ? "bg-blue-500 text-white border-blue-500" : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-700"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* QR Data */}
                <div>
                  <label className="block text-sm font-semibold text-foreground dark:text-white mb-1">
                    {qrType === "Link" ? "URL" : "Text Content"} <span className="text-red-500">*</span>
                  </label>
                  {qrType === "Text" && (
                    <div className="mb-2 px-3 py-2 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded text-xs text-amber-800 dark:text-amber-200">
                      ⚠️ Text QR codes are static and cannot be modified after creation
                    </div>
                  )}
                  {qrType === "Link" ? (
                    <input type="url" required value={qrData}
                      onChange={(e) => setQrData(e.target.value)}
                      onBlur={() => setUrlTouched(true)}
                      placeholder="https://example.com"
                      className={`w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-zinc-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${urlError ? "border-red-400 dark:border-red-500" : "border-gray-300 dark:border-zinc-700"}`} />
                  ) : (
                    <textarea required value={qrData} onChange={(e) => setQrData(e.target.value)}
                      placeholder="Enter your text here..." rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
                  )}
                  {urlError && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                      <span>⚠</span> {urlError}
                    </p>
                  )}
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-semibold text-foreground dark:text-white mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    A friendly name for your QR code (only visible to you)
                  </p>
                  <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="My QR Code"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Dynamic */}
                {qrType === "Link" && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={dynamic} onChange={(e) => setDynamic(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500" />
                    <div>
                      <span className="text-sm font-semibold text-foreground dark:text-white">Dynamic QR Code</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Change the target URL later without regenerating</p>
                    </div>
                  </label>
                )}

                {/* Generate PNG */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={generatePng} onChange={(e) => setGeneratePng(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500" />
                  <div>
                    <span className="text-sm font-semibold text-foreground dark:text-white">Generate PNG</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Also generate a downloadable PNG file</p>
                  </div>
                </label>

                {/* Project */}
                <div>
                  <label className="block text-sm font-semibold text-foreground dark:text-white mb-1">
                    Project <span className="text-xs font-normal text-gray-400">(optional)</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Assign this QR code to a project</p>

                  {!isCreatingProject ? (
                    <div className="flex gap-2">
                      <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— No project —</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => { setIsCreatingProject(true); setCreateProjectError(null); }}
                        className="px-3 py-2 rounded-lg border border-dashed border-gray-400 dark:border-zinc-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:text-blue-400 transition text-sm whitespace-nowrap"
                      >
                        + New
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Project name"
                        autoFocus
                        className="w-full px-4 py-2 rounded-lg border border-blue-400 dark:border-blue-500 bg-gray-50 dark:bg-zinc-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {createProjectError && (
                        <p className="text-xs text-red-500 dark:text-red-400">⚠ {createProjectError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!newProjectName.trim() || createProjectLoading}
                          onClick={async () => {
                            setCreateProjectLoading(true);
                            setCreateProjectError(null);
                            const res = await createProjectAction(newProjectName.trim());
                            setCreateProjectLoading(false);
                            if (res.success) {
                              setProjects((prev) => [...prev, res.data]);
                              setSelectedProjectId(res.data.id);
                              setNewProjectName("");
                              setIsCreatingProject(false);
                            } else {
                              setCreateProjectError(res.error);
                            }
                          }}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition"
                        >
                          {createProjectLoading ? "Creating..." : "Create"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsCreatingProject(false); setNewProjectName(""); setCreateProjectError(null); }}
                          className="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Section: Logo (collapsible) ── */}
              <section className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <button type="button" onClick={() => setShowLogoTab(!showLogoTab)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-zinc-800 transition">
                  <h2 className="text-lg font-bold text-foreground dark:text-white">🖼️ Logo</h2>
                  <span className={`text-2xl text-gray-400 transition-transform ${showLogoTab ? "rotate-180" : ""}`}>▾</span>
                </button>
                {showLogoTab && (
                  <div className="px-6 pb-6 space-y-6 border-t border-gray-200 dark:border-zinc-700 pt-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground dark:text-white mb-1">
                        Logo URL
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        URL to a logo image (PNG or JPEG recommended, keep the file small)
                      </p>
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => { setLogoUrl(e.target.value); if (!e.target.value) clearLogo(); }}
                        onBlur={() => setLogoUrlTouched(true)}
                        placeholder="https://example.com/logo.png"
                        className={`w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-zinc-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${logoUrlError ? "border-red-400 dark:border-red-500" : "border-gray-300 dark:border-zinc-700"}`}
                      />
                      {logoUrlError && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                          <span>⚠</span> {logoUrlError}
                        </p>
                      )}
                    </div>
                    {logoUrl && (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={logoRound} onChange={(e) => setLogoRound(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500" />
                        <div>
                          <span className="text-sm font-semibold text-foreground dark:text-white">Round Logo</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Crop the logo into a circle shape</p>
                        </div>
                      </label>
                    )}
                  </div>
                )}
              </section>

              {/* ── Section: Style (collapsible) ── */}
              <section className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <button type="button" onClick={() => setShowStyleTab(!showStyleTab)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-zinc-800 transition">
                  <h2 className="text-lg font-bold text-foreground dark:text-white">🎨 Style</h2>
                  <span className={`text-2xl text-gray-400 transition-transform ${showStyleTab ? "rotate-180" : ""}`}>▾</span>
                </button>
                {showStyleTab && (
                  <div className="px-6 pb-6 space-y-6 border-t border-gray-200 dark:border-zinc-700 pt-6">

                    {/* Primary Color */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground dark:text-white mb-1">Primary Color</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">The main color of your QR code pattern</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {COLOR_PRESETS.map((color) => (
                          <button key={color} type="button" onClick={() => setPrimaryColor(color)}
                            className={`w-8 h-8 rounded-full border-2 transition hover:scale-110 ${primaryColor === color ? "border-blue-500 ring-2 ring-blue-300 scale-110" : "border-gray-300 dark:border-zinc-600"}`}
                            style={{ backgroundColor: color }} title={color} />
                        ))}
                      </div>
                      <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#111111"
                        className="w-40 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    {/* Background Color */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground dark:text-white mb-1">Background Color</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">The background behind your QR code</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {BG_COLOR_PRESETS.map((color) => (
                          <button key={color} type="button" onClick={() => setBackgroundColor(color)}
                            className={`w-8 h-8 rounded-full border-2 transition hover:scale-110 ${backgroundColor === color ? "border-blue-500 ring-2 ring-blue-300 scale-110" : "border-gray-300 dark:border-zinc-600"}`}
                            style={{
                              backgroundColor: color === "transparent" ? "transparent" : color,
                              backgroundImage: color === "transparent" ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)" : undefined,
                              backgroundSize: color === "transparent" ? "8px 8px" : undefined,
                              backgroundPosition: color === "transparent" ? "0 0, 4px 4px" : undefined,
                            }} title={color} />
                        ))}
                      </div>
                      <input type="text" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} placeholder="transparent"
                        className="w-40 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    {/* Pattern */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground dark:text-white mb-1">Pattern</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">The shape of the dots in your QR code</p>
                      <div className="flex flex-wrap gap-2">
                        {PATTERNS.map((p) => (
                          <button key={p} type="button" onClick={() => setPattern(p)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${pattern === p ? "bg-blue-500 text-white border-blue-500" : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-700"}`}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Eye Style */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground dark:text-white mb-1">Eye Style</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">The style of the three corner markers</p>
                      <div className="flex flex-wrap gap-2">
                        {EYE_STYLES.map((es) => (
                          <button key={es} type="button" onClick={() => setEyeStyle(es)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${eyeStyle === es ? "bg-blue-500 text-white border-blue-500" : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-700"}`}>
                            {es}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Frame */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground dark:text-white mb-1">Frame</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Add a decorative frame around your QR code</p>
                      <div className="flex flex-wrap gap-2">
                        {FRAMES.map((f) => (
                          <button key={f} type="button"
                            onClick={() => { setFrame(f); if (f === "none") { setHasBorder(false); setFrameText(""); } }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${frame === f ? "bg-blue-500 text-white border-blue-500" : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-700"}`}>
                            {f === "none" ? "No Frame" : f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {frame !== "none" && (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={hasBorder} onChange={(e) => setHasBorder(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500" />
                        <div>
                          <span className="text-sm font-semibold text-foreground dark:text-white">Frame Border</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Add a border to the frame</p>
                        </div>
                      </label>
                    )}

                    {frame !== "none" && (
                      <div>
                        <label className="block text-sm font-semibold text-foreground dark:text-white mb-1">Frame Text</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Add text to your frame (works with certain frames)</p>
                        <input type="text" value={frameText} onChange={(e) => setFrameText(e.target.value)} placeholder="Scan me!"
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* ── Preview (mobile only — shown before Submit) ── */}
              <div className="block lg:hidden bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <h3 className="text-sm font-bold text-foreground dark:text-white mb-4 flex items-center gap-2">
                  <span>👁️ Preview</span>
                  {previewLoading && (
                    <span className="ml-auto text-xs text-blue-500 animate-pulse">Updating…</span>
                  )}
                </h3>
                <div className="flex items-center justify-center min-h-[220px] bg-zinc-50 dark:bg-zinc-950 rounded-lg mb-4">
                  {previewLoading ? (
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <svg className="animate-spin w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4l-3 3-3-3h4z" />
                      </svg>
                      <span className="text-xs">Generating…</span>
                    </div>
                  ) : previewError ? (
                    <div className="text-center p-4">
                      <p className="text-red-500 text-xs font-semibold mb-1">Preview failed</p>
                      <p className="text-gray-400 text-xs">{previewError}</p>
                    </div>
                  ) : previewCode ? (
                    <div dangerouslySetInnerHTML={{ __html: previewCode.svg }} className="w-full max-w-[200px]" />
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-4xl mb-2">🔲</p>
                      <p className="text-gray-400 text-xs">Fill in Name & URL<br />to see your QR code</p>
                    </div>
                  )}
                </div>
                {previewCode && !previewLoading && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 border-t border-gray-100 dark:border-zinc-800 pt-3">
                    {displayName && <p><span className="font-semibold text-foreground dark:text-white">Name:</span> {displayName}</p>}
                    <p><span className="font-semibold text-foreground dark:text-white">Type:</span> {qrType}</p>
                  </div>
                )}
              </div>

              {/* ── Submit ── */}
              <button
                type="submit"
                disabled={submitLoading || !qrData || !displayName || hasValidationErrors}
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-lg font-bold rounded-xl transition shadow-lg hover:shadow-xl"
              >
                {submitLoading ? "Saving..." : "✨ Save QR Code"}
              </button>
            </form>

            {/* ── RIGHT: Preview (desktop only) ── */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-24">
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                  <h3 className="text-sm font-bold text-foreground dark:text-white mb-4 flex items-center gap-2">
                    <span>👁️ Preview</span>
                    {previewLoading && (
                      <span className="ml-auto text-xs text-blue-500 animate-pulse">Updating…</span>
                    )}
                  </h3>

                  <div className="flex items-center justify-center min-h-[240px] bg-zinc-50 dark:bg-zinc-950 rounded-lg mb-4">
                    {previewLoading ? (
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <svg className="animate-spin w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4l-3 3-3-3h4z" />
                        </svg>
                        <span className="text-xs">Generating…</span>
                      </div>
                    ) : previewError ? (
                      <div className="text-center p-4">
                        <p className="text-red-500 text-xs font-semibold mb-1">Preview failed</p>
                        <p className="text-gray-400 text-xs">{previewError}</p>
                      </div>
                    ) : previewCode ? (
                      <div dangerouslySetInnerHTML={{ __html: previewCode.svg }} className="w-full max-w-[220px]" />
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-4xl mb-2">🔲</p>
                        <p className="text-gray-400 text-xs">Fill in Name & URL<br />to see your QR code</p>
                      </div>
                    )}
                  </div>

                  {previewCode && !previewLoading && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 border-t border-gray-100 dark:border-zinc-800 pt-3">
                      {displayName && <p><span className="font-semibold text-foreground dark:text-white">Name:</span> {displayName}</p>}
                      <p><span className="font-semibold text-foreground dark:text-white">Type:</span> {qrType}</p>
                    </div>
                  )}
                </div>

                {!previewCode && !previewLoading && (
                  <p className="text-xs text-gray-400 dark:text-gray-600 text-center mt-3">
                    Preview auto-updates as you type
                  </p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
