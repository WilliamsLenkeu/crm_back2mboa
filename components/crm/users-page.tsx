"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "./locale-context";

type AppRole = "admin" | "manager";

type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  createdAt?: string | Date;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UsersPage() {
  const { d, locale } = useLocale();
  const { data: session } = authClient.useSession();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("manager");
  const [formError, setFormError] = useState("");

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

  function openModal() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("manager");
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (busy) return;
    setModalOpen(false);
    setFormError("");
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    const { error: err } = await authClient.admin.createUser({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
    });
    setBusy(false);
    if (err) {
      setFormError(err.message || d.usersCreateError);
      return;
    }
    setModalOpen(false);
    setName("");
    setEmail("");
    setPassword("");
    setRole("manager");
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

  const managers = users.filter((u) => u.role !== "admin").length;
  const admins = users.filter((u) => u.role === "admin").length;

  return (
    <div className="h-full min-h-0 flex flex-col overflow-auto crm-scroll">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <h1 className="text-[24px]">{d.sectionUsers}</h1>
          <p className="text-[14px] text-[var(--text-secondary)] mt-1">{d.usersHint}</p>
        </div>
        <button type="button" className="crm-btn crm-btn-primary !h-10 gap-1.5 shrink-0" onClick={openModal}>
          <i className="bi bi-plus-lg text-[14px]" aria-hidden />
          {d.usersAdd}
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 text-[13px] text-[var(--text-secondary)] shrink-0">
        <span>
          <strong className="text-[var(--text-primary)] tabular-nums">{users.length}</strong> {d.usersList.toLowerCase()}
        </span>
        <span className="text-[var(--border-default)]">·</span>
        <span>
          <strong className="text-[var(--text-primary)] tabular-nums">{admins}</strong>{" "}
          {admins > 1
            ? locale === "en"
              ? "administrators"
              : "administrateurs"
            : d.roleAdmin.toLowerCase()}
        </span>
        <span className="text-[var(--border-default)]">·</span>
        <span>
          <strong className="text-[var(--text-primary)] tabular-nums">{managers}</strong>{" "}
          {managers > 1 ? "managers" : d.roleManager.toLowerCase()}
        </span>
      </div>

      {error ? (
        <p className="mb-3 text-[13px] text-[var(--negative)] shrink-0" role="alert">
          {error}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 pb-8">
        {loading ? (
          <p className="text-[13px] text-[var(--text-tertiary)] py-8">{d.loading}</p>
        ) : users.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[var(--border-default)] rounded-[var(--radius)]">
            <p className="text-[14px] text-[var(--text-secondary)] mb-3">{d.usersEmpty}</p>
            <button type="button" className="crm-btn crm-btn-primary" onClick={openModal}>
              {d.usersAdd}
            </button>
          </div>
        ) : (
          <div className="border border-[var(--border-default)] rounded-[var(--radius)] overflow-hidden bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--surface-card)]">
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
                    {d.usersName}
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)] hidden sm:table-cell">
                    Email
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
                    {locale === "en" ? "Role" : "Rôle"}
                  </th>
                  <th className="px-4 py-2.5 w-28" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isAdmin = u.role === "admin";
                  const isSelf = u.id === session?.user?.id;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-[var(--border-default)] last:border-b-0 hover:bg-[var(--color-primary-light)]/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                              isAdmin
                                ? "bg-[var(--color-primary-light)] text-[var(--color-primary-hover)]"
                                : "bg-[var(--grey-100)] text-[var(--text-secondary)]"
                            }`}
                          >
                            {initials(u.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-medium truncate">
                              {u.name}
                              {isSelf ? (
                                <span className="ml-1.5 text-[11px] font-normal text-[var(--text-tertiary)]">
                                  ({locale === "en" ? "you" : "vous"})
                                </span>
                              ) : null}
                            </p>
                            <p className="text-[12px] text-[var(--text-secondary)] truncate sm:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-[13px] text-[var(--text-secondary)] truncate block max-w-[280px]">
                          {u.email}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-[var(--radius-sm)] ${
                            isAdmin
                              ? "bg-[var(--color-primary-light)] text-[var(--color-primary-hover)]"
                              : "bg-[var(--grey-100)] text-[var(--text-secondary)]"
                          }`}
                        >
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isAdmin ? (
                          <button
                            type="button"
                            className="crm-btn crm-btn-ghost !h-8 !px-2.5 text-[12px] text-[var(--negative)] hover:bg-red-50"
                            disabled={busy}
                            onClick={() => void onDelete(u)}
                          >
                            {d.delete}
                          </button>
                        ) : (
                          <span className="text-[12px] text-[var(--text-tertiary)]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal
            aria-labelledby="users-create-title"
            className="crm-card w-full sm:max-w-md max-h-[90dvh] overflow-auto rounded-t-[16px] sm:rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 id="users-create-title" className="text-[18px] font-bold">
                  {d.usersCreateTitle}
                </h2>
                <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">{d.usersCreateHint}</p>
              </div>
              <button
                type="button"
                className="crm-btn crm-btn-ghost !w-8 !h-8 !p-0"
                onClick={closeModal}
                aria-label={d.close}
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => void onCreate(e)} className="space-y-3">
              <div>
                <p className="crm-label">{d.usersRole}</p>
                <div className="flex gap-2">
                  {(
                    [
                      { k: "manager" as const, label: d.roleManager },
                      { k: "admin" as const, label: d.roleAdmin },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.k}
                      type="button"
                      className={`crm-btn flex-1 !h-9 ${role === opt.k ? "crm-btn-primary" : "crm-btn-secondary"}`}
                      onClick={() => setRole(opt.k)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
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
                  autoFocus
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
                <p className="text-[11px] text-[var(--text-tertiary)] mt-1">{d.usersPasswordHint}</p>
              </div>

              {formError ? (
                <p className="text-[13px] text-[var(--negative)]" role="alert">
                  {formError}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="crm-btn crm-btn-secondary" onClick={closeModal} disabled={busy}>
                  {d.cancel}
                </button>
                <button type="submit" className="crm-btn crm-btn-primary" disabled={busy}>
                  {busy ? d.usersCreating : d.usersCreate}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
