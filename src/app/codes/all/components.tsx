"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { HovercodePaginatedResponse } from "@/schemas/hovercode";
import type { ProjectModel } from "@/generated/prisma/models";

type HovercodeListItem = HovercodePaginatedResponse["results"][number];

type Props = {
  codes: HovercodeListItem[];
  projects: ProjectModel[];
  initialProjectId?: string;
};

export function AllCodesClient({ codes, projects, initialProjectId }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [filteredIds, setFilteredIds] = useState<Set<string> | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Auto-apply filter if navigated from Projects page with ?project=...
  useEffect(() => {
    if (initialProjectId) {
      handleSelectProject(initialProjectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProjectId]);

  const handleSelectProject = async (projectId: string) => {
    setIsDropdownOpen(false);

    if (!projectId) {
      // Reset filter
      setSelectedProjectId("");
      setFilteredIds(null);
      setFilterError(null);
      return;
    }

    setSelectedProjectId(projectId);
    setFilterLoading(true);
    setFilterError(null);

    try {
      const res = await fetch(`/api/codes/project/${projectId}`);
      if (!res.ok) throw new Error("Failed to load project codes");
      const projectCodes: { hovercodeId: string }[] = await res.json();
      const ids = new Set(projectCodes.map((c) => c.hovercodeId));
      setFilteredIds(ids);
    } catch {
      setFilterError("Failed to filter by project");
      setSelectedProjectId("");
      setFilteredIds(null);
    } finally {
      setFilterLoading(false);
    }
  };

  const visibleCodes = filteredIds === null
    ? codes
    : codes.filter((c) => filteredIds.has(c.id));

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <>
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground dark:text-white">
          All Codes
        </h1>

        <div className="flex items-center gap-3">
          <Link
            href="/codes/all"
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition"
          >
            All Codes
          </Link>
          <Link
            href="/codes/projects"
            className="px-5 py-2 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-900 dark:text-white font-semibold rounded-lg transition"
          >
            Projects
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter by Project dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border transition text-sm ${
                selectedProjectId
                  ? "bg-purple-100 dark:bg-purple-950 border-purple-400 dark:border-purple-600 text-purple-700 dark:text-purple-300"
                  : "bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:border-purple-400 dark:hover:border-purple-600"
              }`}
            >
              <span>📁</span>
              <span>
                {filterLoading
                  ? "Loading..."
                  : selectedProject
                  ? selectedProject.name
                  : "Filter by Project"}
              </span>
              <span className={`text-xs transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}>▾</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg z-10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleSelectProject("")}
                  className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-gray-50 dark:hover:bg-zinc-800 ${
                    !selectedProjectId ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  All Codes
                </button>
                {projects.length === 0 && (
                  <p className="px-4 py-2.5 text-sm text-gray-400 dark:text-gray-500">No projects yet</p>
                )}
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProject(p.id)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-gray-50 dark:hover:bg-zinc-800 ${
                      selectedProjectId === p.id ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/codes/create"
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition"
          >
            <span className="text-xl">+</span>
            Create
          </Link>
        </div>
      </div>

      {/* Active filter badge */}
      {selectedProject && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-gray-500 dark:text-gray-400">Filtering by project:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold border border-purple-300 dark:border-purple-700">
            📁 {selectedProject.name}
            <button
              type="button"
              onClick={() => handleSelectProject("")}
              className="ml-1 hover:text-purple-900 dark:hover:text-white transition"
            >
              ✕
            </button>
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            ({visibleCodes.length} code{visibleCodes.length !== 1 ? "s" : ""})
          </span>
        </div>
      )}

      {/* Filter error */}
      {filterError && (
        <div className="mb-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
          {filterError}
        </div>
      )}

      {/* QR Codes Grid */}
      {visibleCodes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCodes.map((code) => (
            <Link
              key={code.id}
              href={`/codes/${code.id}?dynamic=${code.dynamic}&qrData=${encodeURIComponent(code.qr_data)}`}
              className="block bg-white dark:bg-zinc-900 rounded-lg shadow-md hover:shadow-lg transition border border-gray-200 dark:border-zinc-800 p-4 hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground dark:text-white truncate">
                  {code.display_name || "Untitled"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  <strong>Type:</strong> {code.qr_type}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  <strong>Data:</strong> {code.qr_data}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  <strong>Dynamic:</strong> {code.dynamic ? "Yes" : "No"}
                </p>
                {code.shortlink_url && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 truncate">
                    <strong>Short Link:</strong> {code.shortlink_url}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-600">
                  Created: {new Date(code.created).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {visibleCodes.length === 0 && !filterLoading && (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            {selectedProject
              ? `No QR codes in project "${selectedProject.name}"`
              : "No QR codes yet, create your first one using the button above!"}
          </p>
        </div>
      )}
    </>
  );
}
