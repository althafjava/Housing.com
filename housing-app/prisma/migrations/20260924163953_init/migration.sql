-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('INDIVIDUAL', 'BUILDER', 'AGENT');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('SALE', 'RENT');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'VILLA', 'BUILDER_FLOOR', 'ROW_HOUSE', 'FARM_HOUSE');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('READY_TO_MOVE', 'UNDER_CONSTRUCTION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "mobile" TEXT,
    "oauthProvider" TEXT,
    "oauthId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "state" TEXT NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Locality" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isTopLocality" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Locality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OwnerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "builderId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "listingType" "ListingType" NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "bhk" DOUBLE PRECISION,
    "carpetAreaSqft" DOUBLE PRECISION,
    "builtupAreaSqft" DOUBLE PRECISION,
    "price" DECIMAL(65,30) NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'READY_TO_MOVE',
    "cityId" TEXT NOT NULL,
    "localityId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amenity" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","listingId")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT,
    "channel" TEXT NOT NULL,
    "contactInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceTrackerSnapshot" (
    "id" TEXT NOT NULL,
    "localityId" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "lowPerSqft" DECIMAL(65,30) NOT NULL,
    "avgPerSqft" DECIMAL(65,30) NOT NULL,
    "highPerSqft" DECIMAL(65,30) NOT NULL,
    "asOfDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceTrackerSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE INDEX "Locality_cityId_idx" ON "Locality"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "Locality_cityId_slug_key" ON "Locality"("cityId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_userId_key" ON "Owner"("userId");

-- CreateIndex
CREATE INDEX "Listing_cityId_localityId_propertyType_status_idx" ON "Listing"("cityId", "localityId", "propertyType", "status");

-- CreateIndex
CREATE INDEX "Lead_listingId_createdAt_idx" ON "Lead"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "PriceTrackerSnapshot_localityId_propertyType_asOfDate_idx" ON "PriceTrackerSnapshot"("localityId", "propertyType", "asOfDate");

-- AddForeignKey
ALTER TABLE "Locality" ADD CONSTRAINT "Locality_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_builderId_fkey" FOREIGN KEY ("builderId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "Locality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amenity" ADD CONSTRAINT "Amenity_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
