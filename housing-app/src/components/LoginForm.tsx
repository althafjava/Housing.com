"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Login failed");
        return;
      }
      router.push("/search");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authpage">
      <h1>Sign in</h1>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
      <p className="authpage__switch">
        New here? <Link href="/signup">Create an account</Link>
      </p>
    </div>
  );
}
