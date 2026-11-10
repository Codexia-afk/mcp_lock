import { NextResponse } from "next/server";
import { destroyUserSession } from "@/lib/auth";
import { errorResponse, requireCsrf } from "@/lib/api-utils";

export async function POST(request: Request) {
  const blocked = requireCsrf(request);
  if (blocked) return blocked;
  const token = request.headers.get("cookie")?.split(";").map((p) => p.trim()).find((p) => p.startsWith("mcp_lock_session="))?.split("=").slice(1).join("=") ?? "";
  if (token) {
    await destroyUserSession(token);
  }
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set("mcp_lock_session", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
