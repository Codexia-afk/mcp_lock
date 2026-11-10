import { NextResponse } from "next/server";
import { createServer, listServers } from "@/lib/queries";
import { getAuthContext } from "@/lib/api-context";
import { handleError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const context = await getAuthContext(request);
    const servers = listServers(context.workspaceId);
    return NextResponse.json({ servers }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getAuthContext(request);
    const body = (await request.json().catch(() => null)) as { name?: string; packageName?: string; version?: string; source?: string; imageDigest?: string; projectId?: string };
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const projectId = body?.projectId;
    if (!name || !projectId) {
      return NextResponse.json({ error: { code: "validation_failed", message: "Server name and projectId are required" } }, { status: 400 });
    }
    const server = createServer(context.workspaceId, projectId, { name, packageName: body?.packageName, version: body?.version, source: body?.source, imageDigest: body?.imageDigest });
    return NextResponse.json({ server }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
