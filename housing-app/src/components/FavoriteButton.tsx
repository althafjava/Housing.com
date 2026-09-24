"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FavoriteButton({
  listingId,
  initialFavorited,
  isAuthenticated,
}: {
  listingId: string;
  initialFavorited: boolean;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    // Optimistic toggle with rollback on failure, matching the prototype's
    // instant-feedback script.js behavior.
    const next = !favorited;
    setFavorited(next);
    setPending(true);
    try {
      const res = await fetch(`/api/favorites/${listingId}`, { method: "POST" });
      if (!res.ok) throw new Error("Request failed");
      router.refresh();
    } catch {
      setFavorited(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button className="fav" aria-label="Save" onClick={toggle} disabled={pending}>
      <svg viewBox="0 0 24 24">
        <path
          d="M12 17.3l-5.4 3.2 1.4-6.1L3 9.9l6.2-.5L12 3.7l2.8 5.7 6.2.5-4.9 4.5 1.4 6.1z"
          fill={favorited ? "#f4b400" : "none"}
          stroke="#f4b400"
          strokeWidth="1.6"
        />
      </svg>
    </button>
  );
}
