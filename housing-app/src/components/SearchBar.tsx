"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import Link from "next/link";

const PROPERTY_TYPE_OPTIONS = [
  { value: "", label: "ALL Residential" },
  { value: "APARTMENT", label: "Apartment/Flat" },
  { value: "VILLA", label: "Independent House/Villa" },
  { value: "BUILDER_FLOOR", label: "Builder Floor" },
  { value: "ROW_HOUSE", label: "Row House" },
  { value: "FARM_HOUSE", label: "Farm House" },
];

const PRICE_OPTIONS = [
  { value: "", label: "Any Price", priceMin: "", priceMax: "" },
  { value: "u20l", label: "Under 20 Lacs", priceMin: "", priceMax: "2000000" },
  { value: "20-50l", label: "20 - 50 Lacs", priceMin: "2000000", priceMax: "5000000" },
  { value: "50l-1cr", label: "50 Lacs - 1 Cr", priceMin: "5000000", priceMax: "10000000" },
  { value: "1cr+", label: "Above 1 Cr", priceMin: "10000000", priceMax: "" },
];

export interface CityOption {
  id: string;
  name: string;
  slug: string;
}

export default function SearchBar({
  cities,
  favoritesCount,
}: {
  cities: CityOption[];
  favoritesCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") ?? cities[0]?.slug ?? "");
  const [listingType, setListingType] = useState(searchParams.get("listingType") ?? "SALE");
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [priceKey, setPriceKey] = useState("");
  const [propertyType, setPropertyType] = useState(searchParams.get("propertyType") ?? "");

  function submit(e: FormEvent) {
    e.preventDefault();
    const price = PRICE_OPTIONS.find((p) => p.value === priceKey);
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (q) params.set("q", q);
    if (propertyType) params.set("propertyType", propertyType);
    if (price?.priceMin) params.set("priceMin", price.priceMin);
    if (price?.priceMax) params.set("priceMax", price.priceMax);
    router.push(`/search?${params.toString()}`);
  }

  function scrollToSidebar() {
    document.getElementById("sidebar")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="searchbar">
      <form className="searchbar__inner" onSubmit={submit}>
        <span className="sb-item sb-city">
          <svg viewBox="0 0 24 24" className="pin">
            <path d="M12 22s7-7.2 7-12.5A7 7 0 105 9.5C5 14.8 12 22 12 22z" fill="#fff" />
            <circle cx="12" cy="9.5" r="2.4" fill="#333" />
          </svg>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{ background: "transparent", color: "#fff", border: "none", fontWeight: 600, fontSize: 13 }}
          >
            {cities.map((c) => (
              <option key={c.id} value={c.slug} style={{ color: "#333" }}>
                {c.name}
              </option>
            ))}
          </select>
        </span>

        <select
          className="sb-item sb-buy"
          value={listingType}
          onChange={(e) => setListingType(e.target.value)}
        >
          <option value="SALE">Buy</option>
          <option value="RENT">Rent</option>
        </select>

        <input
          type="text"
          className="sb-search"
          placeholder="Localities, Builders or a Project"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select className="sb-item sb-price" value={priceKey} onChange={(e) => setPriceKey(e.target.value)}>
          {PRICE_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        <select
          className="sb-item sb-type"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
        >
          {PROPERTY_TYPE_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        <button type="submit" className="sb-go" aria-label="Search">
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" stroke="#fff" strokeWidth="2.2" fill="none" />
            <line x1="21" y1="21" x2="16.2" y2="16.2" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>

        <button type="button" className="sb-filter" onClick={scrollToSidebar}>
          <svg viewBox="0 0 24 24">
            <path d="M4 5h16M7 12h10M10 19h4" stroke="#5db85c" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <i className="caret" />
        </button>

        <div className="sb-icons">
          <Link href="/favorites" className="sb-icon" aria-label="Favourites">
            <svg viewBox="0 0 24 24">
              <path
                d="M12 17.3l-5.4 3.2 1.4-6.1L3 9.9l6.2-.5L12 3.7l2.8 5.7 6.2.5-4.9 4.5 1.4 6.1z"
                fill="none"
                stroke="#fff"
                strokeWidth="1.6"
              />
            </svg>
            <span className="dot dot--muted">{favoritesCount}</span>
          </Link>
          <button className="sb-icon" aria-label="Notifications" disabled title="Coming soon">
            <svg viewBox="0 0 24 24">
              <path
                d="M12 22a2.2 2.2 0 002.2-2.2h-4.4A2.2 2.2 0 0012 22zM18 16v-5a6 6 0 10-12 0v5l-2 2v1h16v-1z"
                fill="#fff"
              />
            </svg>
          </button>
          <button className="sb-icon" aria-label="Saved searches" disabled title="Coming soon">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" stroke="#fff" strokeWidth="1.8" fill="none" />
              <line x1="21" y1="21" x2="16.2" y2="16.2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
