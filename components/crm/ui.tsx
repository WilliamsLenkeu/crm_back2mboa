"use client";

import { STAGE_STYLE } from "./types";
import { prioLabel, stageLabel } from "@/lib/i18n";
import { useLocale } from "./locale-context";

export function PriorityBadge({ value }: { value: string | null }) {
  const { d } = useLocale();
  const label = prioLabel(value, d);
  if (value === "Haute") {
    return (
      <span className="crm-badge" style={{ background: "#FFEDD5", color: "#C2410C" }}>
        {label}
      </span>
    );
  }
  if (value === "Basse") {
    return (
      <span className="crm-badge" style={{ background: "#F0FDF4", color: "#15803D" }}>
        {label}
      </span>
    );
  }
  return (
    <span className="crm-badge" style={{ background: "#FFFBEB", color: "#A16207" }}>
      {label}
    </span>
  );
}

export function StageBadge({ etape }: { etape: string }) {
  const { d } = useLocale();
  const s = STAGE_STYLE[etape] || STAGE_STYLE["01_Nouveau"];
  return (
    <span className="crm-badge" style={{ background: s.bg, color: s.color }}>
      {stageLabel(etape, d)}
    </span>
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="crm-label">{label}</label>
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  tone?: "warn" | "danger" | "ok";
  onClick: () => void;
}) {
  const color =
    tone === "warn"
      ? "var(--color-primary)"
      : tone === "danger"
        ? "var(--negative)"
        : tone === "ok"
          ? "var(--success)"
          : "var(--text-primary)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="crm-card p-4 text-left hover:border-[var(--color-primary)] transition-colors shadow-[var(--shadow-1)]"
    >
      <p className="text-[12px] font-semibold text-[var(--text-secondary)] mb-2">{label}</p>
      <p className="crm-mono text-[28px] font-bold leading-none" style={{ color }}>
        {value}
      </p>
    </button>
  );
}
