"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export interface LocalityOption {
  id: string;
  name: string;
  cityId: string;
}

const PROPERTY_TYPES = ["APARTMENT", "VILLA", "BUILDER_FLOOR", "ROW_HOUSE", "FARM_HOUSE"];

export default function CreateListingForm({
  cities,
  localities,
}: {
  cities: { id: string; name: string }[];
  localities: LocalityOption[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [listingType, setListingType] = useState<"SALE" | "RENT">("SALE");
  const [propertyType, setPropertyType] = useState(PROPERTY_TYPES[0]);
  const [bhk, setBhk] = useState("");
  const [area, setArea] = useState("");
  const [price, setPrice] = useState("");
  const [cityId, setCityId] = useState(cities[0]?.id ?? "");
  const [localityId, setLocalityId] = useState(
    localities.find((l) => l.cityId === cities[0]?.id)?.id ?? "",
  );
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const localitiesForCity = localities.filter((l) => l.cityId === cityId);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          listingType,
          propertyType,
          bhk: bhk ? Number(bhk) : undefined,
          carpetAreaSqft: area ? Number(area) : undefined,
          price: Number(price),
          cityId,
          localityId,
          imageUrl: imageUrl || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(typeof body.error === "string" ? body.error : "Could not create listing");
        return;
      }
      router.push(`/property/${body.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="formpage formpage--wide">
      <h1>Sell/Rent Property for Free</h1>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Listing Type</label>
            <select value={listingType} onChange={(e) => setListingType(e.target.value as "SALE" | "RENT")}>
              <option value="SALE">Sale</option>
              <option value="RENT">Rent</option>
            </select>
          </div>
          <div className="field">
            <label>Property Type</label>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
              {PROPERTY_TYPES.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>BHK</label>
            <input type="number" step="0.5" value={bhk} onChange={(e) => setBhk(e.target.value)} />
          </div>
          <div className="field">
            <label>Area (Sq.ft)</label>
            <input type="number" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Price (₹)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min={1} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>City</label>
            <select
              value={cityId}
              onChange={(e) => {
                setCityId(e.target.value);
                setLocalityId(localities.find((l) => l.cityId === e.target.value)?.id ?? "");
              }}
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Locality</label>
            <select value={localityId} onChange={(e) => setLocalityId(e.target.value)}>
              {localitiesForCity.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Image URL (optional)</label>
          <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
        </div>
        <button className="btn btn--primary" type="submit" disabled={loading || !localityId}>
          {loading ? "Publishing…" : "Publish Listing"}
        </button>
      </form>
    </div>
  );
}
