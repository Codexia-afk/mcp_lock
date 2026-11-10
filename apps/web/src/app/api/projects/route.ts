import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/queries";
import { getAuthContext } from "@/lib/api-context";
import { handleError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const context = await getAuthContext(request);
    const projects = listProjects(context.workspaceId);
    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getAuthContext(request);
    const body = (await request.json().catch(() => null)) as { name?: string; description?: string };
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: { code: "validation_failed", message: "Project name is required" } }, { status: 400 });
    }
    const project = createProject(context.workspaceId, name, typeof body?.description === "string" ? body.description : undefined);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
