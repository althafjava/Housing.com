"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "relevant", label: "Relevant" },
  { value: "price_asc", label: "Price - Low to High" },
  { value: "price_desc", label: "Price - High to Low" },
  { value: "newest", label: "Newest First" },
];

export default function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <label className="sortby">
      Sort by
      <select
        value={searchParams.get("sort") ?? "relevant"}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("sort", e.target.value);
          router.push(`/search?${params.toString()}`);
        }}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
