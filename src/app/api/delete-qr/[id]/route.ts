import { NextRequest, NextResponse } from "next/server";
import settings from "@/config/settings";

/**
 * POST /api/delete-qr/[id]
 *
 * Proxy endpoint used by navigator.sendBeacon (fires on page unload).
 * sendBeacon can only send POST requests, so we use this route as a bridge
 * to forward the DELETE call to the Hovercode API.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${settings.HOVERCODE_BASE_URL}/hovercode/${id}/delete/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Token ${settings.HOVERCODE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Hovercode API error: ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
