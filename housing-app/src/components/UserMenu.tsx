"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { HeaderUser } from "@/components/Header";

export default function UserMenu({ user }: { user: HeaderUser | null }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) {
    return (
      <Link href="/login" className="signin">
        <svg viewBox="0 0 24 24" className="signin__icon">
          <path
            d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"
            stroke="#333"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <span>Sign In</span>
      </Link>
    );
  }

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggingOut(false);
    router.refresh();
  }

  return (
    <button className="signin" onClick={handleLogout} disabled={loggingOut}>
      <svg viewBox="0 0 24 24" className="signin__icon">
        <path
          d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"
          stroke="#333"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <span>{loggingOut ? "Signing out…" : `Hi, ${user.name ?? user.email} · Sign out`}</span>
    </button>
  );
}
