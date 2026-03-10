import { prisma } from "../config/database";
import type { Project as ProjectModel } from "@/generated/prisma";
import { deleteQRCode } from "./hovercode";

async function getProjects(): Promise<ProjectModel[]> {
    const projects = await prisma.project.findMany();
    return projects;
}

async function createProject(name: string): Promise<ProjectModel> {
    const project = await prisma.project.create({
        data: {
            name,
        },
    });
    return project;
}

async function deleteProject(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const codes = await prisma.code.findMany({ where: { projectId: id } });
        for (const code of codes) {
            await prisma.code.delete({ where: { id: code.id } });
            await deleteQRCode(code.hovercodeId);
        }
        await prisma.project.delete({ where: { id } });
        return { success: true };
    } catch (error) {
        console.error("Error deleting project:", error);
        return { success: false, error: "Failed to delete project" };
    }
}

export { getProjects, createProject, deleteProject };