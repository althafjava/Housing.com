import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/listings/[id]/price-tracker">,
) {
  const { id } = await ctx.params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { localityId: true, propertyType: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const snapshot = await prisma.priceTrackerSnapshot.findFirst({
    where: { localityId: listing.localityId, propertyType: listing.propertyType },
    orderBy: { asOfDate: "desc" },
  });

  if (!snapshot) {
    return NextResponse.json({ error: "No price-tracker data for this locality yet" }, { status: 404 });
  }

  return NextResponse.json({
    lowPerSqft: Number(snapshot.lowPerSqft),
    avgPerSqft: Number(snapshot.avgPerSqft),
    highPerSqft: Number(snapshot.highPerSqft),
    asOfDate: snapshot.asOfDate.toISOString(),
  });
}
