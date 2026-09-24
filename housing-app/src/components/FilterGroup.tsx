"use client";

import { useState, type ReactNode } from "react";

export default function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="filter-group">
      <button
        className="filter-group__head"
        data-toggle
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
        type="button"
      >
        {title} <i className="chev" />
      </button>
      <div className={`filter-group__body${expanded ? "" : " collapsed"}`}>{children}</div>
    </div>
  );
}
