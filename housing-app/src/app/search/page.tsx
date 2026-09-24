import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { runSearch } from "@/lib/search-service";
import type { SearchParams } from "@/lib/search";
import Breadcrumb from "@/components/Breadcrumb";
import Sidebar from "@/components/Sidebar";
import Tabs from "@/components/Tabs";
import RelatedPropertiesStrip from "@/components/RelatedPropertiesStrip";
import SortSelect from "@/components/SortSelect";
import PropertyCard from "@/components/PropertyCard";

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const sp = await searchParams;
  const get = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const defaultCity = await prisma.city.findFirst({ orderBy: { name: "asc" } });
  const citySlug = get("city") ?? defaultCity?.slug;

  const params: SearchParams = {
    city: citySlug,
    locality: get("locality"),
    bhk: get("bhk"),
    propertyType: get("propertyType"),
    priceMin: get("priceMin"),
    priceMax: get("priceMax"),
    q: get("q"),
    sort: (get("sort") as SearchParams["sort"]) ?? "relevant",
    page: get("page"),
  };

  const [session, city, locality] = await Promise.all([
    getSession(),
    citySlug ? prisma.city.findUnique({ where: { slug: citySlug } }) : null,
    params.locality
      ? prisma.locality.findFirst({ where: { slug: params.locality } })
      : null,
  ]);

  const result = await runSearch(params, session?.userId);
  const isAuthenticated = Boolean(session);

  return (
    <>
      <Breadcrumb cityName={city?.name ?? "Chennai"} localityName={locality?.name} />

      <div className="page">
        <Suspense>
          <Sidebar facets={result.facets} />
        </Suspense>

        <main className="content">
          <div className="content__toolbar">
            <Suspense>
              <Tabs />
            </Suspense>
            <div className="toolbar__right">
              <button className="btn btn--alert" disabled title="Alerts are coming soon">
                <svg viewBox="0 0 24 24" className="bell-sm">
                  <path
                    d="M12 22a2.2 2.2 0 002.2-2.2h-4.4A2.2 2.2 0 0012 22zM18 16v-5a6 6 0 10-12 0v5l-2 2v1h16v-1z"
                    fill="#f57c00"
                  />
                </svg>
                Set Property Alerts
              </button>
              <button className="icon-btn icon-btn--pin" aria-label="Map view" disabled title="Coming soon">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 22s7-7.2 7-12.5A7 7 0 105 9.5C5 14.8 12 22 12 22z"
                    stroke="#666"
                    strokeWidth="1.6"
                    fill="none"
                  />
                  <circle cx="12" cy="9.5" r="2.2" fill="#666" />
                </svg>
              </button>
            </div>
          </div>

          <RelatedPropertiesStrip citySlug={city?.slug ?? "chennai"}>
            <Suspense>
              <SortSelect />
            </Suspense>
          </RelatedPropertiesStrip>

          <div className="grid">
            {result.listings.length === 0 ? (
              <div className="grid--empty">No properties match these filters yet.</div>
            ) : (
              result.listings.map((listing) => (
                <PropertyCard key={listing.id} listing={listing} isAuthenticated={isAuthenticated} />
              ))
            )}
          </div>
        </main>
      </div>
    </>
  );
}
