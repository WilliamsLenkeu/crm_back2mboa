"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ACTEURS, ETAPES, type ActeurKey } from "@/lib/acteurs";
import { stageLabel } from "@/lib/i18n";
import { KpiCard } from "./ui";
import { useLocale } from "./locale-context";
import { STAGE_STYLE, type Contact, type QuickView } from "./types";

export function Dashboard({
  total,
  kpis,
  counts,
  rows,
  onOpenView,
  onOpenType,
}: {
  total: number;
  kpis: {
    haute: number;
    incomplets: number;
    partenaires: number;
    avg: number;
    avgCompletude: number;
    recents: number;
  };
  counts: Record<string, number>;
  rows: Contact[];
  onOpenView: (v: QuickView) => void;
  onOpenType: (k: ActeurKey) => void;
}) {
  const { d } = useLocale();
  const byStage = useMemo(
    () =>
      ETAPES.map((et) => ({
        name: stageLabel(et, d),
        et,
        value: rows.filter((r) => r.etapePipeline === et).length,
        fill: STAGE_STYLE[et]?.color || "#EA580C",
      })),
    [rows, d],
  );

  const byActeur = useMemo(
    () =>
      ACTEURS.map((a) => ({
        name: a.l,
        k: a.k,
        value: counts[a.k] || 0,
        fill: "#EA580C",
      })),
    [counts],
  );

  const byPrio = useMemo(
    () => [
      { name: d.prioHaute, value: rows.filter((r) => r.priorite === "Haute").length, fill: "#C2410C" },
      { name: d.prioMoyenne, value: rows.filter((r) => r.priorite === "Moyenne").length, fill: "#D97706" },
      {
        name: d.prioBasse,
        value: rows.filter((r) => !r.priorite || r.priorite === "Basse").length,
        fill: "#15803D",
      },
    ],
    [rows, d],
  );

  const byPays = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const p = (r.pays || "").trim();
      if (!p) continue;
      m.set(p, (m.get(p) || 0) + 1);
    }
    return [...m.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [rows]);

  const conversion = total ? Math.round((kpis.partenaires / total) * 100) : 0;

  return (
    <div className="crm-fade h-full overflow-auto crm-scroll space-y-5 pb-4">
      <div>
        <h1 className="text-[24px]">{d.dashboard}</h1>
        <p className="text-[14px] text-[var(--text-secondary)] mt-1">{d.overview}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <KpiCard label={d.contacts} value={total} onClick={() => onOpenView("all")} />
        <KpiCard label={d.kpiHaute} value={kpis.haute} tone="warn" onClick={() => onOpenView("haute")} />
        <KpiCard
          label={d.kpiIncomplets}
          value={kpis.incomplets}
          tone="danger"
          onClick={() => onOpenView("incomplets")}
        />
        <KpiCard
          label={d.kpiPartenaires}
          value={kpis.partenaires}
          tone="ok"
          onClick={() => onOpenView("qualifies")}
        />
        <KpiCard label={d.kpiAvgScore} value={kpis.avg} onClick={() => onOpenView("all")} />
        <KpiCard
          label={d.kpiCompletude}
          value={kpis.avgCompletude}
          onClick={() => onOpenView("incomplets")}
        />
        <KpiCard label={d.kpiRecents} value={kpis.recents} tone="warn" onClick={() => onOpenView("recents")} />
        <KpiCard label={d.kpiConv} value={conversion} tone="ok" onClick={() => onOpenView("qualifies")} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartCard
          title={d.chartPipeline}
          subtitle={`${rows.length} ${d.chartRecords}`}
          className="xl:col-span-2"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byStage} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#616161" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9E9E9E" }} axisLine={false} tickLine={false} width={36} />
              <Tooltip cursor={{ fill: "rgba(234,88,12,0.06)" }} contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {byStage.map((s) => (
                  <Cell key={s.et} fill={s.fill} className="hover:opacity-90 cursor-pointer" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={d.chartPriorities} subtitle={d.chartDistribution}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={byPrio}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={2}
                stroke="none"
              >
                {byPrio.map((p) => (
                  <Cell key={p.name} fill={p.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 -mt-2 pb-1">
            {byPrio.map((p) => (
              <span key={p.name} className="text-[12px] text-[var(--text-secondary)] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.fill }} />
                {p.name} · {p.value}
              </span>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title={d.chartActors} subtitle={d.chartActorsHint}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byActeur} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9E9E9E" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={128}
                tick={{ fontSize: 11, fill: "#616161" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={{ fill: "rgba(234,88,12,0.06)" }} contentStyle={tooltipStyle} />
              <Bar
                dataKey="value"
                fill="#EA580C"
                radius={[0, 6, 6, 0]}
                maxBarSize={22}
                className="cursor-pointer"
                onClick={(data) => {
                  const k = (data as { k?: ActeurKey })?.k;
                  if (k) onOpenType(k);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={d.chartCountries} subtitle={d.chartCountriesHint}>
          {byPays.length === 0 ? (
            <p className="text-[13px] text-[var(--text-tertiary)] p-6">{d.noCountryData}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byPays} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#616161" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9E9E9E" }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(23,162,184,0.08)" }} />
                <Bar dataKey="value" fill="#17A2B8" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

const tooltipStyle: React.CSSProperties = {
  border: "1px solid #E0E0E0",
  borderRadius: 8,
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
};

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`crm-card p-4 hover:border-[var(--border-strong)] transition-colors ${className}`}>
      <h2 className="text-[14px] font-semibold">{title}</h2>
      {subtitle ? (
        <p className="text-[12px] text-[var(--text-tertiary)] mb-2">{subtitle}</p>
      ) : (
        <div className="mb-2" />
      )}
      {children}
    </section>
  );
}
