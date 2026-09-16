"use client";

import { ETAPES } from "@/lib/acteurs";
import { stageLabel } from "@/lib/i18n";
import { PriorityBadge } from "./ui";
import { useLocale } from "./locale-context";
import { STAGE_STYLE, type Contact } from "./types";

export function PipelinePage({
  loading,
  rows,
  onOpen,
  onMove,
}: {
  loading: boolean;
  rows: Contact[];
  onOpen: (id: string) => void;
  onMove: (id: string, et: string) => void;
}) {
  const { d } = useLocale();
  if (loading) return <p className="text-[var(--text-secondary)] p-2">{d.loading}</p>;

  return (
    <div className="crm-fade h-full min-h-0 flex flex-col">
      <h1 className="text-[20px] mb-1 shrink-0">{d.pipeline}</h1>
      <p className="text-[13px] text-[var(--text-secondary)] mb-4 shrink-0">{d.pipelineHint}</p>
      <div className="flex gap-3 overflow-x-auto crm-scroll flex-1 min-h-0 pb-1">
        {ETAPES.map((et) => {
          const style = STAGE_STYLE[et];
          const col = rows.filter((r) => r.etapePipeline === et);
          return (
            <section
              key={et}
              className="w-[250px] shrink-0 rounded-[var(--radius)] border border-[var(--border-default)] overflow-hidden flex flex-col min-h-0"
              style={{ background: style.bg }}
            >
              <header className="px-3 py-2.5 flex items-center justify-between border-b border-[var(--border-default)] shrink-0">
                <h2 className="text-[13px] font-bold" style={{ color: style.color }}>
                  {stageLabel(et, d)}
                </h2>
                <span className="crm-mono text-[12px] font-semibold">{col.length}</span>
              </header>
              <div className="p-2 space-y-2 flex-1 min-h-0 overflow-auto crm-scroll">
                {col.map((r) => (
                  <article
                    key={r.id}
                    className="bg-white border border-[var(--border-default)] rounded-[var(--radius-sm)] p-3 shadow-[var(--shadow-1)]"
                  >
                    <button
                      type="button"
                      className="text-[13px] font-bold text-left w-full hover:text-[var(--color-primary-hover)]"
                      onClick={() => onOpen(r.id)}
                    >
                      {r.nom}
                    </button>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-1 line-clamp-2">
                      {r.organisation || r.fonction || "—"}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <PriorityBadge value={r.priorite} />
                      <span className="crm-mono text-[11px] text-[var(--text-tertiary)]">{r.score}</span>
                    </div>
                    <select
                      className="crm-input mt-2 !h-8 text-[12px]"
                      value={r.etapePipeline}
                      onChange={(e) => onMove(r.id, e.target.value)}
                    >
                      {ETAPES.map((x) => (
                        <option key={x} value={x}>
                          {stageLabel(x, d)}
                        </option>
                      ))}
                    </select>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
