import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

// Addresses a gap noted in the implementation_plan.md review: no
// logout/session-invalidation endpoint existed anywhere in the plan.
export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
