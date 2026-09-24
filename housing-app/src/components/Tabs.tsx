"use client";

import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { key: "all", label: "All properties" },
  { key: "affordable", label: "Affordable Homes" },
  { key: "new", label: "New Projects" },
] as const;

export default function Tabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "all";

  function selectTab(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    params.delete("page");

    // Each tab is a preset filter combination applied to the same /api/search call.
    params.delete("priceMax");
    params.delete("propertyType");
    if (key === "affordable") {
      params.set("priceMax", "5000000");
    } else if (key === "new") {
      params.set("propertyType", "APARTMENT,VILLA,BUILDER_FLOOR");
    }

    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="tabs">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`tab${activeTab === tab.key ? " tab--active" : ""}`}
          onClick={() => selectTab(tab.key)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
