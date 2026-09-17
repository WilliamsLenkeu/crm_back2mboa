"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "./locale-context";

type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  createdAt?: string | Date;
};

export function UsersPage() {
  const { d, locale } = useLocale();
  const { data: session } = authClient.useSession();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await authClient.admin.listUsers({
      query: { limit: 100, sortBy: "createdAt", sortDirection: "desc" },
    });
    setLoading(false);
    if (err) {
      setError(err.message || d.usersLoadError);
      return;
    }
    setUsers((data?.users || []) as PlatformUser[]);
  }, [d.usersLoadError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await authClient.admin.createUser({
      name: name.trim(),
      email: email.trim(),
      password,
      role: "manager",
    });
    setBusy(false);
    if (err) {
      setError(err.message || d.usersCreateError);
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    await load();
  }

  async function onDelete(u: PlatformUser) {
    if (u.id === session?.user?.id) {
      setError(d.usersCannotDeleteSelf);
      return;
    }
    if (u.role === "admin") {
      setError(d.usersCannotDeleteAdmin);
      return;
    }
    if (!confirm(locale === "en" ? `Delete ${u.email}?` : `Supprimer ${u.email} ?`)) return;
    setBusy(true);
    setError("");
    const { error: err } = await authClient.admin.removeUser({ userId: u.id });
    setBusy(false);
    if (err) {
      setError(err.message || d.usersDeleteError);
      return;
    }
    await load();
  }

  function roleLabel(role?: string | null) {
    if (role === "admin") return d.roleAdmin;
    if (role === "manager" || role === "member" || role === "user") return d.roleManager;
    return role || "—";
  }

  return (
    <div className="h-full min-h-0 flex flex-col overflow-auto crm-scroll">
      <div className="mb-4 shrink-0">
        <h1 className="text-[24px]">{d.sectionUsers}</h1>
        <p className="text-[14px] text-[var(--text-secondary)] mt-1">{d.usersHint}</p>
      </div>

      <div className="max-w-2xl space-y-6 pb-8">
        <form
          onSubmit={(e) => void onCreate(e)}
          className="space-y-3 rounded-[var(--radius)] border border-[var(--border-default)] p-4"
        >
          <h2 className="text-[14px] font-semibold">{d.usersCreateTitle}</h2>
          <div>
            <label className="crm-label" htmlFor="u-name">
              {d.usersName}
            </label>
            <input
              id="u-name"
              className="crm-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              autoComplete="off"
            />
          </div>
          <div>
            <label className="crm-label" htmlFor="u-email">
              Email
            </label>
            <input
              id="u-email"
              className="crm-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div>
            <label className="crm-label" htmlFor="u-pass">
              {d.usersPassword}
            </label>
            <input
              id="u-pass"
              className="crm-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="crm-btn crm-btn-primary" disabled={busy}>
            {busy ? d.usersCreating : d.usersCreate}
          </button>
        </form>

        {error ? (
          <p className="text-[13px] text-[var(--negative)]" role="alert">
            {error}
          </p>
        ) : null}

        <div>
          <h2 className="text-[14px] font-semibold mb-2">{d.usersList}</h2>
          {loading ? (
            <p className="text-[13px] text-[var(--text-tertiary)]">{d.loading}</p>
          ) : users.length === 0 ? (
            <p className="text-[13px] text-[var(--text-tertiary)]">{d.usersEmpty}</p>
          ) : (
            <ul className="divide-y divide-[var(--border-default)] border border-[var(--border-default)] rounded-[var(--radius)] overflow-hidden">
              {users.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-3 py-2.5 bg-white">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium truncate">{u.name}</p>
                    <p className="text-[12px] text-[var(--text-secondary)] truncate">{u.email}</p>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      u.role === "admin"
                        ? "bg-[var(--color-primary-light)] text-[var(--color-primary-hover)]"
                        : "bg-[var(--grey-100)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {roleLabel(u.role)}
                  </span>
                  {u.role !== "admin" ? (
                    <button
                      type="button"
                      className="crm-btn crm-btn-danger !h-8 !px-2.5 text-[12px] shrink-0"
                      disabled={busy}
                      onClick={() => void onDelete(u)}
                    >
                      {d.delete}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
