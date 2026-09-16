"use client";

import { useMemo, useState } from "react";
import { ACTEURS, ETAPES, PRIORITES } from "@/lib/acteurs";
import { stageLabel, prioLabel } from "@/lib/i18n";
import { buildTablePdf } from "@/lib/table-pdf";
import { useLocale } from "./locale-context";
import type { Contact } from "./types";

const COLS = [
  { k: "nom", fr: "Nom", en: "Name" },
  { k: "acteur", fr: "Type", en: "Type" },
  { k: "organisation", fr: "Organisation", en: "Organisation" },
  { k: "email", fr: "Email", en: "Email" },
  { k: "telephone", fr: "Téléphone", en: "Phone" },
  { k: "pays", fr: "Pays", en: "Country" },
  { k: "ville", fr: "Ville", en: "City" },
  { k: "priorite", fr: "Priorité", en: "Priority" },
  { k: "etapePipeline", fr: "Étape", en: "Stage" },
  { k: "score", fr: "Score", en: "Score" },
  { k: "completude", fr: "Complétude", en: "Completeness" },
  { k: "source", fr: "Source", en: "Source" },
] as const;

type ColKey = (typeof COLS)[number]["k"];

export function ExportModal({
  rows,
  selectedIds,
  acteur,
  onClose,
}: {
  rows: Contact[];
  selectedIds: string[];
  acteur: string;
  onClose: () => void;
}) {
  const { d, locale } = useLocale();
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const [scope, setScope] = useState<"all" | "acteur" | "selected" | "custom">("all");
  const [etape, setEtape] = useState("");
  const [priorite, setPriorite] = useState("");
  const [cols, setCols] = useState<ColKey[]>(COLS.map((c) => c.k));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const preview = useMemo(() => {
    let list = rows;
    if (scope === "acteur" && acteur) list = list.filter((r) => r.acteur === acteur);
    if (scope === "selected") list = list.filter((r) => selectedIds.includes(r.id));
    if (scope === "custom") {
      if (etape) list = list.filter((r) => r.etapePipeline === etape);
      if (priorite) list = list.filter((r) => r.priorite === priorite);
    }
    return list;
  }, [rows, scope, acteur, selectedIds, etape, priorite]);

  const colMeta = COLS.filter((c) => cols.includes(c.k));

  function cell(r: Contact, k: ColKey) {
    const v = r[k as keyof Contact];
    if (k === "etapePipeline") return stageLabel(String(v || ""), d);
    if (k === "priorite") return prioLabel(String(v || ""), d);
    return String(v ?? "");
  }

  function toggleCol(k: ColKey) {
    setCols((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }

  function exportBaseName() {
    const now = new Date();
    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      "_",
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
    ].join("");

    const parts = ["Back2Mboa", "contacts", stamp];

    if (scope === "acteur" && acteur) {
      parts.push(slugPart(ACTEURS.find((a) => a.k === acteur)?.l || acteur));
    } else if (scope === "selected") {
      parts.push("selection");
      parts.push(`${selectedIds.length}`);
    } else if (scope === "custom") {
      parts.push("filtre");
      if (etape) parts.push(slugPart(stageLabel(etape, d)));
      if (priorite) parts.push(slugPart(prioLabel(priorite, d)));
    } else {
      parts.push("tous");
    }

    parts.push(`${preview.length}fiches`);
    return parts.filter(Boolean).join("_");
  }

  function exportFileName(ext: "csv" | "pdf") {
    return `${exportBaseName()}.${ext}`;
  }

  async function downloadCsv() {
    setBusy(true);
    setErr("");
    try {
      const headers = colMeta.map((c) => (locale === "en" ? c.en : c.fr));
      const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const lines = [
        headers.map(esc).join(","),
        ...preview.map((r) => colMeta.map((c) => esc(cell(r, c.k))).join(",")),
      ];
      const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportFileName("csv");
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  function downloadPdf() {
    setBusy(true);
    setErr("");
    try {
      const fileName = exportFileName("pdf");
      const headers = colMeta.map((c) => (locale === "en" ? c.en : c.fr));
      const landscape = colMeta.length >= 6;
      const when = new Date().toLocaleString(locale === "en" ? "en-GB" : "fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      });
      const title = locale === "en" ? "Contact list" : "Liste contacts";
      const scopeLabel =
        scope === "acteur" && acteur
          ? ACTEURS.find((a) => a.k === acteur)?.l || acteur
          : scope === "selected"
            ? `${locale === "en" ? "Selection" : "Sélection"} (${selectedIds.length})`
            : scope === "custom"
              ? locale === "en"
                ? "Filtered"
                : "Filtré"
              : locale === "en"
                ? "All loaded"
                : "Périmètre courant";
      const orient = landscape
        ? locale === "en"
          ? "Landscape"
          : "Paysage"
        : "Portrait";

      const blob = buildTablePdf({
        landscape,
        title,
        subtitle: `${scopeLabel} · ${orient} · ${colMeta.length} col. · ${when}`,
        countLabel: `${preview.length} ${d.results}`,
        headers,
        rows: preview.map((r) => colMeta.map((c) => cell(r, c.k))),
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "PDF failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        className="crm-card w-full sm:max-w-2xl max-h-[90dvh] overflow-auto rounded-t-[16px] sm:rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-[18px] font-bold">{d.exportTitle}</h2>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">{d.exportHint}</p>
          </div>
          <button type="button" className="crm-btn crm-btn-ghost !w-8 !h-8 !p-0" onClick={onClose} aria-label={d.close}>
            ×
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="crm-label">{d.exportFormat}</p>
            <div className="flex gap-2">
              {(["csv", "pdf"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`crm-btn flex-1 !h-9 ${format === f ? "crm-btn-primary" : "crm-btn-secondary"}`}
                  onClick={() => setFormat(f)}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
            {format === "pdf" ? (
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5">
                {cols.length >= 6
                  ? locale === "en"
                    ? "PDF page: landscape (≥6 columns)."
                    : "Page PDF : paysage (≥6 colonnes)."
                  : locale === "en"
                    ? "PDF page: portrait."
                    : "Page PDF : portrait."}
              </p>
            ) : null}
          </div>
          <div>
            <p className="crm-label">{d.exportScope}</p>
            <select className="crm-input" value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}>
              <option value="all">{d.exportScopeAll}</option>
              <option value="acteur" disabled={!acteur}>
                {d.exportScopeActeur}
                {acteur ? ` (${ACTEURS.find((a) => a.k === acteur)?.l || acteur})` : ""}
              </option>
              <option value="selected" disabled={!selectedIds.length}>
                {d.exportScopeSelected} ({selectedIds.length})
              </option>
              <option value="custom">{d.exportScopeCustom}</option>
            </select>
          </div>
        </div>

        {scope === "custom" ? (
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <select className="crm-input" value={etape} onChange={(e) => setEtape(e.target.value)}>
              <option value="">{d.filterAllStages}</option>
              {ETAPES.map((et) => (
                <option key={et} value={et}>
                  {stageLabel(et, d)}
                </option>
              ))}
            </select>
            <select className="crm-input" value={priorite} onChange={(e) => setPriorite(e.target.value)}>
              <option value="">{d.filterAllPrios}</option>
              {PRIORITES.map((p) => (
                <option key={p} value={p}>
                  {prioLabel(p, d)}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="mb-4">
          <p className="crm-label mb-2">{d.exportColumns}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {COLS.map((c) => (
              <label key={c.k} className="flex items-center gap-1.5 text-[13px] cursor-pointer">
                <input type="checkbox" checked={cols.includes(c.k)} onChange={() => toggleCol(c.k)} />
                {locale === "en" ? c.en : c.fr}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="crm-label mb-2">
            {d.exportPreview} · {preview.length} {d.results}
          </p>
          <div className="border border-[var(--border-default)] rounded-[var(--radius-sm)] overflow-auto max-h-48 crm-scroll">
            <table className="text-[12px] w-full min-w-[480px]">
              <thead>
                <tr className="bg-[var(--grey-100)] sticky top-0">
                  {colMeta.map((c) => (
                    <th key={c.k} className="text-left px-2 py-1.5 font-semibold whitespace-nowrap">
                      {locale === "en" ? c.en : c.fr}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 8).map((r) => (
                  <tr key={r.id} className="border-t border-[var(--border-default)]">
                    {colMeta.map((c) => (
                      <td key={c.k} className="px-2 py-1.5 truncate max-w-[140px]">
                        {cell(r, c.k)}
                      </td>
                    ))}
                  </tr>
                ))}
                {preview.length === 0 ? (
                  <tr>
                    <td colSpan={colMeta.length || 1} className="px-2 py-6 text-center text-[var(--text-tertiary)]">
                      {d.noContacts}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {preview.length > 8 ? (
            <p className="text-[11px] text-[var(--text-tertiary)] mt-1">+{preview.length - 8}…</p>
          ) : null}
        </div>

        {err ? (
          <p className="text-[13px] text-[var(--negative)] mb-3" role="alert">
            {err}
          </p>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
          <p className="text-[11px] text-[var(--text-tertiary)] sm:mr-auto font-mono truncate" title={exportFileName(format)}>
            {exportFileName(format)}
          </p>
          <button type="button" className="crm-btn crm-btn-secondary !h-10" onClick={onClose}>
            {d.close}
          </button>
          <button
            type="button"
            className="crm-btn crm-btn-primary !h-10"
            disabled={busy || !cols.length || !preview.length}
            onClick={() => (format === "csv" ? void downloadCsv() : downloadPdf())}
          >
            {busy ? d.loading : d.exportDownload}
          </button>
        </div>
      </div>
    </div>
  );
}

function slugPart(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40)
      .toLowerCase() || "x"
  );
}
