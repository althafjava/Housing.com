import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const city = await prisma.city.upsert({
    where: { slug: "chennai" },
    update: {},
    create: { name: "Chennai", slug: "chennai", state: "Tamil Nadu" },
  });

  const localities = await Promise.all(
    [
      { name: "ECR", slug: "ecr", isTopLocality: false },
      { name: "Porur", slug: "porur", isTopLocality: false },
      { name: "Perungudi", slug: "perungudi", isTopLocality: false },
      { name: "Avadi", slug: "avadi", isTopLocality: true },
      { name: "Guduvanchery", slug: "guduvanchery", isTopLocality: true },
      { name: "Pallikaranal", slug: "pallikaranal", isTopLocality: true },
      { name: "Urapakkam", slug: "urapakkam", isTopLocality: true },
      { name: "Ambattur", slug: "ambattur", isTopLocality: true },
      { name: "Tambaram", slug: "tambaram", isTopLocality: false },
      { name: "Sholinganallur", slug: "sholinganallur", isTopLocality: false },
    ].map((l) =>
      prisma.locality.upsert({
        where: { cityId_slug: { cityId: city.id, slug: l.slug } },
        update: {},
        create: { ...l, cityId: city.id },
      }),
    ),
  );

  const localityBySlug = Object.fromEntries(localities.map((l) => [l.slug, l]));

  async function ownerFor(email: string, name: string, type: "INDIVIDUAL" | "BUILDER") {
    const passwordHash = await bcrypt.hash("password123", 10);
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, passwordHash },
    });
    return prisma.owner.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, name, type },
    });
  }

  const myansBuilder = await ownerFor("builder@myans.example.com", "Myans Builders", "BUILDER");
  const sivapratap = await ownerFor("sivapratap@example.com", "sivapratap", "INDIVIDUAL");
  const porurOwner = await ownerFor("owner@example.com", "Independent Owner", "INDIVIDUAL");

  const project = await prisma.project.upsert({
    where: { id: "seed-myans-luxury-villas-a" },
    update: {},
    create: {
      id: "seed-myans-luxury-villas-a",
      name: "Myans Luxury Villas A",
      builderId: myansBuilder.id,
    },
  });

  // Clear existing seeded listings so re-running the seed stays idempotent.
  await prisma.amenity.deleteMany({ where: { listing: { id: { startsWith: "seed-" } } } });
  await prisma.listing.deleteMany({ where: { id: { startsWith: "seed-" } } });

  const listings = [
    {
      id: "seed-listing-1",
      title: "5765 Sq.ft Independent House in ECR",
      listingType: "SALE" as const,
      propertyType: "VILLA" as const,
      builtupAreaSqft: 5765,
      price: 75_000_000,
      cityId: city.id,
      localityId: localityBySlug.ecr.id,
      projectId: project.id,
      ownerId: myansBuilder.id,
      amenities: ["Power Backup", "Security", "Parking"],
    },
    {
      id: "seed-listing-2",
      title: "2 BHK Apartment/Flat in Porur",
      listingType: "SALE" as const,
      propertyType: "APARTMENT" as const,
      bhk: 2,
      carpetAreaSqft: 880,
      price: 9_500_000,
      cityId: city.id,
      localityId: localityBySlug.porur.id,
      ownerId: porurOwner.id,
      amenities: [],
    },
    {
      id: "seed-listing-3",
      title: "3 BHK Apartment/Flat in Perungudi",
      listingType: "SALE" as const,
      propertyType: "APARTMENT" as const,
      bhk: 3,
      carpetAreaSqft: 1280,
      price: 36_000_000,
      cityId: city.id,
      localityId: localityBySlug.perungudi.id,
      ownerId: sivapratap.id,
      amenities: [],
    },
    {
      id: "seed-listing-4",
      title: "4 BHK Independent House/Villa in ECR",
      listingType: "SALE" as const,
      propertyType: "VILLA" as const,
      bhk: 4,
      builtupAreaSqft: 4895,
      price: 65_000_000,
      cityId: city.id,
      localityId: localityBySlug.ecr.id,
      projectId: project.id,
      ownerId: myansBuilder.id,
      amenities: ["Power Backup", "Security", "Parking"],
    },
    {
      id: "seed-listing-5",
      title: "4 BHK Independent House/Villa in ECR",
      listingType: "SALE" as const,
      propertyType: "VILLA" as const,
      bhk: 4,
      builtupAreaSqft: 4933,
      price: 65_000_000,
      cityId: city.id,
      localityId: localityBySlug.ecr.id,
      projectId: project.id,
      ownerId: myansBuilder.id,
      amenities: ["Power Backup", "Security", "Parking"],
    },
    {
      id: "seed-listing-6",
      title: "2 BHK Apartment/Flat in Porur",
      listingType: "SALE" as const,
      propertyType: "APARTMENT" as const,
      bhk: 2,
      carpetAreaSqft: 880,
      price: 9_500_000,
      cityId: city.id,
      localityId: localityBySlug.porur.id,
      ownerId: porurOwner.id,
      amenities: [],
    },
  ];

  for (const { amenities, ...listingData } of listings) {
    await prisma.listing.create({
      data: {
        ...listingData,
        status: "READY_TO_MOVE",
        amenities: { create: amenities.map((key) => ({ key })) },
      },
    });
  }

  await prisma.priceTrackerSnapshot.deleteMany({});
  await prisma.priceTrackerSnapshot.createMany({
    data: [
      {
        localityId: localityBySlug.porur.id,
        propertyType: "APARTMENT",
        lowPerSqft: 2412,
        avgPerSqft: 4500,
        highPerSqft: 7692,
      },
      {
        localityId: localityBySlug.perungudi.id,
        propertyType: "APARTMENT",
        lowPerSqft: 2236,
        avgPerSqft: 5800,
        highPerSqft: 10311,
      },
    ],
  });

  console.log("Seed complete:", {
    city: city.name,
    localities: localities.length,
    listings: listings.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
