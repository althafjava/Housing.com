import { NextRequest, NextResponse } from "next/server";
import { runSearch } from "@/lib/search-service";
import { getSession } from "@/lib/auth";
import type { SearchParams } from "@/lib/search";

function searchParamsFromRequest(request: NextRequest): SearchParams {
  const sp = request.nextUrl.searchParams;
  return {
    city: sp.get("city") ?? undefined,
    locality: sp.get("locality") ?? undefined,
    bhk: sp.get("bhk") ?? undefined,
    propertyType: sp.get("propertyType") ?? undefined,
    priceMin: sp.get("priceMin") ?? undefined,
    priceMax: sp.get("priceMax") ?? undefined,
    q: sp.get("q") ?? undefined,
    sort: (sp.get("sort") as SearchParams["sort"]) ?? "relevant",
    page: sp.get("page") ?? undefined,
  };
}

export async function GET(request: NextRequest) {
  const params = searchParamsFromRequest(request);
  const session = await getSession();
  const result = await runSearch(params, session?.userId);
  return NextResponse.json(result);
}
