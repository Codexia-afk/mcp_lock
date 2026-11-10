import { NextResponse } from "next/server";
import { assessPolicy } from "@/lib/queries";
import { getAuthContext } from "@/lib/api-context";
import { handleError } from "@/lib/api-helpers";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await getAuthContext(request);
    const body = (await request.json().catch(() => null)) as { scanId?: string };
    const scanId = body?.scanId;
    if (!scanId) {
      return NextResponse.json({ error: { code: "validation_failed", message: "scanId is required" } }, { status: 400 });
    }
    const { assessment, policy } = assessPolicy(id, scanId);
    return NextResponse.json({ assessment, policy }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
