import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api-context";
import { getLockfileForWorkspace } from "@/lib/queries";
import { handleError } from "@/lib/api-helpers";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await getAuthContext(request);
    const lockfile = getLockfileForWorkspace(id, auth.workspaceId);
    if (!lockfile) {
      return NextResponse.json({ error: { code: "not_found", message: "Behavioral lockfile not found" } }, { status: 404 });
    }
    return NextResponse.json({ lockfile }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
