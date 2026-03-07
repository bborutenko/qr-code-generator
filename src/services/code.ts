import { prisma } from "../config/database";
import type { CreateQRCodeParams } from "./hovercode";
import { createQRCode, deleteQRCode } from "./hovercode";
import { HovercodeCreateCode } from "@/schemas/hovercode";

async function createCode(params: CreateQRCodeParams & { existingHovercodeId?: string; existingCode?: HovercodeCreateCode }): Promise<HovercodeCreateCode> {
    const name = params.display_name || "Untitled";
    const projectId = params.projectId || undefined;

    let hovercode_code: HovercodeCreateCode;
    let hovercodeId: string;

    if (params.existingHovercodeId && params.existingCode) {
        // Preview already exists in Hovercode — just save to DB, don't create new
        hovercodeId = params.existingHovercodeId;
        hovercode_code = params.existingCode;
    } else {
        hovercode_code = await createQRCode(params);
        hovercodeId = hovercode_code.id;
    }

    await prisma.code.create({
        data: {
            name,
            projectId,
            hovercodeId,
        },
    });
    return hovercode_code;
}

async function deleteCode(id: string): Promise<{success: boolean; error?: string}> {
    try {
        await prisma.code.delete({ where: { id } });
        await deleteQRCode(id);
        return { success: true };
    } catch (error) {
        console.error("Error deleting code:", error);
        return { success: false, error: "Failed to delete code" };
    }
}

async function updateCodeProject(params: { hoverCodeId: string; projectId: string }) {
    const { hoverCodeId, projectId } = params;
    await prisma.code.update({
        where: { hovercodeId: hoverCodeId },
        data: { projectId },
    });
}

async function getCodesByProject(projectId: string) {
    const codes = await prisma.code.findMany({
        where: { projectId },
    });
    return codes;
}

export { createCode, deleteCode, getCodesByProject, updateCodeProject };