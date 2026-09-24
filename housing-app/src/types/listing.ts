export interface PriceTrackerDto {
  lowPerSqft: number;
  avgPerSqft: number;
  highPerSqft: number;
  asOfDate: string;
}

export interface ListingCardDto {
  id: string;
  title: string;
  price: number;
  listingType: string;
  propertyType: string;
  status: string;
  bhk: number | null;
  carpetAreaSqft: number | null;
  builtupAreaSqft: number | null;
  imageUrl: string | null;
  city: string;
  locality: string;
  projectName: string | null;
  ownerName: string | null;
  updatedAt: string;
  amenities: string[];
  priceTracker: PriceTrackerDto | null;
  isFavorited: boolean;
}

export interface FacetValue<T> {
  value: T;
  count: number;
}

export interface SearchResponse {
  listings: ListingCardDto[];
  pagination: { page: number; pageSize: number; total: number };
  facets: {
    bhk: FacetValue<number>[];
    propertyType: FacetValue<string>[];
  };
}
