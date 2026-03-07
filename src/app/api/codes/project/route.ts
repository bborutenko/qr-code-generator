import { NextRequest, NextResponse } from "next/server";
import { updateCodeProject } from "@/services/code";

export async function PUT(req: NextRequest) {
    try {
        const { hoverCodeId, projectId } = await req.json();

        if (!hoverCodeId || !projectId) {
            return NextResponse.json(
                { error: "hoverCodeId and projectId are required" },
                { status: 400 }
            );
        }

        await updateCodeProject({ hoverCodeId, projectId });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating code project:", error);
        return NextResponse.json(
            { error: "Failed to update project" },
            { status: 500 }
        );
    }
}
