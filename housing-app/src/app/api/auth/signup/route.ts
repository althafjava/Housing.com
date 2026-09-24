import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";

const signupSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(8),
  mobile: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, email, password, mobile } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, mobile, passwordHash },
  });

  await setSessionCookie({ userId: user.id, email: user.email });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
}
