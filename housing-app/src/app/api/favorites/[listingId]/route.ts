import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/** Toggle: create if absent, delete if present. */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/favorites/[listingId]">,
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const { listingId } = await ctx.params;

  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId: session.userId, listingId } },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { userId_listingId: { userId: session.userId, listingId } },
    });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorite.create({
    data: { userId: session.userId, listingId },
  });
  return NextResponse.json({ favorited: true });
}
