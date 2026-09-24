"use client";

import { useState } from "react";

export default function ContactNowButton({ listingId }: { listingId: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleClick() {
    setState("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, channel: "contact_now" }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <button className="btn btn--contact" disabled>
        Contact requested
      </button>
    );
  }

  return (
    <button className="btn btn--contact" onClick={handleClick} disabled={state === "sending"}>
      <svg viewBox="0 0 24 24">
        <path
          d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C11 21 3 13 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.2 2.2z"
          fill="#fff"
        />
      </svg>
      {state === "sending" ? "Sending…" : state === "error" ? "Try again" : "Contact Now"}
    </button>
  );
}
