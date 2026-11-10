import { NextResponse } from "next/server";
import { listAuditEvents } from "@/lib/queries";
import { getAuthContext } from "@/lib/api-context";
import { handleError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const context = await getAuthContext(request);
    const url = new URL(request.url);
    const limitParam = Number(url.searchParams.get("limit") ?? 50);
    const offsetParam = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(100, limitParam) : 50;
    const offset = Number.isFinite(offsetParam) && offsetParam > 0 ? offsetParam : 0;
    const events = listAuditEvents(context.workspaceId, limit, offset);
    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
