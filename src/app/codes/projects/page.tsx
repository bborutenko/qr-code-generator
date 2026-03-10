import Link from "next/link";
import { getProjects } from "@/services/project";
import ProjectsClient from "./components";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground dark:text-white">
            Projects
          </h1>

          <div className="flex items-center gap-3">
            <Link
              href="/codes/all"
              className="px-5 py-2 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-900 dark:text-white font-semibold rounded-lg transition"
            >
              All Codes
            </Link>
            <Link
              href="/codes/projects"
              className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition"
            >
              Projects
            </Link>
          </div>

          <div className="w-24" />
        </div>

        <ProjectsClient projects={projects} />
      </div>
    </div>
  );
}
