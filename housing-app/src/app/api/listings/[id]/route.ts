import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  getFavoritedSet,
  getPriceTrackersForListings,
  LISTING_CARD_INCLUDE,
  toListingCardDto,
} from "@/lib/listing-dto";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/listings/[id]">,
) {
  const { id } = await ctx.params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: LISTING_CARD_INCLUDE,
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const session = await getSession();
  const [priceTrackers, favoritedSet] = await Promise.all([
    getPriceTrackersForListings([listing]),
    getFavoritedSet(session?.userId, [listing.id]),
  ]);

  return NextResponse.json(
    toListingCardDto(listing, {
      priceTracker: priceTrackers.get(`${listing.localityId}:${listing.propertyType}`) ?? null,
      isFavorited: favoritedSet.has(listing.id),
    }),
  );
}
