import Link from "next/link";
import type { ListingCardDto } from "@/types/listing";
import FavoriteButton from "@/components/FavoriteButton";
import ContactNowButton from "@/components/ContactNowButton";
import PriceTracker from "@/components/PriceTracker";

const AMENITY_ICON: Record<string, string> = {
  "Power Backup": "⚡",
  Security: "🛡️",
  Parking: "🚗",
};

const MEDIA_CLASS_BY_PROPERTY_TYPE: Record<string, string> = {
  VILLA: "card__media--villa",
  APARTMENT: "card__media--interior",
  BUILDER_FLOOR: "card__media--interior",
  ROW_HOUSE: "card__media--villa2",
  FARM_HOUSE: "card__media--highrise",
};

function formatPrice(price: number): string {
  if (price >= 10_000_000) return `₹ ${(price / 10_000_000).toFixed(price % 10_000_000 === 0 ? 0 : 2)} Cr`;
  if (price >= 100_000) return `₹ ${(price / 100_000).toFixed(price % 100_000 === 0 ? 0 : 2)} L`;
  return `₹ ${price.toLocaleString("en-IN")}`;
}

function statusLabel(status: string): string {
  return status === "READY_TO_MOVE" ? "Ready to move in" : "Under construction";
}

function formatUpdated(iso: string): string {
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
}

export default function PropertyCard({
  listing,
  isAuthenticated,
}: {
  listing: ListingCardDto;
  isAuthenticated: boolean;
}) {
  const area = listing.carpetAreaSqft
    ? { label: "Carpet Area", sqft: listing.carpetAreaSqft }
    : listing.builtupAreaSqft
      ? { label: "Built-up Area", sqft: listing.builtupAreaSqft }
      : null;
  const sqm = area ? (area.sqft * 0.0929).toFixed(2) : null;

  return (
    <article className="card">
      <div
        className={`card__media ${MEDIA_CLASS_BY_PROPERTY_TYPE[listing.propertyType] ?? "card__media--interior"}`}
        style={listing.imageUrl ? { backgroundImage: `url(${listing.imageUrl})` } : undefined}
      >
        <FavoriteButton
          listingId={listing.id}
          initialFavorited={listing.isFavorited}
          isAuthenticated={isAuthenticated}
        />
      </div>
      <div className="card__body">
        <div className="card__pricerow">
          <span className="price">{formatPrice(listing.price)}</span>
          <ContactNowButton listingId={listing.id} />
        </div>

        {area && (
          <div className="area">
            {area.label}: {area.sqft} Sq.ft <span>({sqm} Sq.M)</span>
          </div>
        )}

        <h3 className="card__title">
          <Link href={`/property/${listing.id}`}>{listing.title}</Link>
        </h3>
        <div className="card__meta">
          in {listing.locality} for {listing.listingType === "SALE" ? "Sale" : "Rent"}
        </div>
        <div className="card__status">{statusLabel(listing.status)}</div>

        <div className="card__rowline">
          <span>
            {listing.projectName ? (
              <>Project: <Link href="#">{listing.projectName}</Link></>
            ) : listing.ownerName ? (
              <>Owner: <Link href="#">{listing.ownerName}</Link></>
            ) : (
              "Owner:"
            )}
          </span>
          <span className="updated">
            Updated
            <br />
            {formatUpdated(listing.updatedAt)}
          </span>
        </div>

        <div className="emi">
          EMI: {formatPrice(Math.round(listing.price * 0.00687))} @ 8.35% <span className="star">*</span>{" "}
          <Link href={`/property/${listing.id}#emi`}>Apply Home Loan</Link>
        </div>

        {listing.priceTracker ? (
          <>
            <PriceTracker data={listing.priceTracker} />
            <div className="card__links">
              <Link href={`/property/${listing.id}`} className="thisproperty">
                This Property ▲
              </Link>
              <Link href={`/property/${listing.id}#trends`} className="trends">
                View Transaction Trends &amp; Save Money
              </Link>
            </div>
          </>
        ) : (
          listing.amenities.length > 0 && (
            <div className="amenities">
              <span className="amen-label">KEY AMENITIES</span>
              {listing.amenities.map((key) => (
                <span key={key} className="amen-icon" title={key}>
                  {AMENITY_ICON[key] ?? "•"}
                </span>
              ))}
            </div>
          )
        )}
      </div>
    </article>
  );
}
