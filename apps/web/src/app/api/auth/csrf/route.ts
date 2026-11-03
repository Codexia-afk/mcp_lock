import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/auth";
import { NextResponse as NR } from "next/server";

export async function GET() {
  const token = generateCsrfToken();
  const response = NextResponse.json({ csrfToken: token }, { status: 200 });
  response.cookies.set("mcp_lock_csrf", token, { httpOnly: false, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
  return response;
}
