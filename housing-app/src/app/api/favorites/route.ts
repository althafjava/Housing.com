import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { LISTING_CARD_INCLUDE, toListingCardDto } from "@/lib/listing-dto";

/** Live count query, no cache — per project scope, cache/queue infra is
 * excluded from this plan; the header badge always reflects the DB directly. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { listing: { include: LISTING_CARD_INCLUDE } },
  });

  return NextResponse.json({
    count: favorites.length,
    listings: favorites.map((f) => toListingCardDto(f.listing, { isFavorited: true })),
  });
}
