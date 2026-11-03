import { NextResponse } from "next/server";
import { createUserSession, hashPassword, logAudit } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { signInSchema } from "@/lib/validations";
import { errorResponse, requireCsrf } from "@/lib/api-utils";

export async function POST(request: Request) {
  const blocked = requireCsrf(request);
  if (blocked) return blocked;
  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "validation_failed", parsed.error.issues[0]?.message ?? "Invalid sign-in payload");
  }
  const { email, password } = parsed.data;
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  if (!user || !user.password_hash) {
    return errorResponse(401, "invalid_credentials", "Invalid email or password");
  }
  const ok = await import("@/lib/auth").then((m) => m.verifyPassword(password, user.password_hash));
  if (!ok) {
    return errorResponse(401, "invalid_credentials", "Invalid email or password");
  }
  const token = await createUserSession(user.id);
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set("mcp_lock_session", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 14 });
  logAudit({ userId: user.id, action: "auth.sign_in", targetType: "user", targetId: user.id, metadata: { email } });
  const fresh = db.prepare("SELECT id, name, email, email_verified AS emailVerified, image, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?").get(user.id) as any;
  return NextResponse.json({ user: { ...fresh, emailVerified: !!fresh.emailVerified } }, { status: 200 });
}
