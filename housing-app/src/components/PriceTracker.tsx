import type { PriceTrackerDto } from "@/types/listing";

function formatPerSqft(value: number): string {
  return `${Math.round(value).toLocaleString("en-IN")}/Sq.ft`;
}

export default function PriceTracker({ data }: { data: PriceTrackerDto }) {
  return (
    <div className="pricetracker">
      <div className="pricetracker__head">
        <svg viewBox="0 0 24 24" className="pt-icon">
          <path
            d="M4 19h16M7 16V9m5 7V4m5 12v-5"
            stroke="#666"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        pricetracker
      </div>
      <div className="pricetracker__scale">
        <span className="pt-label">Low</span>
        <span className="pt-label pt-avg">Avg</span>
        <span className="pt-label pt-high">High</span>
      </div>
      <div className="pt-bar">
        <span className="pt-fill" />
      </div>
      <div className="pt-values">
        <span className="pt-low">{formatPerSqft(data.lowPerSqft)}</span>
        <span className="pt-high">{formatPerSqft(data.highPerSqft)}</span>
      </div>
    </div>
  );
}
