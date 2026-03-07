"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectModel } from "@/generated/prisma/models";

interface Props {
  projects: ProjectModel[];
}

export default function ProjectsClient({ projects: initial }: Props) {
  const router = useRouter();
  const [projects, setProjects] = useState(initial);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const created: ProjectModel = await res.json();
      setProjects((prev) => [created, ...prev]);
      setNewName("");
    } catch {
      setCreateError("Failed to create project. Try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete project? All codes inside will also be deleted.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Failed to delete project.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6"
      >
        <h2 className="text-lg font-bold text-foreground dark:text-white mb-4">
          New Project
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isCreating || !newName.trim()}
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
          >
            {isCreating ? "Creating…" : "+ Create"}
          </button>
        </div>
        {createError && (
          <p className="mt-2 text-sm text-red-500">{createError}</p>
        )}
      </form>

      {/* Project list */}
      {projects.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
          <p className="text-5xl mb-4">📁</p>
          <p className="text-lg font-semibold text-foreground dark:text-white mb-1">
            No projects yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create your first project above
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-5 flex flex-col gap-3 hover:border-blue-300 dark:hover:border-blue-700 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-foreground dark:text-white text-lg leading-tight">
                    {project.name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-2xl">📁</span>
              </div>

              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => router.push(`/codes/all?project=${project.id}`)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold rounded-lg transition"
                >
                  Codes
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  disabled={deletingId === project.id}
                  className="px-3 py-2 text-sm bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {deletingId === project.id ? "…" : "🗑️"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
