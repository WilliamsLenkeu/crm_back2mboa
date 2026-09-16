"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ACTEURS, ETAPES, PRIORITES } from "@/lib/acteurs";
import { prioLabel, stageLabel } from "@/lib/i18n";
import { PriorityBadge, StageBadge } from "./ui";
import { useLocale } from "./locale-context";
import {
  EMPTY_FILTERS,
  daysSince,
  formatDate,
  type Contact,
  type ContactFilters,
  type QuickView,
  type SortKey,
} from "./types";

const DEFAULT_COL_W: Record<string, number> = {
  nom: 200,
  acteur: 130,
  priorite: 96,
  score: 72,
  etape: 120,
  completude: 100,
  organisation: 160,
  ville: 110,
  pays: 110,
  source: 120,
  created: 108,
  updated: 108,
};

const PAGE_SIZES = [10, 25, 50, 100] as const;

export function ContactsPage({
  loading,
  rows,
  selected,
  view,
  viewCounts,
  acteur,
  sort,
  sortDir,
  q,
  filters,
  paysOptions,
  secteurOptions,
  onQ,
  onView,
  onFilters,
  onSort,
  onToggleAll,
  onToggleOne,
  onOpen,
  onBulkEtape,
  onBulkPrio,
  onBulkDelete,
  columnWidths,
  onColumnWidths,
  pageSize = 25,
  onPageSize,
}: {
  loading: boolean;
  rows: Contact[];
  selected: Set<string>;
  view: QuickView;
  viewCounts: Record<QuickView, number>;
  acteur: string;
  sort: SortKey;
  sortDir: "asc" | "desc";
  q: string;
  filters: ContactFilters;
  paysOptions: string[];
  secteurOptions: string[];
  onQ: (v: string) => void;
  onView: (v: QuickView) => void;
  onFilters: (f: ContactFilters) => void;
  onSort: (k: SortKey) => void;
  onToggleAll: () => void;
  onToggleOne: (id: string) => void;
  onOpen: (id: string) => void;
  onBulkEtape: (et: string) => void;
  onBulkPrio: (p: string) => void;
  onBulkDelete: () => void;
  columnWidths: Record<string, number>;
  onColumnWidths: (w: Record<string, number>) => void;
  pageSize?: number;
  onPageSize: (n: number) => void;
}) {
  const { d } = useLocale();
  const [pageIdx, setPageIdx] = useState(0);

  const VIEWS: { k: QuickView; l: string }[] = [
    { k: "all", l: d.viewAll },
    { k: "recents", l: d.viewRecents },
    { k: "haute", l: d.viewHaute },
    { k: "incomplets", l: d.viewIncomplets },
    { k: "nouveaux", l: d.viewNouveaux },
    { k: "qualifies", l: d.viewQualifies },
    { k: "pause", l: d.viewPause },
    { k: "sans_email", l: d.viewSansEmail },
  ];
  const activeFilters =
    !!filters.etape || !!filters.priorite || !!filters.pays || !!filters.secteur;
  const showActeur = !acteur;
  const size = pageSize || 25;

  const colW = useCallback(
    (k: string) => columnWidths[k] ?? DEFAULT_COL_W[k] ?? 120,
    [columnWidths],
  );

  useEffect(() => {
    setPageIdx(0);
  }, [view, acteur, q, filters, sort, sortDir, size]);

  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const safeIdx = Math.min(pageIdx, pageCount - 1);
  const pageRows = useMemo(() => {
    const start = safeIdx * size;
    return rows.slice(start, start + size);
  }, [rows, safeIdx, size]);

  function setFilter<K extends keyof ContactFilters>(k: K, v: ContactFilters[K]) {
    onFilters({ ...filters, [k]: v });
  }

  function startResize(key: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = colW(key);
    function onMove(ev: MouseEvent) {
      const next = Math.max(64, Math.min(420, startW + (ev.clientX - startX)));
      onColumnWidths({ ...columnWidths, [key]: next });
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div className="crm-fade h-full min-h-0 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-[20px]">
            {d.contacts}
            {acteur ? (
              <span className="text-[var(--text-secondary)] font-medium">
                {" "}
                · {ACTEURS.find((a) => a.k === acteur)?.l}
              </span>
            ) : null}
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            {rows.length} {d.results}
            {activeFilters ? ` · ${d.filtersActive}` : ""}
          </p>
        </div>
        <input
          className="crm-input sm:max-w-[280px]"
          type="search"
          placeholder={d.searchPlaceholder}
          value={q}
          onChange={(e) => onQ(e.target.value)}
        />
      </div>

      {/* Vues rapides */}
      <div className="crm-card shrink-0 overflow-x-auto crm-scroll">
        <div className="flex min-w-max">
          {VIEWS.map((v) => {
            const on = view === v.k;
            return (
              <button
                key={v.k}
                type="button"
                onClick={() => onView(v.k)}
                className={`relative px-3.5 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  on
                    ? "border-[var(--color-primary)] text-[var(--color-primary-hover)] bg-[var(--color-primary-light)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--grey-100)]"
                }`}
              >
                {v.l}
                <span
                  className={`ml-1.5 crm-mono text-[11px] font-bold ${
                    on ? "text-[var(--color-primary)]" : "text-[var(--text-tertiary)]"
                  }`}
                >
                  {viewCounts[v.k] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtres fins */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <select
          className="crm-input !w-auto !h-9 text-[13px] min-w-[140px]"
          value={filters.etape}
          onChange={(e) => setFilter("etape", e.target.value)}
        >
          <option value="">{d.filterAllStages}</option>
          {ETAPES.map((et) => (
            <option key={et} value={et}>
              {stageLabel(et, d)}
            </option>
          ))}
        </select>
        <select
          className="crm-input !w-auto !h-9 text-[13px] min-w-[130px]"
          value={filters.priorite}
          onChange={(e) => setFilter("priorite", e.target.value)}
        >
          <option value="">{d.filterAllPrios}</option>
          {PRIORITES.map((p) => (
            <option key={p} value={p}>
              {prioLabel(p, d)}
            </option>
          ))}
        </select>
        <select
          className="crm-input !w-auto !h-9 text-[13px] min-w-[120px]"
          value={filters.pays}
          onChange={(e) => setFilter("pays", e.target.value)}
        >
          <option value="">{d.filterAllCountries}</option>
          {paysOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          className="crm-input !w-auto !h-9 text-[13px] min-w-[130px]"
          value={filters.secteur}
          onChange={(e) => setFilter("secteur", e.target.value)}
        >
          <option value="">{d.filterAllSectors}</option>
          {secteurOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {activeFilters ? (
          <button
            type="button"
            className="crm-btn crm-btn-ghost !h-9 text-[13px]"
            onClick={() => onFilters(EMPTY_FILTERS)}
          >
            Réinitialiser
          </button>
        ) : null}
      </div>

      {selected.size > 0 ? (
        <div className="crm-card px-3 py-2 flex flex-wrap items-center gap-2 bg-[var(--color-primary-light)] border-[var(--color-primary)] shrink-0">
          <span className="text-[13px] font-semibold">{selected.size} {d.selected}</span>
          <select
            className="crm-input !w-auto !h-8 text-[12px]"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onBulkEtape(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="">{d.changeStage}</option>
            {ETAPES.map((et) => (
              <option key={et} value={et}>
                {stageLabel(et, d)}
              </option>
            ))}
          </select>
          <select
            className="crm-input !w-auto !h-8 text-[12px]"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onBulkPrio(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="">{d.changePrio}</option>
            {PRIORITES.map((p) => (
              <option key={p} value={p}>
                {prioLabel(p, d)}
              </option>
            ))}
          </select>
          <button type="button" className="crm-btn crm-btn-danger !h-8 text-[12px]" onClick={onBulkDelete}>
            <i className="bi bi-trash" aria-hidden />
            {d.delete}
          </button>
        </div>
      ) : null}

      <div className="crm-card overflow-auto crm-scroll flex-1 min-h-0">
        {loading ? (
          <p className="p-8 text-[var(--text-secondary)]">{d.loading}</p>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-[var(--text-secondary)]">
            {d.noContacts}
          </div>
        ) : (
          <table className="text-[13px] table-fixed min-w-[900px] w-full">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--grey-100)] sticky top-0 z-10">
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))}
                    onChange={onToggleAll}
                  />
                </th>
                <SortTh k="nom" label={d.fieldNom} sort={sort} sortDir={sortDir} onSort={onSort} width={colW("nom")} onResize={startResize} />
                {showActeur ? (
                  <SortTh
                    k="acteur"
                    label={d.colType}
                    sort={sort}
                    sortDir={sortDir}
                    onSort={onSort}
                    className="hidden lg:table-cell"
                    width={colW("acteur")}
                    onResize={startResize}
                  />
                ) : null}
                <SortTh k="priorite" label={d.colPrio} sort={sort} sortDir={sortDir} onSort={onSort} width={colW("priorite")} onResize={startResize} />
                <SortTh k="score" label={d.colScore} sort={sort} sortDir={sortDir} onSort={onSort} className="hidden sm:table-cell" width={colW("score")} onResize={startResize} />
                <SortTh k="etape" label={d.colStage} sort={sort} sortDir={sortDir} onSort={onSort} width={colW("etape")} onResize={startResize} />
                <SortTh k="completude" label={d.colCompletude} sort={sort} sortDir={sortDir} onSort={onSort} className="hidden md:table-cell" width={colW("completude")} onResize={startResize} />
                <SortTh k="organisation" label={d.colOrg} sort={sort} sortDir={sortDir} onSort={onSort} className="hidden xl:table-cell" width={colW("organisation")} onResize={startResize} />
                <PlainTh label={d.colCity} className="hidden lg:table-cell" width={colW("ville")} onResize={(e) => startResize("ville", e)} />
                <SortTh k="pays" label={d.colCountry} sort={sort} sortDir={sortDir} onSort={onSort} className="hidden md:table-cell" width={colW("pays")} onResize={startResize} />
                <PlainTh label={d.colSource} className="hidden xl:table-cell" width={colW("source")} onResize={(e) => startResize("source", e)} />
                <SortTh k="created" label={d.colCreated} sort={sort} sortDir={sortDir} onSort={onSort} className="hidden sm:table-cell" width={colW("created")} onResize={startResize} />
                <SortTh k="updated" label="Maj" sort={sort} sortDir={sortDir} onSort={onSort} className="hidden xl:table-cell" width={colW("updated")} onResize={startResize} />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => {
                const sel = selected.has(r.id);
                const age = daysSince(r.createdAt);
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-[var(--border-default)] last:border-0 h-[52px] ${
                      sel ? "bg-[var(--color-primary-light)]" : "hover:bg-[var(--grey-100)]"
                    }`}
                  >
                    <td className="px-3">
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={() => onToggleOne(r.id)}
                        aria-label={`Sélectionner ${r.nom}`}
                      />
                    </td>
                    <td className="px-3 min-w-0" style={{ width: colW("nom") }}>
                      <button
                        type="button"
                        className="font-semibold text-[var(--color-primary-hover)] hover:underline text-left block w-full truncate"
                        onClick={() => onOpen(r.id)}
                      >
                        {r.nom}
                      </button>
                      <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                        {r.email || r.fonction || "—"}
                      </p>
                    </td>
                    {showActeur ? (
                      <td className="px-3 hidden lg:table-cell text-[var(--text-secondary)] truncate" style={{ width: colW("acteur") }}>
                        {ACTEURS.find((a) => a.k === r.acteur)?.l || r.acteur}
                      </td>
                    ) : null}
                    <td className="px-3 truncate" style={{ width: colW("priorite") }}>
                      <PriorityBadge value={r.priorite} />
                    </td>
                    <td className="px-3 crm-mono hidden sm:table-cell" style={{ width: colW("score") }}>{r.score}</td>
                    <td className="px-3 truncate" style={{ width: colW("etape") }}>
                      <StageBadge etape={r.etapePipeline} />
                    </td>
                    <td className="px-3 hidden md:table-cell" style={{ width: colW("completude") }}>
                      <CompletudeCell value={r.completude} />
                    </td>
                    <td className="px-3 hidden xl:table-cell text-[var(--text-secondary)] truncate" style={{ width: colW("organisation") }}>
                      {r.organisation || "—"}
                    </td>
                    <td className="px-3 hidden lg:table-cell text-[var(--text-secondary)] truncate" style={{ width: colW("ville") }}>
                      {r.ville || "—"}
                    </td>
                    <td className="px-3 hidden md:table-cell text-[var(--text-secondary)] truncate" style={{ width: colW("pays") }}>
                      {r.pays || "—"}
                    </td>
                    <td className="px-3 hidden xl:table-cell text-[var(--text-secondary)] truncate" style={{ width: colW("source") }}>
                      {r.source || "—"}
                    </td>
                    <td className="px-3 hidden sm:table-cell whitespace-nowrap" style={{ width: colW("created") }}>
                      <span className="crm-mono text-[12px] text-[var(--text-secondary)]">
                        {formatDate(r.createdAt)}
                      </span>
                      {age != null ? (
                        <span className="block text-[10px] text-[var(--text-tertiary)]">
                          J+{age}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 hidden xl:table-cell crm-mono text-[12px] text-[var(--text-secondary)] whitespace-nowrap" style={{ width: colW("updated") }}>
                      {formatDate(r.updatedAt || r.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && rows.length > 0 ? (
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[13px]">
          <p className="text-[var(--text-secondary)]">
            {safeIdx * size + 1}–{Math.min((safeIdx + 1) * size, rows.length)} sur {rows.length}
            <span className="text-[var(--text-tertiary)]"> · {d.resizeHint}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              {d.perPage}
              <select
                className="crm-input !w-auto !h-8 text-[12px]"
                value={size}
                onChange={(e) => onPageSize(Number(e.target.value) || 25)}
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="crm-btn crm-btn-secondary !h-8 !px-2"
                disabled={safeIdx <= 0}
                onClick={() => setPageIdx((p) => Math.max(0, p - 1))}
                aria-label="Page précédente"
              >
                <i className="bi bi-chevron-left" aria-hidden />
              </button>
              <span className="crm-mono text-[12px] px-2 min-w-[4.5rem] text-center">
                {safeIdx + 1} / {pageCount}
              </span>
              <button
                type="button"
                className="crm-btn crm-btn-secondary !h-8 !px-2"
                disabled={safeIdx >= pageCount - 1}
                onClick={() => setPageIdx((p) => Math.min(pageCount - 1, p + 1))}
                aria-label="Page suivante"
              >
                <i className="bi bi-chevron-right" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ColResizeHandle({ onResize }: { onResize: (e: React.MouseEvent) => void }) {
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      title="Glisser pour redimensionner"
      onMouseDown={onResize}
      className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center group"
    >
      <span className="w-px h-4 bg-[var(--border-strong)] group-hover:bg-[var(--color-primary)] group-hover:w-0.5 transition-[width,background]" />
      <i
        className="bi bi-grip-vertical absolute text-[10px] text-[var(--border-strong)] group-hover:text-[var(--color-primary)] opacity-70"
        aria-hidden
      />
    </span>
  );
}

function PlainTh({
  label,
  className = "",
  width,
  onResize,
}: {
  label: string;
  className?: string;
  width: number;
  onResize: (e: React.MouseEvent) => void;
}) {
  return (
    <th
      className={`relative text-left px-3 py-2 font-semibold text-[var(--text-secondary)] pr-5 ${className}`}
      style={{ width, minWidth: width }}
    >
      {label}
      <ColResizeHandle onResize={onResize} />
    </th>
  );
}

function SortTh({
  k,
  label,
  sort,
  sortDir,
  onSort,
  className = "",
  width,
  onResize,
}: {
  k: SortKey;
  label: string;
  sort: SortKey;
  sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  className?: string;
  width: number;
  onResize: (key: string, e: React.MouseEvent) => void;
}) {
  return (
    <th
      className={`relative text-left px-3 py-2 font-semibold text-[var(--text-secondary)] pr-5 ${className}`}
      style={{ width, minWidth: width }}
    >
      <button
        type="button"
        className="hover:text-[var(--color-primary)] inline-flex items-center gap-0.5 max-w-[calc(100%-8px)] truncate"
        onClick={() => onSort(k)}
      >
        {label}
        {sort === k ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
      </button>
      <ColResizeHandle onResize={(e) => onResize(k, e)} />
    </th>
  );
}

function CompletudeCell({ value }: { value: number }) {
  const color =
    value >= 70
      ? "var(--success)"
      : value >= 40
        ? "var(--warning)"
        : "var(--negative)";
  return (
    <div className="flex items-center gap-2 min-w-[72px]">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--grey-200)] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="crm-mono text-[11px] text-[var(--text-secondary)] w-7">{value}</span>
    </div>
  );
}
