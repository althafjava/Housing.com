import { prisma } from "@/lib/prisma";
import { buildPagination, buildSearchOrderBy, buildSearchWhere, type SearchParams } from "@/lib/search";
import {
  getFavoritedSet,
  getPriceTrackersForListings,
  LISTING_CARD_INCLUDE,
  toListingCardDto,
} from "@/lib/listing-dto";
import type { SearchResponse } from "@/types/listing";
import type { PropertyType } from "@/generated/prisma/client";

export async function runSearch(params: SearchParams, userId?: string): Promise<SearchResponse> {
  const where = buildSearchWhere(params);
  const orderBy = buildSearchOrderBy(params.sort);
  const { page, skip, take } = buildPagination(params.page);

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({ where, orderBy, skip, take, include: LISTING_CARD_INCLUDE }),
    prisma.listing.count({ where }),
  ]);

  const [priceTrackers, favoritedSet] = await Promise.all([
    getPriceTrackersForListings(listings),
    getFavoritedSet(userId, listings.map((l) => l.id)),
  ]);

  const cards = listings.map((listing) =>
    toListingCardDto(listing, {
      priceTracker: priceTrackers.get(`${listing.localityId}:${listing.propertyType}`) ?? null,
      isFavorited: favoritedSet.has(listing.id),
    }),
  );

  // Facet counts are scoped to the active city only (not the other active
  // filters) — a deliberate MVP simplification so checking one box doesn't
  // make sibling facet counts collapse to zero.
  const facetScope = where.city ? { city: where.city } : {};
  const [bhkFacets, propertyTypeFacets] = await Promise.all([
    prisma.listing.groupBy({ by: ["bhk"], where: facetScope, _count: true, orderBy: { bhk: "asc" } }),
    prisma.listing.groupBy({ by: ["propertyType"], where: facetScope, _count: true }),
  ]);

  return {
    listings: cards,
    pagination: { page, pageSize: take, total },
    facets: {
      bhk: bhkFacets.filter((f) => f.bhk !== null).map((f) => ({ value: f.bhk as number, count: f._count })),
      propertyType: propertyTypeFacets.map((f) => ({
        value: f.propertyType as PropertyType,
        count: f._count,
      })),
    },
  };
}
