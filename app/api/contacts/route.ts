import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/db";
import type { ContactDoc } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { calcCompletude } from "@/lib/utils";
import { newFormToken } from "@/lib/public-form";
import type { Filter, Sort } from "mongodb";

/** Champs liste / dashboard / pipeline — le détail complet vient de GET /[id]. */
const LIST_PROJECTION = {
  _id: 0,
  id: 1,
  nom: 1,
  acteur: 1,
  organisation: 1,
  fonction: 1,
  email: 1,
  telephone: 1,
  pays: 1,
  ville: 1,
  secteur: 1,
  source: 1,
  priorite: 1,
  score: 1,
  etapePipeline: 1,
  completude: 1,
  createdAt: 1,
  updatedAt: 1,
} as const;

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const col = collections.contacts();
  const sp = req.nextUrl.searchParams;
  const acteur = sp.get("acteur");
  const q = sp.get("q")?.trim();
  const etape = sp.get("etape");
  const priorite = sp.get("priorite");
  const sortKey = sp.get("sort") || "created";
  const dir = sp.get("dir") === "asc" ? 1 : -1;
  const limitRaw = Number(sp.get("limit"));
  const offset = Math.max(0, Number(sp.get("offset")) || 0);
  const limit = Math.min(250, Math.max(1, Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 50));
  const wantCounts = sp.get("counts") !== "0" && offset === 0;

  const filter: Filter<ContactDoc> = {};
  if (acteur) filter.acteur = acteur;
  if (etape) filter.etapePipeline = etape;
  if (priorite) filter.priorite = priorite;
  if (q) {
    const re = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    filter.$or = [
      { nom: re },
      { organisation: re },
      { email: re },
      { pays: re },
      { secteur: re },
    ];
  }

  const sortField =
    sortKey === "nom"
      ? "nom"
      : sortKey === "priorite"
        ? "priorite"
        : sortKey === "etape"
          ? "etapePipeline"
          : sortKey === "completude"
            ? "completude"
            : sortKey === "score"
              ? "score"
              : sortKey === "updated"
                ? "updatedAt"
                : "createdAt";

  const sort: Sort = { [sortField]: dir };

  const rowsP = col
    .find(filter, { projection: LIST_PROJECTION })
    .sort(sort)
    .skip(offset)
    .limit(limit)
    .toArray();

  const totalP = col.countDocuments(filter);
  const countsP = wantCounts
    ? col.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$acteur", n: { $sum: 1 } } }]).toArray()
    : Promise.resolve([] as { _id: string; n: number }[]);

  const [rows, total, countsAgg] = await Promise.all([rowsP, totalP, countsP]);

  const counts = countsAgg.map((c) => ({ acteur: c._id, n: c.n }));
  const nextOffset = offset + rows.length;

  void session;
  return NextResponse.json({
    rows,
    counts: wantCounts ? counts : undefined,
    total,
    offset,
    limit,
    hasMore: nextOffset < total,
    nextOffset,
  });
}

export async function POST(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const body = await req.json();
  const now = new Date();
  const id = body.id || crypto.randomUUID();
  const row: ContactDoc = {
    id,
    formToken: newFormToken(),
    acteur: String(body.acteur || ""),
    nom: String(body.nom || "Sans nom"),
    categorie: String(body.categorie || ""),
    organisation: String(body.organisation || ""),
    fonction: String(body.fonction || ""),
    dirigeant: String(body.dirigeant || ""),
    role: String(body.role || ""),
    secteur: String(body.secteur || ""),
    cluster: String(body.cluster || ""),
    etapeMece: String(body.etapeMece || ""),
    maillons: String(body.maillons || ""),
    mairie: String(body.mairie || ""),
    region: String(body.region || ""),
    departement: String(body.departement || ""),
    pays: String(body.pays || ""),
    ville: String(body.ville || ""),
    adresse: String(body.adresse || ""),
    email: String(body.email || ""),
    telephone: String(body.telephone || ""),
    whatsapp: String(body.whatsapp || ""),
    site: String(body.site || ""),
    linkedin: String(body.linkedin || ""),
    source: String(body.source || ""),
    tags: String(body.tags || ""),
    prochaineRelance: String(body.prochaineRelance || ""),
    pourquoi: String(body.pourquoi || ""),
    msg: String(body.msg || ""),
    priorite: String(body.priorite || "Moyenne"),
    score: Number(body.score) || 0,
    etapePipeline: String(body.etapePipeline || "01_Nouveau"),
    ownerId: body.ownerId || null,
    pack: String(body.pack || ""),
    valeur: Number(body.valeur) || 0,
    notes: String(body.notes || ""),
    completude: 0,
    aVerifier: String(body.aVerifier || "Non"),
    createdAt: now,
    updatedAt: now,
  };
  row.completude = calcCompletude(row);

  await collections.contacts().insertOne(row);
  return NextResponse.json(row, { status: 201 });
}
