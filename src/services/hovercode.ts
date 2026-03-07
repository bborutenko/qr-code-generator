"use server";
import settings from "@/config/settings";
import { HovercodeDisplayCode, HovercodeCreateCode, HovercodeResultsWithMessage, HovercodePaginatedResponse, HovercodePaginatedAnalyticsResponse, } from "@/schemas/hovercode";
import { handleHovercodeError } from "@/errors/hovercode";

export interface CreateQRCodeParams {
    qr_data: string;
    qr_type: "Link" | "Text";
    dynamic?: boolean;
    display_name?: string;
    generate_png?: boolean;
    logo_url?: string;
    logo_round?: boolean;
    primary_color?: string;
    background_color?: string;
    pattern?: string;
    eye_style?: string;
    frame?: string;
    has_border?: boolean;
    text?: string;
    size?: number;
    projectId?: string;
}

export interface UpdateQRCodeParams {
    qr_data?: string;
    display_name?: string;
}

async function createQRCode(params: CreateQRCodeParams): Promise<HovercodeCreateCode> {
    const body: Record<string, unknown> = {
        workspace: settings.HOVERCODE_WORKSPACE_ID,
        qr_data: params.qr_data,
        qr_type: params.qr_type,
    };

    if (params.dynamic !== undefined) body.dynamic = params.dynamic;
    if (params.display_name) body.display_name = params.display_name;
    if (params.generate_png !== undefined) body.generate_png = params.generate_png;
    if (params.logo_url) body.logo_url = params.logo_url;
    if (params.logo_round !== undefined) body.logo_round = params.logo_round;
    if (params.primary_color) body.primary_color = params.primary_color;
    if (params.background_color) body.background_color = params.background_color;
    if (params.pattern) body.pattern = params.pattern;
    if (params.eye_style) body.eye_style = params.eye_style;
    if (params.frame) body.frame = params.frame;
    if (params.has_border !== undefined) body.has_border = params.has_border;
    if (params.text) body.text = params.text;
    if (params.size) body.size = params.size;

    const response = await fetch(`${settings.HOVERCODE_BASE_URL}/hovercode/create/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${settings.HOVERCODE_API_KEY}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        await handleHovercodeError(response);
    }

    const data = await response.json();
    return data as HovercodeCreateCode;
}

async function getQRCodes(): Promise<HovercodePaginatedResponse | HovercodeResultsWithMessage> {
    const response = await fetch(`${settings.HOVERCODE_BASE_URL}/workspace/${settings.HOVERCODE_WORKSPACE_ID}/hovercodes/`, {
        headers: {
            "Authorization": `Token ${settings.HOVERCODE_API_KEY}`,
        },
    });

    if (!response.ok) {
        await handleHovercodeError(response);
    }

    const data = await response.json();
    if (data.message) {
        return data as HovercodeResultsWithMessage;
    }

    return data as HovercodePaginatedResponse;
}

async function getQRCode(id: string): Promise<HovercodeDisplayCode | null> {
    const response = await fetch(`${settings.HOVERCODE_BASE_URL}/hovercode/${id}/`, {
        headers: {
            "Authorization": `Token ${settings.HOVERCODE_API_KEY}`,
        },
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        await handleHovercodeError(response);
    }

    const data = await response.json();
    return data as HovercodeDisplayCode;
    
}

async function deleteQRCode(id: string): Promise<{success: boolean}> {
    const response = await fetch(`${settings.HOVERCODE_BASE_URL}/hovercode/${id}/delete/`, {
        method: "DELETE",
        headers: {
            "Authorization": `Token ${settings.HOVERCODE_API_KEY}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        await handleHovercodeError(response);
        return { success: false };
    }

    return { success: true };
}

async function updateQRCode(id: string, params: Partial<UpdateQRCodeParams>): Promise<HovercodeDisplayCode> {

    const response = await fetch(`${settings.HOVERCODE_BASE_URL}/hovercode/${id}/update/`, {
        method: "PUT",
        headers: {
            "Authorization": `Token ${settings.HOVERCODE_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        await handleHovercodeError(response);
    }

    const data = await response.json();
    return data as HovercodeDisplayCode;
}

async function getQRCodeAnalytics(id: string): Promise<HovercodePaginatedAnalyticsResponse> {
    const response = await fetch(`${settings.HOVERCODE_BASE_URL}/hovercode/${id}/activity/`, {
        headers: {
            "Authorization": `Token ${settings.HOVERCODE_API_KEY}`,
        },
    });

    if (!response.ok) {
        await handleHovercodeError(response);
    }

    const data = await response.json();
    return data as HovercodePaginatedAnalyticsResponse;
}

export { createQRCode, getQRCodes, deleteQRCode, getQRCode, updateQRCode, getQRCodeAnalytics };