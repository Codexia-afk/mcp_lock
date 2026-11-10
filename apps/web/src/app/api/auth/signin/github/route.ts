import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const response = NextResponse.redirect(new URL("/auth/github-error", request.url));
    return response;
  }
  const url = new URL(request.url);
  const state = randomBytes(24).toString("hex");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const redirectUri = `${url.origin}/api/auth/callback/github`;
  const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "read:user user:email");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  const response = NextResponse.redirect(authorizeUrl.toString());
  response.cookies.set("mcp_lock_oauth_state", JSON.stringify({ state, verifier }), { httpOnly: true, sameSite: "lax", path: "/api/auth", maxAge: 60 * 60 * 10 });
  return response;
}
