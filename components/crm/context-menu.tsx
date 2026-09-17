"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./locale-context";
import type { Page } from "./types";

type Item = { label: string; icon: string; action: () => void; danger?: boolean };

/** Menu contextuel CRM — remplace le menu navigateur sur le shell */
export function CrmContextMenu({
  onNavigate,
  onCreate,
  onSearch,
  onRefresh,
  isAdmin = false,
}: {
  onNavigate: (p: Page) => void;
  onCreate: () => void;
  onSearch: () => void;
  onRefresh: () => void;
  isAdmin?: boolean;
}) {
  const { d } = useLocale();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function onCtx(e: MouseEvent) {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, a[href], [data-native-menu]")) return;
      e.preventDefault();
      const x = Math.min(e.clientX, window.innerWidth - 220);
      const y = Math.min(e.clientY, window.innerHeight - 280);
      setPos({ x, y });
    }
    function close() {
      setPos(null);
    }
    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
    return () => {
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("click", close);
    };
  }, []);

  if (!pos) return null;

  const items: Item[] = [
    { label: d.menuNewContact, icon: "bi-plus-lg", action: onCreate },
    { label: d.search, icon: "bi-search", action: onSearch },
    { label: d.menuRefresh, icon: "bi-arrow-clockwise", action: onRefresh },
    { label: d.dashboard, icon: "bi-grid-1x2", action: () => onNavigate("dashboard") },
    { label: d.contacts, icon: "bi-people", action: () => onNavigate("contacts") },
    { label: d.pipeline, icon: "bi-kanban", action: () => onNavigate("pipeline") },
    ...(isAdmin
      ? [{ label: d.sectionUsers, icon: "bi-person-badge", action: () => onNavigate("users") }]
      : []),
    { label: d.settings, icon: "bi-gear", action: () => onNavigate("settings") },
  ];

  return (
    <div
      role="menu"
      className="fixed z-[100] min-w-[200px] py-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-white shadow-[var(--shadow-2)] crm-pop"
      style={{ left: pos.x, top: pos.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          role="menuitem"
          className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-hover)]"
          onClick={() => {
            it.action();
            setPos(null);
          }}
        >
          <i className={`bi ${it.icon} text-[14px] opacity-70`} aria-hidden />
          {it.label}
        </button>
      ))}
    </div>
  );
}
