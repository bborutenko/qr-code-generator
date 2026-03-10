"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteQRCode, updateQRCode } from "@/services/hovercode";
import type { HovercodeDisplayCode } from "@/schemas/hovercode";
import type { Project as ProjectModel } from "@/generated/prisma";

const isValidUrl = (val: string) => {
  try { new URL(val); return true; } catch { return false; }
};

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


function QRCodeDetailClient({ qrCode, dynamic, qrData, projects }: 
    { 
        qrCode: HovercodeDisplayCode; 
        dynamic: boolean | undefined; 
        qrData: string | undefined; 
        projects: ProjectModel[] 
    }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Edit modal state
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editName, setEditName] = useState(qrCode.display_name || "");
  const [editLink, setEditLink] = useState(qrCode.link || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this QR code? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    const res = await deleteQRCode(qrCode.id);
    
    if (res.success) {
      router.push("/codes/all");
    } else {
      setDeleteError("Failed to delete QR code. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editName.trim()) {
      setUpdateError("Name cannot be empty");
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      await updateQRCode(qrCode.id, { display_name: editName });
      setUpdateSuccess(true);
      setIsEditingName(false);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateLink = async () => {
    if (!editLink.trim()) {
      setUpdateError("Link cannot be empty");
      return;
    }
    if (!isValidUrl(editLink.trim())) {
      setUpdateError("Please enter a valid URL (e.g. https://example.com)");
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      await updateQRCode(qrCode.id, { qr_data: editLink });
      setUpdateSuccess(true);
      setIsEditingLink(false);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update link");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateProject = async (projectId: string) => {
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const res = await fetch("/api/codes/project", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoverCodeId: qrCode.id, projectId }),
      });
      if (!res.ok) throw new Error("Failed to update project");
      setUpdateSuccess(true);
      setIsEditingProject(false);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/codes/all"
          className="inline-block mb-6 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
        >
          ← Back to My Codes
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-4xl font-bold text-foreground dark:text-white">
              {qrCode.display_name || "Untitled QR Code"}
            </h1>
            {dynamic && (
              <button
                onClick={() => {
                  setEditName(qrCode.display_name || "");
                  setIsEditingName(true);
                }}
                className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition"
                title="Edit name"
              >
                ✏️
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Created: {new Date(qrCode.created).toLocaleString()}
          </p>
            <Link
              href={(() => {
                const p = new URLSearchParams();
                if (qrData) p.set("qrData", qrData);
                p.set("dynamic", String(dynamic ?? false));
                return `/codes/${qrCode.id}/analytics?${p.toString()}`;
              })()}
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition shadow-sm"
            >
              📊 View Analytics
            </Link>
            <button
              onClick={() => setIsEditingProject(true)}
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold rounded-lg transition shadow-sm ml-2"
            >
              📁 Change Project
            </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: QR Code Preview */}
          <div className="lg:col-span-2 space-y-8">
            {/* QR Code SVG */}
            <section className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-8">
              <h2 className="text-lg font-bold text-foreground dark:text-white mb-6">QR Code Preview</h2>
              <div className="bg-zinc-50 dark:bg-zinc-950 rounded-lg p-8 flex justify-center items-center min-h-[400px]">
                <div dangerouslySetInnerHTML={{ __html: qrCode.svg }} className="max-w-full" />
              </div>

              {/* Download Links */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([qrCode.svg], { type: "image/svg+xml;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${qrCode.display_name || "qr-code"}.svg`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-semibold transition"
                >
                  <span>📥</span>
                  Download SVG
                </button>
                {qrCode.png ? (
                  <button
                    type="button"
                    onClick={() => downloadUrl(qrCode.png!, `${qrCode.display_name || "qr-code"}.png`)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition"
                  >
                    <span>📥</span>
                    Download PNG
                  </button>
                ) : (
                  <div
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                    title="PNG was not generated for this QR code"
                  >
                    <span>📥</span>
                    Download PNG
                  </div>
                )}
              </div>
            </section>

            {/* QR Details */}
            <section className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground dark:text-white border-b border-gray-200 dark:border-zinc-700 pb-3">
                QR Code Details
              </h2>

              <div className="space-y-4">
                <div>
                  {qrData && (
                    <>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Link / Text
                        </label>
                        {dynamic && (
                          <button
                            onClick={() => {
                              setEditLink(qrData || "");
                              setIsEditingLink(true);
                            }}
                            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition text-xs"
                            title="Edit link"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                      <p className="text-foreground dark:text-white break-all bg-gray-50 dark:bg-zinc-950 p-3 rounded">
                        {qrData}
                      </p>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    ID
                  </label>
                  <p className="text-foreground dark:text-white font-mono text-xs bg-gray-50 dark:bg-zinc-950 p-3 rounded break-all">
                    {qrCode.id}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right: Styling & Logo */}
          <div className="space-y-6">
            {/* Primary Color */}
            <section className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
              <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-4">
                Primary Color
              </h3>
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-lg border-2 border-gray-200 dark:border-zinc-700 shadow-md"
                  style={{ backgroundColor: qrCode.primary_color }}
                />
                <div>
                  <p className="font-mono font-bold text-foreground dark:text-white">
                    {qrCode.primary_color}
                  </p>
                </div>
              </div>
            </section>

            {/* Delete Button */}
            <section className="bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-900 p-6">
              <h3 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase mb-4">
                Danger Zone
              </h3>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
              >
                {isDeleting ? "Deleting..." : "🗑️ Delete QR Code"}
              </button>
              {deleteError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Error: {deleteError}
                </p>
              )}
            </section>

            {/* Logo */}
            {qrCode.logo && (
              <section className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-4">
                  Logo
                </h3>
                <div className="bg-gray-50 dark:bg-zinc-950 rounded-lg p-4 flex justify-center items-center min-h-[120px]">
                  <img
                    src={qrCode.logo}
                    alt="QR Code Logo"
                    className="max-w-full max-h-[100px] object-contain"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 truncate">
                  {qrCode.logo}
                </p>
              </section>
            )}
          </div>
        </div>

        {/* Edit Name Modal */}
        {isEditingName && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6 max-w-md w-full">
              <h2 className="text-lg font-bold text-foreground dark:text-white mb-4">Edit QR Code Name</h2>
              
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter new name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-foreground dark:text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {updateError && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-3 py-2 rounded mb-4 text-sm">
                  {updateError}
                </div>
              )}

              {updateSuccess && (
                <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-800 dark:text-green-200 px-3 py-2 rounded mb-4 text-sm">
                  Updated successfully!
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsEditingName(false)}
                  disabled={isUpdating}
                  className="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateName}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg transition disabled:cursor-not-allowed"
                >
                  {isUpdating ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Link Modal */}
        {isEditingLink && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6 max-w-md w-full">
              <h2 className="text-lg font-bold text-foreground dark:text-white mb-4">Edit QR Code Link</h2>
              
              <input
                type="text"
                value={editLink}
                onChange={(e) => setEditLink(e.target.value)}
                placeholder="Enter new link or text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-foreground dark:text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {updateError && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-3 py-2 rounded mb-4 text-sm">
                  {updateError}
                </div>
              )}

              {updateSuccess && (
                <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-800 dark:text-green-200 px-3 py-2 rounded mb-4 text-sm">
                  Updated successfully!
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsEditingLink(false)}
                  disabled={isUpdating}
                  className="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateLink}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg transition disabled:cursor-not-allowed"
                >
                  {isUpdating ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Project Modal */}
        {isEditingProject && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6 max-w-md w-full">
              <h2 className="text-lg font-bold text-foreground dark:text-white mb-4">Change Project</h2>
              
              {projects.length === 0 ? (
                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded mb-4 text-sm">
                  No projects available. Create a project first.
                </div>
              ) : (
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => handleUpdateProject(project.id)}
                      disabled={isUpdating}
                      className="w-full text-left px-3 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-foreground dark:text-white transition disabled:opacity-50"
                    >
                      <p className="font-semibold">{project.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Created: {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {updateError && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-3 py-2 rounded mb-4 text-sm">
                  {updateError}
                </div>
              )}

              {updateSuccess && (
                <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-800 dark:text-green-200 px-3 py-2 rounded mb-4 text-sm">
                  Project updated successfully!
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsEditingProject(false)}
                  disabled={isUpdating}
                  className="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QRCodeDetailClient;