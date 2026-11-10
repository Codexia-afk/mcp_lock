import { NextResponse } from "next/server";
import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/queries";
import { getAuthContext } from "@/lib/api-context";
import { handleError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const context = await getAuthContext(request);
    const keys = listApiKeys(context.userId, context.workspaceId);
    const { createHash } = await import("node:crypto");
    void createHash;
    return NextResponse.json({ keys }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getAuthContext(request);
    const body = (await request.json().catch(() => null)) as { name?: string };
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: { code: "validation_failed", message: "API key name is required" } }, { status: 400 });
    }
    const { key, record } = createApiKey(context.userId, context.workspaceId, name);
    return NextResponse.json({ key, record }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
