"use client";

import { useLocale } from "./locale-context";
import type { Contact } from "./types";

export function CommandPalette({
  inputRef,
  value,
  onChange,
  hits,
  onPick,
  onClose,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (v: string) => void;
  hits: Contact[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const { d } = useLocale();
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label={d.close} onClick={onClose} />
      <div className="relative w-full max-w-lg crm-card shadow-[var(--shadow-2)] overflow-hidden crm-fade">
        <input
          ref={inputRef}
          className="w-full h-12 px-4 border-b border-[var(--border-default)] text-[15px] outline-none"
          placeholder={d.cmdPlaceholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && hits[0]) onPick(hits[0].id);
          }}
        />
        <ul className="max-h-72 overflow-auto crm-scroll">
          {hits.length === 0 ? (
            <li className="px-4 py-6 text-[13px] text-[var(--text-tertiary)]">{d.noResults}</li>
          ) : (
            hits.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-[var(--color-primary-light)]"
                  onClick={() => onPick(h.id)}
                >
                  <span className="font-semibold text-[14px]">{h.nom}</span>
                  <span className="block text-[12px] text-[var(--text-secondary)] truncate">
                    {[h.organisation, h.acteur].filter(Boolean).join(" · ")}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
