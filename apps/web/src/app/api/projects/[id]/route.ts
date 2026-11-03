import { NextResponse } from "next/server";
import { deleteProject } from "@/lib/queries";
import { getAuthContext } from "@/lib/api-context";
import { handleError } from "@/lib/api-helpers";

export async function DELETE(request: Request) {
  try {
    const context = await getAuthContext(request);
    const body = (await request.json().catch(() => null)) as { id?: string };
    const projectId = body?.id;
    if (!projectId) {
      return NextResponse.json({ error: { code: "validation_failed", message: "Project id is required" } }, { status: 400 });
    }
    const result = deleteProject(projectId);
    return NextResponse.json({ ok: result }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
