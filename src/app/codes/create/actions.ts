"use server";

import { createQRCode, CreateQRCodeParams, deleteQRCode } from "@/services/hovercode";
import { createCode } from "@/services/code";
import { getProjects, createProject } from "@/services/project";
import { HovercodeCreateCode } from "@/schemas/hovercode";
import type { ProjectModel } from "@/generated/prisma/models";

export async function createQRCodeAction(
  params: CreateQRCodeParams
): Promise<{ success: true; data: HovercodeCreateCode } | { success: false; error: string }> {
  try {
    const data = await createQRCode(params);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create QR code",
    };
  }
}

export async function createCodeAction(
  params: CreateQRCodeParams & { projectId?: string; existingHovercodeId?: string; existingCode?: HovercodeCreateCode }
): Promise<{ success: true; data: HovercodeCreateCode } | { success: false; error: string }> {
  try {
    const data = await createCode(params);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create QR code",
    };
  }
}

export async function deleteQRCodeAction(id: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await deleteQRCode(id);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete QR code",
    };
  }
}

export async function getProjectsAction(): Promise<{ success: true; data: ProjectModel[] } | { success: false; error: string }> {
  try {
    const data = await getProjects();
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load projects",
    };
  }
}

export async function createProjectAction(
  name: string
): Promise<{ success: true; data: ProjectModel } | { success: false; error: string }> {
  try {
    const data = await createProject(name);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create project",
    };
  }
}