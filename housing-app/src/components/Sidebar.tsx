"use client";

import { useRouter, useSearchParams } from "next/navigation";
import FilterGroup from "@/components/FilterGroup";
import type { FacetValue } from "@/types/listing";

const BHK_OPTIONS = [1, 1.5, 2, 2.5, 3];
const PROPERTY_TYPE_OPTIONS = [
  { value: "APARTMENT", label: "Apartment/Flat" },
  { value: "VILLA", label: "Independent House/Villa" },
  { value: "BUILDER_FLOOR", label: "Builder Floor" },
  { value: "ROW_HOUSE", label: "Row House" },
  { value: "FARM_HOUSE", label: "Farm House" },
];
const TOP_LOCALITIES = ["avadi", "guduvanchery", "pallikaranal", "urapakkam", "ambattur"].map((slug) => ({
  slug,
  label: slug[0].toUpperCase() + slug.slice(1),
}));
const BUDGET_OPTIONS = [
  { key: "lt10l", label: "Less than 10 Lacs", priceMin: "", priceMax: "1000000" },
  { key: "10-20l", label: "10 Lacs - 20 Lacs", priceMin: "1000000", priceMax: "2000000" },
  { key: "20-30l", label: "20 Lacs - 30 Lacs", priceMin: "2000000", priceMax: "3000000" },
  { key: "30-40l", label: "30 Lacs - 40 Lacs", priceMin: "3000000", priceMax: "4000000" },
];

function toggleInList(current: string, value: string): string {
  const list = current ? current.split(",") : [];
  const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  return next.join(",");
}

export default function Sidebar({
  facets,
}: {
  facets: { bhk: FacetValue<number>[]; propertyType: FacetValue<string>[] };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function countFor(list: FacetValue<number | string>[], value: number | string): number | null {
    const found = list.find((f) => f.value === value);
    return found ? found.count : null;
  }

  function navigate(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.push(`/search?${params.toString()}`);
  }

  const activeBhk = searchParams.get("bhk") ?? "";
  const activePropertyType = searchParams.get("propertyType") ?? "";
  const activeLocality = searchParams.get("locality") ?? "";
  const activePriceMin = searchParams.get("priceMin") ?? "";
  const activePriceMax = searchParams.get("priceMax") ?? "";

  return (
    <aside className="sidebar" id="sidebar">
      <h3 className="sidebar__title">Quick Refine</h3>

      <FilterGroup title="BHK">
        {BHK_OPTIONS.map((bhk) => (
          <label className="chk" key={bhk}>
            <input
              type="checkbox"
              checked={activeBhk.split(",").includes(String(bhk))}
              onChange={() =>
                navigate((p) => {
                  const next = toggleInList(activeBhk, String(bhk));
                  if (next) p.set("bhk", next);
                  else p.delete("bhk");
                })
              }
            />
            {bhk} BHK
            {countFor(facets.bhk, bhk) !== null && <span className="count">({countFor(facets.bhk, bhk)})</span>}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Property Type">
        {PROPERTY_TYPE_OPTIONS.map((pt) => (
          <label className="chk" key={pt.value}>
            <input
              type="checkbox"
              checked={activePropertyType.split(",").includes(pt.value)}
              onChange={() =>
                navigate((p) => {
                  const next = toggleInList(activePropertyType, pt.value);
                  if (next) p.set("propertyType", next);
                  else p.delete("propertyType");
                })
              }
            />
            {pt.label}
            {countFor(facets.propertyType, pt.value) !== null && (
              <span className="count">({countFor(facets.propertyType, pt.value)})</span>
            )}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Top/Nearby Localities">
        {TOP_LOCALITIES.map((loc) => (
          <label className="chk" key={loc.slug}>
            <input
              type="checkbox"
              checked={activeLocality === loc.slug}
              onChange={() =>
                navigate((p) => {
                  if (activeLocality === loc.slug) p.delete("locality");
                  else p.set("locality", loc.slug);
                })
              }
            />
            {loc.label}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Budget Range">
        {BUDGET_OPTIONS.map((b) => {
          const active = activePriceMin === b.priceMin && activePriceMax === b.priceMax;
          return (
            <label className="chk" key={b.key}>
              <input
                type="checkbox"
                checked={active}
                onChange={() =>
                  navigate((p) => {
                    if (active) {
                      p.delete("priceMin");
                      p.delete("priceMax");
                    } else {
                      if (b.priceMin) p.set("priceMin", b.priceMin);
                      else p.delete("priceMin");
                      if (b.priceMax) p.set("priceMax", b.priceMax);
                      else p.delete("priceMax");
                    }
                  })
                }
              />
              {b.label}
            </label>
          );
        })}
      </FilterGroup>
    </aside>
  );
}
