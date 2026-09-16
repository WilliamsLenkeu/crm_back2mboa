import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/db";
import type { ContactDoc } from "@/db/schema";
import { ACTEURS } from "@/lib/acteurs";
import { PUBLIC_FORM_KEYS, toPublicForm } from "@/lib/public-form";
import { calcCompletude } from "@/lib/utils";

type Ctx = { params: Promise<{ token: string }> };

const ACTEUR_KEYS = new Set(ACTEURS.map((a) => a.k));

/** Formulaire client lié — token opaque, jamais l’id contact */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
  }

  const row = await collections.contacts().findOne({ formToken: token }, { projection: { _id: 0 } });
  if (!row) return NextResponse.json({ error: "Lien invalide" }, { status: 404 });

  return NextResponse.json({ fields: toPublicForm(row as unknown as Record<string, unknown>) });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
  }

  const prev = await collections.contacts().findOne({ formToken: token }, { projection: { _id: 0 } });
  if (!prev) return NextResponse.json({ error: "Lien invalide" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const patch: Partial<ContactDoc> = {};
  for (const k of PUBLIC_FORM_KEYS) {
    if (k in body) {
      const v = String((body as Record<string, unknown>)[k] ?? "").trim();
      (patch as Record<string, string>)[k] = v;
    }
  }

  if (patch.nom !== undefined && patch.nom.length < 2) {
    return NextResponse.json({ error: "Nom trop court" }, { status: 400 });
  }
  if (patch.acteur !== undefined && !ACTEUR_KEYS.has(patch.acteur as (typeof ACTEURS)[number]["k"])) {
    return NextResponse.json({ error: "Type d’acteur invalide" }, { status: 400 });
  }
  if (patch.email !== undefined && patch.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const merged = { ...prev, ...patch };
  patch.completude = calcCompletude(merged);
  patch.updatedAt = new Date();

  await collections.contacts().updateOne({ id: prev.id }, { $set: patch });
  return NextResponse.json({ ok: true });
}
