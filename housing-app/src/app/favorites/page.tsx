import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { LISTING_CARD_INCLUDE, toListingCardDto } from "@/lib/listing-dto";
import PropertyCard from "@/components/PropertyCard";

export default async function FavoritesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { listing: { include: LISTING_CARD_INCLUDE } },
  });

  return (
    <div className="page" style={{ gridTemplateColumns: "1fr" }}>
      <main className="content">
        <h1 style={{ fontSize: 20, margin: "16px 0" }}>Your favorites</h1>
        <div className="grid">
          {favorites.length === 0 ? (
            <div className="grid--empty">You haven&apos;t saved any properties yet.</div>
          ) : (
            favorites.map((f) => (
              <PropertyCard
                key={f.listingId}
                listing={toListingCardDto(f.listing, { isFavorited: true })}
                isAuthenticated
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
