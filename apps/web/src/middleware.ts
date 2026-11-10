import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/app", "/settings", "/team"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!isProtected) {
    return NextResponse.next();
  }
  const hasSession = request.cookies.has("mcp_lock_session");
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/settings/:path*", "/team/:path*"],
};
