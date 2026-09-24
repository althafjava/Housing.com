import type { Prisma } from "@/generated/prisma/client";
import { PropertyType } from "@/generated/prisma/client";

export interface SearchParams {
  city?: string;
  locality?: string;
  bhk?: string; // comma-separated, e.g. "2,3"
  propertyType?: string; // comma-separated enum values
  priceMin?: string;
  priceMax?: string;
  q?: string;
  sort?: "relevant" | "price_asc" | "price_desc" | "newest";
  page?: string;
}

export const PAGE_SIZE = 20;

const VALID_PROPERTY_TYPES = new Set<string>(Object.values(PropertyType));

function parseNumberList(value: string | undefined): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((n) => !Number.isNaN(n));
}

function parsePropertyTypes(value: string | undefined): PropertyType[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim().toUpperCase())
    .filter((v): v is PropertyType => VALID_PROPERTY_TYPES.has(v));
}

/** Pure function: query params -> Prisma `where` clause. No DB access. */
export function buildSearchWhere(params: SearchParams): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = {};

  if (params.city) {
    where.city = { slug: params.city };
  }

  if (params.locality) {
    where.locality = { slug: params.locality };
  }

  const bhkList = parseNumberList(params.bhk);
  if (bhkList.length > 0) {
    where.bhk = { in: bhkList };
  }

  const propertyTypes = parsePropertyTypes(params.propertyType);
  if (propertyTypes.length > 0) {
    where.propertyType = { in: propertyTypes };
  }

  const priceMin = params.priceMin ? Number(params.priceMin) : undefined;
  const priceMax = params.priceMax ? Number(params.priceMax) : undefined;
  if (
    (priceMin !== undefined && !Number.isNaN(priceMin)) ||
    (priceMax !== undefined && !Number.isNaN(priceMax))
  ) {
    where.price = {
      ...(priceMin !== undefined && !Number.isNaN(priceMin) ? { gte: priceMin } : {}),
      ...(priceMax !== undefined && !Number.isNaN(priceMax) ? { lte: priceMax } : {}),
    };
  }

  if (params.q && params.q.trim().length > 0) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ];
  }

  return where;
}

/** Pure function: sort key -> Prisma `orderBy`. "relevant" is a placeholder
 * (createdAt desc) until a real relevance signal exists. */
export function buildSearchOrderBy(
  sort: SearchParams["sort"],
): Prisma.ListingOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "newest":
      return { createdAt: "desc" };
    case "relevant":
    default:
      return { createdAt: "desc" };
  }
}

export function buildPagination(pageParam: string | undefined) {
  const page = Math.max(1, Number(pageParam) || 1);
  return {
    page,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  };
}
