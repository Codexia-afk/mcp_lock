import { NextResponse } from "next/server";
import { CSRF_COOKIE, generateCsrfToken, SESSION_COOKIE } from "@/lib/auth";

export const CSRF_HEADER = "x-csrf-token";

export function csrfTokenFromRequest(request: Request): string | null {
  const header = request.headers.get(CSRF_HEADER);
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieToken = readCookie(cookieHeader, CSRF_COOKIE);
  const headerToken = header?.trim();
  if (!cookieToken || !headerToken) return null;
  if (cookieToken !== headerToken) return null;
  return headerToken;
}

export function readCookie(header: string, name: string): string | null {
  const match = header.split(";").map((p) => p.trim()).find((p) => p.startsWith(`${name}=`));
  if (!match) return null;
  const value = match.slice(name.length + 1);
  return value.length > 0 ? value : null;
}

export function setCsrfCookie(response: NextResponse): NextResponse {
  const token = generateCsrfToken();
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}

export function csrfTokenFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return readCookie(cookieHeader, CSRF_COOKIE);
}

export function jsonResponse(request: Request, data: unknown, status = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  return response;
}

export function errorResponse(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function requireCsrf(request: Request): NextResponse | null {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return null;
  const token = csrfTokenFromRequest(request);
  if (!token) {
    return errorResponse(403, "csrf_failed", "Missing or invalid CSRF token");
  }
  return null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
  };
}

export function oauthStateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/api/auth",
    maxAge: 60 * 60 * 10,
  };
}

export function sessionCookieName() {
  return SESSION_COOKIE;
}
