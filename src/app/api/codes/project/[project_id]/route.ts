import { NextRequest, NextResponse } from "next/server";
import { getCodesByProject } from "@/services/code";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ project_id: string }> }
) {
    const { project_id } = await params;

    if (!project_id) {
        return NextResponse.json(
            { error: "project_id is required" },
            { status: 400 }
        );
    }

    const codes = await getCodesByProject(project_id);
    return NextResponse.json(codes);
}