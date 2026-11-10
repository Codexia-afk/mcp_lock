import { NextResponse } from "next/server";
import { jsonErrorResponse } from "@/lib/errors";

export function handleError(error: unknown): NextResponse {
  const { status, body } = jsonErrorResponse(error);
  return NextResponse.json(body, { status });
}
