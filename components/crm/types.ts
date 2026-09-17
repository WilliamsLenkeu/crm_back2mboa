import type { ActeurKey } from "@/lib/acteurs";

export type Contact = {
  id: string;
  formToken?: string | null;
  acteur: string;
  nom: string;
  organisation: string | null;
  fonction: string | null;
  role: string | null;
  secteur: string | null;
  pays: string | null;
  ville: string | null;
  adresse: string | null;
  email: string | null;
  telephone: string | null;
  whatsapp: string | null;
  site: string | null;
  linkedin: string | null;
  source: string | null;
  tags: string | null;
  prochaineRelance: string | null;
  pourquoi: string | null;
  msg: string | null;
  priorite: string | null;
  score: number;
  etapePipeline: string;
  notes: string | null;
  completude: number;
  region?: string | null;
  createdAt?: string | number | Date | null;
  updatedAt?: string | number | Date | null;
  journal?: { id: string; texte: string; createdAt?: string | number | Date }[];
};

export type Page = "dashboard" | "contacts" | "pipeline" | "settings" | "users";
export type QuickView =
  | "all"
  | "haute"
  | "incomplets"
  | "nouveaux"
  | "qualifies"
  | "recents"
  | "pause"
  | "sans_email";

export type SortKey =
  | "nom"
  | "score"
  | "priorite"
  | "etape"
  | "completude"
  | "created"
  | "updated"
  | "pays"
  | "acteur"
  | "organisation";

export type ContactFilters = {
  etape: string;
  priorite: string;
  pays: string;
  secteur: string;
};

export const EMPTY_FILTERS: ContactFilters = {
  etape: "",
  priorite: "",
  pays: "",
  secteur: "",
};

export const STAGE_STYLE: Record<string, { color: string; bg: string }> = {
  "01_Nouveau": { color: "var(--stage-1)", bg: "var(--stage-1-bg)" },
  "02_Contacté": { color: "var(--stage-2)", bg: "var(--stage-2-bg)" },
  "03_Qualifié": { color: "var(--stage-3)", bg: "var(--stage-3-bg)" },
  "04_Engagé": { color: "var(--stage-4)", bg: "var(--stage-4-bg)" },
  "05_Partenaire": { color: "var(--stage-5)", bg: "var(--stage-5-bg)" },
  "06_Pause": { color: "var(--stage-6)", bg: "var(--stage-6-bg)" },
};

export const RECENT_KEY = "b2m-crm-recent";
export const RECENT_MS = 14 * 24 * 60 * 60 * 1000;

export function etapeLabel(et: string) {
  return et.replace(/^\d+_/, "").replace(/_/g, " ");
}

export function tsMs(v?: string | number | Date | null) {
  if (!v) return 0;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function createdAtMs(c: Contact) {
  return tsMs(c.createdAt);
}

export function updatedAtMs(c: Contact) {
  return tsMs(c.updatedAt) || createdAtMs(c);
}

export function formatDate(v?: string | number | Date | null) {
  const t = tsMs(v);
  if (!t) return "—";
  return new Date(t).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

export function daysSince(v?: string | number | Date | null) {
  const t = tsMs(v);
  if (!t) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

export function loadRecent(): { id: string; nom: string }[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as {
      id: string;
      nom: string;
    }[];
    return raw.filter((x) => x.id && x.nom && x.nom !== "Nouveau contact");
  } catch {
    return [];
  }
}

export function pushRecent(c: { id: string; nom: string }) {
  if (!c.id || c.nom === "Nouveau contact") return;
  const prev = loadRecent().filter((x) => x.id !== c.id);
  localStorage.setItem(
    RECENT_KEY,
    JSON.stringify([{ id: c.id, nom: c.nom }, ...prev].slice(0, 8)),
  );
}

export function blankContact(acteur: string): Contact {
  return {
    id: "",
    acteur,
    nom: "",
    organisation: null,
    fonction: null,
    role: null,
    secteur: null,
    pays: null,
    ville: null,
    adresse: null,
    email: null,
    telephone: null,
    whatsapp: null,
    site: null,
    linkedin: null,
    source: null,
    tags: null,
    prochaineRelance: null,
    pourquoi: null,
    msg: null,
    priorite: "Moyenne",
    score: 0,
    etapePipeline: "01_Nouveau",
    notes: null,
    completude: 0,
    createdAt: null,
    updatedAt: null,
    journal: [],
  };
}

export function uniqueSorted(rows: Contact[], key: "pays" | "secteur") {
  const set = new Set<string>();
  for (const r of rows) {
    const v = (r[key] || "").trim();
    if (v) set.add(v);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "fr"));
}

export type { ActeurKey };
