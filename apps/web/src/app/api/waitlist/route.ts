import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { handleError } from "@/lib/api-helpers";
import { waitlistSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { email?: string; source?: string };
    const parsed = waitlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "validation_failed", message: parsed.error.issues[0]?.message ?? "Invalid email" } }, { status: 400 });
    }
    const db = getDb();
    db.prepare("INSERT INTO waitlist (id, email, source, created_at) VALUES (?, ?, ?, ?)").run(`wl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, parsed.data.email, parsed.data.source ?? "pricing", new Date().toISOString());
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
