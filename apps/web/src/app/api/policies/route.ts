import { NextResponse } from "next/server";
import { createPolicy, listPolicies } from "@/lib/queries";
import { getAuthContext } from "@/lib/api-context";
import { handleError } from "@/lib/api-helpers";
import { validatePolicy, type Policy } from "@/lib/policy";

export async function GET(request: Request) {
  try {
    const context = await getAuthContext(request);
    const policies = listPolicies(context.workspaceId);
    return NextResponse.json({ policies }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getAuthContext(request);
    const body = (await request.json().catch(() => null)) as Policy;
    const policy = validatePolicy(body);
    const created = createPolicy(context.workspaceId, policy);
    return NextResponse.json({ policy: created }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
