"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, mobile: mobile || undefined }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(typeof body.error === "string" ? body.error : "Signup failed");
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
      <h1>Create your account</h1>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Password (min 8 characters)</label>
          <input
            type="password"
            value={password}
            minLength={8}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Mobile Number</label>
          <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} />
        </div>
        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Sign Up"}
        </button>
      </form>
      <p className="authpage__switch">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
