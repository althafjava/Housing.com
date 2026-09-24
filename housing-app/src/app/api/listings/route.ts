import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { LISTING_CARD_INCLUDE, toListingCardDto } from "@/lib/listing-dto";

const createListingSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  listingType: z.enum(["SALE", "RENT"]),
  propertyType: z.enum(["APARTMENT", "VILLA", "BUILDER_FLOOR", "ROW_HOUSE", "FARM_HOUSE"]),
  bhk: z.number().positive().optional(),
  carpetAreaSqft: z.number().positive().optional(),
  builtupAreaSqft: z.number().positive().optional(),
  price: z.number().positive(),
  cityId: z.string().min(1),
  localityId: z.string().min(1),
  imageUrl: z.string().url().optional(),
});

/** Phase 6 — "Sell/Rent Property for Free". Requires an authenticated user,
 * who is resolved (or lazily created) as an Owner via the Owner.userId link
 * (the fix identified in the implementation_plan.md review: Owner previously
 * had no relation back to the authenticated User). */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const owner = await prisma.owner.upsert({
    where: { userId: session.userId },
    update: {},
    create: {
      userId: session.userId,
      name: session.email,
      type: "INDIVIDUAL",
    },
  });

  const listing = await prisma.listing.create({
    data: {
      ownerId: owner.id,
      title: data.title,
      description: data.description,
      listingType: data.listingType,
      propertyType: data.propertyType,
      bhk: data.bhk,
      carpetAreaSqft: data.carpetAreaSqft,
      builtupAreaSqft: data.builtupAreaSqft,
      price: data.price,
      cityId: data.cityId,
      localityId: data.localityId,
      imageUrl: data.imageUrl,
      status: "READY_TO_MOVE",
    },
    include: LISTING_CARD_INCLUDE,
  });

  return NextResponse.json(toListingCardDto(listing), { status: 201 });
}
