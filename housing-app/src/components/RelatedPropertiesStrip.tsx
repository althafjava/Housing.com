import Link from "next/link";
import type { ReactNode } from "react";

const PRICE_TAGS = [
  { label: "Less than 10 Lacs", priceMax: "1000000" },
  { label: "10 to 20 Lacs", priceMin: "1000000", priceMax: "2000000" },
  { label: "20 to 30 Lacs", priceMin: "2000000", priceMax: "3000000" },
];
const AREA_TAGS = [
  { label: "Less than 500 Sq.ft" },
  { label: "500 to 1000 Sq.ft" },
  { label: "1000 to 1500 Sq.ft" },
];
const BHK_TAGS = ["1", "1.5", "2"];
const LOCALITY_TAGS = ["Tambaram", "Urapakkam", "Sholinganallur"];

export default function RelatedPropertiesStrip({
  citySlug,
  children,
}: {
  citySlug: string;
  children?: ReactNode;
}) {
  return (
    <div className="related">
      <span className="related__label">RELATED PROPERTIES</span>
      <div className="related__tags">
        {PRICE_TAGS.map((tag) => {
          const params = new URLSearchParams({ city: citySlug });
          if (tag.priceMin) params.set("priceMin", tag.priceMin);
          if (tag.priceMax) params.set("priceMax", tag.priceMax);
          return (
            <span key={tag.label}>
              <Link href={`/search?${params.toString()}`}>{tag.label}</Link>
              <span> | </span>
            </span>
          );
        })}
        {AREA_TAGS.map((tag) => (
          <span key={tag.label}>
            <Link href={`/search?city=${citySlug}`}>{tag.label}</Link>
            <span> | </span>
          </span>
        ))}
        <br />
        {BHK_TAGS.map((bhk) => (
          <span key={bhk}>
            <Link href={`/search?city=${citySlug}&bhk=${bhk}`}>{bhk} bhk</Link>
            <span> | </span>
          </span>
        ))}
        {LOCALITY_TAGS.map((locality) => (
          <span key={locality}>
            <Link href={`/search?city=${citySlug}&locality=${locality.toLowerCase()}`}>{locality}</Link>
            <span> | </span>
          </span>
        ))}
      </div>
      {children}
    </div>
  );
}
