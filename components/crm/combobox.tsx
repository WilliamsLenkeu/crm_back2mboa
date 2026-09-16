"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

export type GeoItem = { name: string; code?: string; flag?: string };

/** Combobox async : recherche + chargement au scroll */
export function AsyncCombobox({
  value,
  onChange,
  onPick,
  placeholder = "Rechercher…",
  disabled,
  load,
  displayValue,
}: {
  value: string;
  onChange: (v: string) => void;
  onPick?: (item: GeoItem) => void;
  placeholder?: string;
  disabled?: boolean;
  displayValue?: string;
  load: (args: {
    q: string;
    offset: number;
    cursor: string | null;
  }) => Promise<{ items: GeoItem[]; hasMore: boolean; cursor: string | null }>;
}) {
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(displayValue ?? value);
  const [items, setItems] = useState<GeoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const reqId = useRef(0);

  useEffect(() => {
    setQ(displayValue ?? value);
  }, [value, displayValue]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const fetchPage = useCallback(
    async (opts: { q: string; reset: boolean; cursor: string | null; offset: number }) => {
      const idn = ++reqId.current;
      setLoading(true);
      setError("");
      try {
        const res = await load({ q: opts.q, offset: opts.offset, cursor: opts.cursor });
        if (idn !== reqId.current) return;
        setItems((prev) => {
          if (opts.reset) return res.items;
          const seen = new Set(prev.map((p) => p.name));
          return [...prev, ...res.items.filter((i) => !seen.has(i.name))];
        });
        setHasMore(res.hasMore);
        setCursor(res.cursor);
      } catch (e) {
        if (idn !== reqId.current) return;
        setError(e instanceof Error ? e.message : "Erreur réseau");
        if (opts.reset) setItems([]);
      } finally {
        if (idn === reqId.current) setLoading(false);
      }
    },
    [load],
  );

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      void fetchPage({ q: q.trim(), reset: true, cursor: null, offset: 0 });
    }, 220);
    return () => clearTimeout(t);
  }, [open, q, fetchPage]);

  function pick(item: GeoItem) {
    onChange(item.name);
    onPick?.(item);
    setQ(item.name);
    setOpen(false);
  }

  function onScrollList() {
    const el = listRef.current;
    if (!el || loading || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      void fetchPage({
        q: q.trim(),
        reset: false,
        cursor,
        offset: items.length,
      });
    }
  }

  return (
    <div ref={wrap} className="relative">
      <div className="relative">
        <input
          id={id}
          className="crm-input pr-9"
          disabled={disabled}
          value={q}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && open && items[0]) {
              e.preventDefault();
              pick(items[0]);
            }
          }}
        />
        <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[var(--text-tertiary)] pointer-events-none" />
      </div>
      {open && !disabled ? (
        <ul
          ref={listRef}
          role="listbox"
          onScroll={onScrollList}
          className="absolute z-30 mt-1 w-full max-h-52 overflow-auto crm-scroll rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-white shadow-[var(--shadow-2)]"
        >
          {error ? (
            <li className="px-3 py-2 text-[12px] text-[var(--negative)]">{error}</li>
          ) : null}
          {!error && items.length === 0 && !loading ? (
            <li className="px-3 py-2 text-[12px] text-[var(--text-tertiary)]">
              Aucun résultat — continuez à saisir
            </li>
          ) : null}
          {items.map((o) => (
            <li key={`${o.code || ""}:${o.name}`} role="option">
              <button
                type="button"
                className={`w-full text-left px-3 py-2 text-[13px] hover:bg-[var(--color-primary-light)] flex items-center gap-2 ${
                  o.name === value ? "bg-[var(--color-primary-light)] font-semibold" : ""
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
              >
                {o.flag ? <span className="shrink-0">{o.flag}</span> : null}
                <span className="truncate">{o.name}</span>
                {o.code ? (
                  <span className="ml-auto text-[10px] text-[var(--text-tertiary)] crm-mono">{o.code}</span>
                ) : null}
              </button>
            </li>
          ))}
          {loading ? (
            <li className="px-3 py-2 text-[12px] text-[var(--text-tertiary)] flex items-center gap-2">
              <i className="bi bi-arrow-repeat crm-spin" aria-hidden />
              Chargement…
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
