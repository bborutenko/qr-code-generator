import { getQRCodes } from "@/services/hovercode";
import { getProjects } from "@/services/project";
import { AllCodesClient } from "./components";

export default async function MyCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: initialProjectId } = await searchParams;

  const [codesResult, projects] = await Promise.all([
    getQRCodes().catch(() => null),
    getProjects().catch(() => []),
  ]);

  const codes =
    codesResult && "results" in codesResult ? codesResult.results : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <AllCodesClient codes={codes} projects={projects} initialProjectId={initialProjectId} />
    </div>
  );
}
