"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@back2mboa.local");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message || "Connexion impossible");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="min-h-dvh grid place-items-center p-6 bg-[var(--surface-page)]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[400px] crm-card p-8 shadow-[var(--shadow-1)]"
      >
        <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--color-primary)] text-white grid place-items-center text-[13px] font-bold tracking-tight mb-5">
          B2
        </div>
        <h1 className="text-[22px] mb-1">Back2Mboa CRM</h1>
        <p className="text-[14px] text-[var(--text-secondary)] mb-6">
          Connexion équipe
        </p>

        <label className="crm-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="crm-input mb-4"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
        />

        <label className="crm-label" htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          className="crm-input mb-4"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {error ? (
          <p className="text-[13px] text-[var(--negative)] mb-3" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="crm-btn crm-btn-primary w-full" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
