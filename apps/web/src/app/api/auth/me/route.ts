import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSessionUser({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const { getDb } = await import("@/lib/db");
  const db = getDb();
  const user = db.prepare("SELECT id, name, email, email_verified AS emailVerified, image, created_at AS createdAt, updatedAt FROM users WHERE id = ?").get(session.userId) as any;
  return NextResponse.json({ user: user ? { ...user, emailVerified: !!user.emailVerified } : null }, { status: 200 });
}
