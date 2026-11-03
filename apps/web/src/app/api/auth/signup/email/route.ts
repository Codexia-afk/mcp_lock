import { NextResponse } from "next/server";
import { createUserSession, hashPassword, logAudit } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { signUpSchema } from "@/lib/validations";
import { errorResponse, requireCsrf } from "@/lib/api-utils";

export async function POST(request: Request) {
  const blocked = requireCsrf(request);
  if (blocked) return blocked;
  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "validation_failed", parsed.error.issues[0]?.message ?? "Invalid signup payload");
  }
  const { name, email, password } = parsed.data;
  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: string } | undefined;
  if (existing) {
    return errorResponse(409, "email_already_registered", "An account already exists for this email address");
  }
  const userId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  db.prepare("INSERT INTO users (id, name, email, email_verified, image, password_hash, created_at, updated_at) VALUES (?, ?, ?, 0, NULL, ?, ?, ?)").run(userId, name, email, hashPassword(password), new Date().toISOString(), new Date().toISOString());
  const token = await createUserSession(userId);
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set("mcp_lock_session", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 14 });
  logAudit({ userId, action: "auth.sign_up", targetType: "user", targetId: userId, metadata: { email } });
  const user = db.prepare("SELECT id, name, email, email_verified AS emailVerified, image, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?").get(userId) as any;
  return NextResponse.json({ user: { ...user, emailVerified: !!user.emailVerified } }, { status: 200 });
}
