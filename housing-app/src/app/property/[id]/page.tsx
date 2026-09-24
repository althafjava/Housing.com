import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getFavoritedSet, getPriceTrackersForListings, LISTING_CARD_INCLUDE, toListingCardDto } from "@/lib/listing-dto";
import FavoriteButton from "@/components/FavoriteButton";
import ContactNowButton from "@/components/ContactNowButton";
import PriceTracker from "@/components/PriceTracker";
import EmiCalculator from "@/components/EmiCalculator";

export default async function PropertyDetailPage({ params }: PageProps<"/property/[id]">) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({ where: { id }, include: LISTING_CARD_INCLUDE });
  if (!listing) notFound();

  const session = await getSession();
  const [priceTrackers, favoritedSet] = await Promise.all([
    getPriceTrackersForListings([listing]),
    getFavoritedSet(session?.userId, [listing.id]),
  ]);

  const card = toListingCardDto(listing, {
    priceTracker: priceTrackers.get(`${listing.localityId}:${listing.propertyType}`) ?? null,
    isFavorited: favoritedSet.has(listing.id),
  });

  return (
    <div className="page" style={{ gridTemplateColumns: "1fr" }}>
      <main className="content" style={{ maxWidth: 760 }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div
            className="card__media"
            style={{ aspectRatio: "16/7", ...(card.imageUrl ? { backgroundImage: `url(${card.imageUrl})` } : {}) }}
          >
            <FavoriteButton listingId={card.id} initialFavorited={card.isFavorited} isAuthenticated={Boolean(session)} />
          </div>
          <div className="card__body">
            <div className="card__pricerow">
              <span className="price" style={{ fontSize: 24 }}>
                ₹{card.price.toLocaleString("en-IN")}
              </span>
              <ContactNowButton listingId={card.id} />
            </div>
            <h1 style={{ fontSize: 18, margin: "8px 0 4px" }}>{card.title}</h1>
            <div className="card__meta">
              in {card.locality}, {card.city} for {card.listingType === "SALE" ? "Sale" : "Rent"}
            </div>
            <div className="card__status">{card.status === "READY_TO_MOVE" ? "Ready to move in" : "Under construction"}</div>

            {card.projectName && (
              <div className="card__rowline">
                <span>
                  Project: <strong>{card.projectName}</strong>
                </span>
              </div>
            )}
            {card.ownerName && !card.projectName && (
              <div className="card__rowline">
                <span>
                  Owner: <strong>{card.ownerName}</strong>
                </span>
              </div>
            )}

            {card.amenities.length > 0 && (
              <div className="amenities">
                <span className="amen-label">KEY AMENITIES</span>
                {card.amenities.map((a) => (
                  <span key={a} className="amen-icon" title={a}>
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {card.priceTracker && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card__body">
              <PriceTracker data={card.priceTracker} />
              <div id="trends" style={{ marginTop: 16, fontSize: 12.5, color: "var(--text-muted)" }}>
                Transaction-history trends for this locality aren&apos;t available yet — the pricetracker
                summary above (low / avg / high per Sq.ft) reflects the latest snapshot.
              </div>
            </div>
          </div>
        )}

        <EmiCalculator defaultPrincipal={card.price} />
      </main>
    </div>
  );
}
