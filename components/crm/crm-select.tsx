"use client";

import { useEffect, useRef, useState } from "react";

/** Select custom — liste stylée CRM (évite le menu natif bleu) */
export function CrmSelect({
  value,
  onChange,
  options,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value)?.label ?? value;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        className="crm-input flex items-center justify-between gap-2 text-left w-full cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="truncate">{current}</span>
        <i className={`bi bi-chevron-down text-[12px] opacity-60 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-auto crm-scroll rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-white shadow-[var(--shadow-2)] py-1"
        >
          {options.map((o) => {
            const on = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  className={`w-full text-left px-3 py-2.5 text-[inherit] transition-colors ${
                    on
                      ? "bg-[var(--color-primary)] text-white font-semibold"
                      : "text-[var(--text-primary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-hover)]"
                  }`}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
