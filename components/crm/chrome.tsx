"use client";

import { ACTEURS, type ActeurKey } from "@/lib/acteurs";
import { useLocale } from "./locale-context";
import type { Page } from "./types";
import { Bi, ICONS } from "./icons";

export function AppHeader({
  onMenu,
  onSearch,
  onExport,
  onCreate,
}: {
  onMenu: () => void;
  onSearch: () => void;
  onExport: () => void;
  onCreate: () => void;
}) {
  const { d } = useLocale();
  return (
    <header className="h-14 shrink-0 bg-[var(--surface-card)] border-b border-[var(--border-default)] flex items-center gap-2 px-3 md:px-4">
      <button
        type="button"
        className="md:hidden crm-btn crm-btn-ghost !w-9 !h-9 !p-0"
        aria-label={d.menu}
        onClick={onMenu}
      >
        <Bi name={ICONS.menu} className="text-[18px]" />
      </button>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onSearch}
        className="crm-btn crm-btn-secondary !h-9 !w-9 !p-0"
        aria-label={`${d.search} (Ctrl K)`}
        title="Ctrl K"
      >
        <Bi name={ICONS.search} className="text-[15px]" />
      </button>
      <button type="button" className="crm-btn crm-btn-secondary !h-9 hidden sm:inline-flex gap-1.5" onClick={onExport}>
        <Bi name={ICONS.export} className="text-[14px]" />
        {d.export}
      </button>
      <button type="button" className="crm-btn crm-btn-primary !h-9 !px-3 gap-1" onClick={onCreate}>
        <Bi name={ICONS.plus} className="text-[14px]" />
        <span className="hidden sm:inline">{d.contact}</span>
      </button>
    </header>
  );
}

export function Sidebar({
  open,
  collapsed,
  page,
  acteur,
  total,
  counts,
  recent,
  email,
  isAdmin = false,
  showTypes = true,
  showRecents = true,
  onClose,
  onPage,
  onActeur,
  onOpenRecent,
  onLogout,
  onToggleCollapse,
}: {
  open: boolean;
  collapsed: boolean;
  page: Page;
  acteur: ActeurKey | "";
  total: number;
  counts: Record<string, number>;
  recent: { id: string; nom: string }[];
  email?: string | null;
  isAdmin?: boolean;
  showTypes?: boolean;
  showRecents?: boolean;
  onClose: () => void;
  onPage: (p: Page) => void;
  onActeur: (k: ActeurKey | "") => void;
  onOpenRecent: (id: string) => void;
  onLogout: () => void;
  onToggleCollapse: () => void;
}) {
  const { d } = useLocale();
  const NAV: { k: Page; l: string; icon: string }[] = [
    { k: "dashboard", l: d.dashboard, icon: ICONS.dashboard },
    { k: "contacts", l: d.contacts, icon: ICONS.users },
    { k: "pipeline", l: d.pipeline, icon: ICONS.pipeline },
    ...(isAdmin ? [{ k: "users" as const, l: d.sectionUsers, icon: ICONS.accounts }] : []),
    { k: "settings", l: d.settings, icon: ICONS.settings },
  ];

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-40 bg-black/35 md:hidden transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-label={d.close}
        onClick={onClose}
      />

      <aside
        className={`crm-sidebar shrink-0 bg-[var(--surface-sidebar)] border-r border-[var(--border-default)] flex flex-col
          max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50
          ${collapsed ? "crm-sidebar--rail" : ""}
          ${open ? "crm-sidebar--open" : ""}`}
      >
        <div className="crm-sidebar-brand flex items-center h-14 border-b border-[var(--border-default)] shrink-0 gap-2.5 px-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={32} height={32} className="shrink-0 rounded-[7px]" />
          <div className="crm-sidebar-label min-w-0 leading-tight">
            <p className="text-[14px] font-bold truncate">Back2Mboa</p>
            <p className="text-[11px] text-[var(--color-primary)] font-semibold">CRM</p>
          </div>
        </div>

        <nav className="p-2 flex-1 overflow-auto crm-scroll">
          {NAV.map(({ k, l, icon }) => {
            const on = page === k;
            return (
              <button
                key={k}
                type="button"
                title={l}
                aria-current={on ? "page" : undefined}
                onClick={() => {
                  onPage(k);
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-sm)] text-[14px] font-medium mb-0.5 transition-colors duration-150
                  ${
                    on
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--text-primary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-hover)]"
                  }`}
              >
                <Bi name={icon} className={`text-[16px] shrink-0 ${on ? "opacity-95" : "opacity-70"}`} />
                <span className="crm-sidebar-label truncate">{l}</span>
              </button>
            );
          })}

          <div className="crm-sidebar-extra">
            {showTypes ? (
              <>
                <p className="px-3 mt-4 mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-primary)]">
                  {d.types}
                </p>
                <NavType
                  label={d.contacts}
                  count={total}
                  active={!acteur && page === "contacts"}
                  onClick={() => {
                    onActeur("");
                    onPage("contacts");
                    onClose();
                  }}
                />
                {ACTEURS.map((a) => (
                  <NavType
                    key={a.k}
                    label={a.l}
                    count={counts[a.k] || 0}
                    active={acteur === a.k}
                    onClick={() => {
                      onActeur(a.k);
                      onPage("contacts");
                      onClose();
                    }}
                  />
                ))}
              </>
            ) : null}

            {showRecents && recent.length > 0 ? (
              <>
                <p className="px-3 mt-4 mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-primary)]">
                  {d.recents}
                </p>
                {recent.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      onOpenRecent(r.id);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-[var(--radius-sm)] text-[12px] text-[var(--text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-hover)] truncate"
                  >
                    {r.nom}
                  </button>
                ))}
              </>
            ) : null}
          </div>
        </nav>

        <div className="p-2 border-t border-[var(--border-default)] space-y-1.5">
          <p className="crm-sidebar-label text-[11px] text-[var(--text-tertiary)] truncate px-2">{email}</p>
          <button
            type="button"
            className="crm-btn crm-btn-secondary w-full !h-9 text-[13px] gap-1.5"
            title={collapsed ? d.expand : d.collapse}
            onClick={onToggleCollapse}
          >
            <Bi name={collapsed ? ICONS.expand : ICONS.collapse} className="text-[15px] shrink-0" />
            <span className="crm-sidebar-label">{collapsed ? d.expand : d.collapse}</span>
          </button>
          <button
            type="button"
            className="crm-btn crm-btn-secondary w-full !h-9 text-[13px] gap-1.5"
            title={d.logout}
            onClick={onLogout}
          >
            <Bi name={ICONS.logout} className="text-[15px] shrink-0" />
            <span className="crm-sidebar-label">{d.logout}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function NavType({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-[13px] mb-0.5 transition-colors duration-150 ${
        active
          ? "bg-[var(--color-primary-light)] text-[var(--color-primary-hover)] font-semibold ring-1 ring-[var(--color-primary)]/30"
          : "text-[var(--text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-hover)]"
      }`}
    >
      <span className="truncate text-left">{label}</span>
      <span className="crm-mono text-[11px] shrink-0">{count}</span>
    </button>
  );
}
