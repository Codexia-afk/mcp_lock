import { NextResponse } from "next/server";
import { deleteServer } from "@/lib/queries";
import { getAuthContext } from "@/lib/api-context";
import { handleError } from "@/lib/api-helpers";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await getAuthContext(request);
    const ok = deleteServer(id, auth.workspaceId);
    return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
  } catch (error) {
    return handleError(error);
  }
}
