import { prisma } from "@/lib/prisma";
import type { Listing, Amenity, City, Locality, Owner, Project } from "@/generated/prisma/client";
import type { ListingCardDto, PriceTrackerDto } from "@/types/listing";

export type ListingWithRelations = Listing & {
  amenities: Amenity[];
  city: City;
  locality: Locality;
  owner: Owner;
  project: Project | null;
};

/** Serializes a Listing (with relations) into the shape the <PropertyCard> needs. */
export function toListingCardDto(
  listing: ListingWithRelations,
  opts: { priceTracker?: PriceTrackerDto | null; isFavorited?: boolean } = {},
): ListingCardDto {
  return {
    id: listing.id,
    title: listing.title,
    price: Number(listing.price),
    listingType: listing.listingType,
    propertyType: listing.propertyType,
    status: listing.status,
    bhk: listing.bhk,
    carpetAreaSqft: listing.carpetAreaSqft,
    builtupAreaSqft: listing.builtupAreaSqft,
    imageUrl: listing.imageUrl,
    city: listing.city.name,
    locality: listing.locality.name,
    projectName: listing.project?.name ?? null,
    ownerName: listing.owner?.name ?? null,
    updatedAt: listing.updatedAt.toISOString(),
    amenities: listing.amenities.map((a) => a.key),
    priceTracker: opts.priceTracker ?? null,
    isFavorited: opts.isFavorited ?? false,
  };
}

/**
 * Batch-fetches the latest PriceTrackerSnapshot for each distinct
 * (localityId, propertyType) pair among the given listings — one query per
 * distinct pair (typically a handful per page), never one per listing.
 */
export async function getPriceTrackersForListings(
  listings: Pick<Listing, "localityId" | "propertyType">[],
): Promise<Map<string, PriceTrackerDto>> {
  const pairs = new Map<string, { localityId: string; propertyType: Listing["propertyType"] }>();
  for (const l of listings) {
    pairs.set(`${l.localityId}:${l.propertyType}`, {
      localityId: l.localityId,
      propertyType: l.propertyType,
    });
  }

  const results = await Promise.all(
    Array.from(pairs.entries()).map(async ([key, pair]) => {
      const snapshot = await prisma.priceTrackerSnapshot.findFirst({
        where: { localityId: pair.localityId, propertyType: pair.propertyType },
        orderBy: { asOfDate: "desc" },
      });
      return [key, snapshot] as const;
    }),
  );

  const map = new Map<string, PriceTrackerDto>();
  for (const [key, snapshot] of results) {
    if (snapshot) {
      map.set(key, {
        lowPerSqft: Number(snapshot.lowPerSqft),
        avgPerSqft: Number(snapshot.avgPerSqft),
        highPerSqft: Number(snapshot.highPerSqft),
        asOfDate: snapshot.asOfDate.toISOString(),
      });
    }
  }
  return map;
}

/** Batch-fetches which of the given listing ids the user has favorited. */
export async function getFavoritedSet(
  userId: string | undefined,
  listingIds: string[],
): Promise<Set<string>> {
  if (!userId || listingIds.length === 0) return new Set();
  const favorites = await prisma.favorite.findMany({
    where: { userId, listingId: { in: listingIds } },
    select: { listingId: true },
  });
  return new Set(favorites.map((f) => f.listingId));
}

export const LISTING_CARD_INCLUDE = {
  amenities: true,
  city: true,
  locality: true,
  owner: true,
  project: true,
} as const;
