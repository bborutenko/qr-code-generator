import { NextRequest, NextResponse } from "next/server";
import { createProject, getProjects } from "@/services/project";

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const project = await createProject(name.trim());
  return NextResponse.json(project, { status: 201 });
}

export async function GET() {
    const projects = await getProjects();
    return NextResponse.json(projects);
}