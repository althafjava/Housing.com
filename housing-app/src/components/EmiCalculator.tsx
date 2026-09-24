"use client";

import { useState, type FormEvent } from "react";
import type { EmiResult } from "@/lib/emi";

export default function EmiCalculator({ defaultPrincipal }: { defaultPrincipal: number }) {
  const [principal, setPrincipal] = useState(defaultPrincipal);
  const [rate, setRate] = useState(8.35);
  const [years, setYears] = useState(20);
  const [result, setResult] = useState<EmiResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/emi/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ principal, annualRatePercent: rate, tenureYears: years }),
      });
      if (res.ok) setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="emi" style={{ marginTop: 24, padding: 16, border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "#fff" }}>
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>EMI Calculator</h3>
      <form onSubmit={submit} className="field-row" style={{ marginBottom: 12 }}>
        <div className="field">
          <label>Loan Amount (₹)</label>
          <input type="number" value={principal} min={1} onChange={(e) => setPrincipal(Number(e.target.value))} />
        </div>
        <div className="field">
          <label>Interest Rate (% p.a.)</label>
          <input type="number" step="0.01" value={rate} min={0} onChange={(e) => setRate(Number(e.target.value))} />
        </div>
        <div className="field">
          <label>Tenure (years)</label>
          <input type="number" value={years} min={1} onChange={(e) => setYears(Number(e.target.value))} />
        </div>
        <div className="field" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? "Calculating…" : "Calculate"}
          </button>
        </div>
      </form>
      {result && (
        <p style={{ fontSize: 13 }}>
          Monthly EMI: <strong>₹{result.monthlyEmi.toLocaleString("en-IN")}</strong> · Total interest: ₹
          {result.totalInterest.toLocaleString("en-IN")} · Total payment: ₹
          {result.totalPayment.toLocaleString("en-IN")}
        </p>
      )}
    </div>
  );
}
