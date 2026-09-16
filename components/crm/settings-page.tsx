"use client";

import { useEffect, useState } from "react";
import { ACTEURS } from "@/lib/acteurs";
import type { Locale } from "@/lib/i18n";
import { useLocale } from "./locale-context";
import type { Page } from "./types";

export type UserPrefs = {
  columnWidths?: Record<string, number>;
  formDefaultActeur?: string;
  sidebarCollapsed?: boolean;
  defaultPage?: Page;
  showNavTypes?: boolean;
  showNavRecents?: boolean;
  pageSize?: number;
  locale?: Locale;
};

type Section = "language" | "nav";

/** Layout settings : nav latérale + panneau (pattern SaaS sidebar+content) */
export function SettingsPage({
  prefs,
  onSavePrefs,
  email,
}: {
  prefs: UserPrefs;
  onSavePrefs: (p: UserPrefs) => Promise<void>;
  email?: string | null;
}) {
  const { d } = useLocale();
  const [section, setSection] = useState<Section>("language");
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState(prefs);

  useEffect(() => setLocal(prefs), [prefs]);

  async function persist(next: UserPrefs) {
    setLocal(next);
    setSaving(true);
    await onSavePrefs(next);
    setSaving(false);
  }

  const nav: { id: Section; label: string; icon: string }[] = [
    { id: "language", label: d.sectionLanguage, icon: "bi-translate" },
    { id: "nav", label: d.sectionNav, icon: "bi-layout-sidebar" },
  ];

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-[24px]">{d.settings}</h1>
        <p className="text-[14px] text-[var(--text-secondary)] mt-1">
          {d.settingsHint}
          {email ? ` — ${email}` : ""}
          {saving ? "…" : ""}
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-0 md:gap-6 overflow-hidden">
        <nav className="md:hidden flex gap-1 overflow-x-auto crm-scroll pb-2 shrink-0" aria-label={d.settings}>
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`crm-btn !h-9 shrink-0 gap-1.5 text-[13px] ${
                section === item.id ? "crm-btn-primary" : "crm-btn-secondary"
              }`}
            >
              <i className={`bi ${item.icon}`} aria-hidden />
              {item.label}
            </button>
          ))}
        </nav>

        <nav className="hidden md:flex w-52 shrink-0 flex-col gap-0.5 overflow-auto crm-scroll" aria-label={d.settings}>
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              aria-current={section === item.id ? "page" : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-sm)] text-[14px] text-left font-medium transition-colors ${
                section === item.id
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-hover)]"
              }`}
            >
              <i className={`bi ${item.icon} text-[15px]`} aria-hidden />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-h-0 overflow-auto crm-scroll md:border-l md:border-[var(--border-default)] md:pl-6">
          <div className="max-w-xl pb-8">
            {section === "language" ? (
              <section className="space-y-5">
                <header className="pb-4 border-b border-[var(--border-default)]">
                  <h2 className="text-[17px] font-semibold">{d.language}</h2>
                  <p className="text-[13px] text-[var(--text-secondary)] mt-1">{d.languageHint}</p>
                </header>
                <div className="flex flex-col sm:flex-row gap-2">
                  {(
                    [
                      { k: "fr" as const, label: "Français", icon: "bi-flag" },
                      { k: "en" as const, label: "English", icon: "bi-flag-fill" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.k}
                      type="button"
                      className={`crm-btn flex-1 !h-11 gap-2 ${
                        (local.locale || "fr") === opt.k ? "crm-btn-primary" : "crm-btn-secondary"
                      }`}
                      onClick={() => void persist({ ...local, locale: opt.k })}
                    >
                      <i className={`bi ${opt.icon}`} aria-hidden />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {section === "nav" ? (
              <section className="space-y-1">
                <header className="pb-4 mb-2 border-b border-[var(--border-default)]">
                  <h2 className="text-[17px] font-semibold">{d.navigation}</h2>
                </header>
                <Toggle
                  label={d.sidebarCollapsed}
                  checked={!!local.sidebarCollapsed}
                  onChange={(v) => void persist({ ...local, sidebarCollapsed: v })}
                />
                <Toggle
                  label={d.showTypes}
                  checked={local.showNavTypes !== false}
                  onChange={(v) => void persist({ ...local, showNavTypes: v })}
                />
                <Toggle
                  label={d.showRecents}
                  checked={local.showNavRecents !== false}
                  onChange={(v) => void persist({ ...local, showNavRecents: v })}
                />
                <div className="pt-4 mt-3 border-t border-[var(--border-default)] space-y-4">
                  <div>
                    <label className="crm-label">{d.pageSize}</label>
                    <select
                      className="crm-input"
                      value={local.pageSize || 25}
                      onChange={(e) =>
                        void persist({ ...local, pageSize: Number(e.target.value) || 25 })
                      }
                    >
                      {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="crm-label">{d.homePage}</label>
                    <select
                      className="crm-input"
                      value={local.defaultPage || "dashboard"}
                      onChange={(e) =>
                        void persist({ ...local, defaultPage: e.target.value as Page })
                      }
                    >
                      <option value="dashboard">{d.dashboard}</option>
                      <option value="contacts">{d.contacts}</option>
                      <option value="pipeline">{d.pipeline}</option>
                      <option value="settings">{d.settings}</option>
                    </select>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-1">{d.homePageHint}</p>
                  </div>
                  <div>
                    <label className="crm-label">{d.defaultActeur}</label>
                    <select
                      className="crm-input"
                      value={local.formDefaultActeur || ACTEURS[0].k}
                      onChange={(e) =>
                        void persist({ ...local, formDefaultActeur: e.target.value })
                      }
                    >
                      {ACTEURS.map((a) => (
                        <option key={a.k} value={a.k}>
                          {a.l}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer py-3 border-b border-[var(--border-default)] last:border-0">
      <span className="block text-[14px] font-medium">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
