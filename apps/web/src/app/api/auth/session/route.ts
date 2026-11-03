import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { handleError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const session = await getSessionUser({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    const { getDb } = await import("@/lib/db");
    const db = getDb();
    const user = db.prepare("SELECT id, name, email, email_verified AS emailVerified, image, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?").get(session.userId) as any;
    return NextResponse.json({ user: user ? { ...user, emailVerified: !!user.emailVerified } : null }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
