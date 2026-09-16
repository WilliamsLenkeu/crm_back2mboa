import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/db";
import type { ContactDoc } from "@/db/schema";
import { calcCompletude } from "@/lib/utils";
import { ACTEURS } from "@/lib/acteurs";
import { newFormToken } from "@/lib/public-form";

const ACTEUR_KEYS = new Set(ACTEURS.map((a) => a.k));

/** Inscription publique — sans session */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const nom = String(body.nom || "").trim();
  if (nom.length < 2) {
    return NextResponse.json({ error: "Le nom est obligatoire (2 caractères min.)" }, { status: 400 });
  }

  const acteur = String(body.acteur || "");
  if (!ACTEUR_KEYS.has(acteur as (typeof ACTEURS)[number]["k"])) {
    return NextResponse.json({ error: "Type d’acteur invalide" }, { status: 400 });
  }

  const email = String(body.email || "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const now = new Date();
  const id = crypto.randomUUID();
  const formToken = newFormToken();
  const row: ContactDoc = {
    id,
    formToken,
    acteur,
    nom,
    organisation: String(body.organisation || ""),
    fonction: String(body.fonction || ""),
    email,
    telephone: String(body.telephone || ""),
    whatsapp: String(body.whatsapp || ""),
    pays: String(body.pays || ""),
    ville: String(body.ville || ""),
    secteur: String(body.secteur || ""),
    site: String(body.site || ""),
    linkedin: String(body.linkedin || ""),
    source: String(body.source || "Formulaire web"),
    tags: String(body.tags || ""),
    pourquoi: String(body.pourquoi || body.msg || ""),
    msg: String(body.msg || ""),
    priorite: "Moyenne",
    score: 0,
    etapePipeline: "01_Nouveau",
    notes: "[Inscription formulaire public]",
    completude: 0,
    aVerifier: "Oui",
    createdAt: now,
    updatedAt: now,
  };
  row.completude = calcCompletude(row);

  await collections.contacts().insertOne(row);
  return NextResponse.json({ ok: true, formToken }, { status: 201 });
}
