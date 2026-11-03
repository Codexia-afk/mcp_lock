import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { createUserSession, logAudit } from "@/lib/auth";
import { getDb } from "@/lib/db";

const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";

interface GitHubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUser {
  login: string;
  name: string | null;
  email?: string | null;
  avatar_url?: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const cookieHeader = request.headers.get("cookie") ?? "";
  const storedState = cookieHeader.split(";").map((p) => p.trim()).find((p) => p.startsWith("mcp_lock_oauth_state="));
  const statePayload = storedState ? JSON.parse(storedState.split(";")[0].split("mcp_lock_oauth_state=")[1] ?? "{}") : {};
  if (!code || !state || statePayload.state !== state) {
    const response = NextResponse.redirect(new URL("/auth/github-error", request.url));
    return response;
  }
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const response = NextResponse.redirect(new URL("/auth/github-error", request.url));
    return response;
  }
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${url.origin}/api/auth/callback/github`,
      code_verifier: statePayload.verifier,
    }),
  });
  const tokenData = (await tokenResponse.json()) as GitHubTokenResponse;
  if (!tokenData.access_token) {
    const response = NextResponse.redirect(new URL("/auth/github-error", request.url));
    return response;
  }
  const userResponse = await fetch(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  const ghUser = (await userResponse.json()) as GitHubUser;
  let email = ghUser.email ?? null;
  if (!email) {
    const emailsResponse = await fetch(GITHUB_EMAILS_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    });
    const emails = (await emailsResponse.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
    const primary = emails.find((e) => e.primary) ?? emails.find((e) => e.verified) ?? emails[0];
    email = primary?.email ?? null;
  }
  if (!email) {
    const response = NextResponse.redirect(new URL("/auth/github-error", request.url));
    return response;
  }
  const db = getDb();
  const userId = `usr_${createHash("sha256").update(email).digest("hex").slice(0, 16)}`;
  db.prepare("INSERT INTO users (id, name, email, email_verified, image, password_hash, created_at, updated_at) VALUES (?, ?, ?, 1, ?, NULL, ?, ?) ON CONFLICT(email) DO NOTHING").run(userId, ghUser.name ?? ghUser.login, email, ghUser.avatar_url ?? null, new Date().toISOString(), new Date().toISOString());
  const user = db.prepare("SELECT id, name, email, email_verified AS emailVerified, image, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE email = ?").get(email) as any;
  const token = await createUserSession(user.id);
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set("mcp_lock_session", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 14 });
  logAudit({ userId: user.id, action: "auth.github_sign_in", targetType: "user", targetId: user.id, metadata: { email } });
  return response;
}
