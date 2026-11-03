import { NextResponse } from "next/server";
import { createSampleWorkspace } from "@/lib/sample";
import { getAuthContext } from "@/lib/api-context";
import { handleError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const context = await getAuthContext(request, { allowNoWorkspace: true });
    const { workspaceId } = createSampleWorkspace(context.userId);
    return NextResponse.json({ workspaceId }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
