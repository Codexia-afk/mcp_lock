import { NextResponse } from "next/server";
import { revokeApiKey } from "@/lib/queries";
import { getAuthContext } from "@/lib/api-context";
import { handleError } from "@/lib/api-helpers";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = await getAuthContext(_request);
    revokeApiKey(id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
