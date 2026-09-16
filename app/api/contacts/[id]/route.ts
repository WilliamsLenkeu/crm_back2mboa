import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/db";
import type { ContactDoc } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { calcCompletude } from "@/lib/utils";
import { newFormToken } from "@/lib/public-form";

type Ctx = { params: Promise<{ id: string }> };

const PATCH_KEYS = [
  "acteur",
  "nom",
  "categorie",
  "organisation",
  "fonction",
  "dirigeant",
  "role",
  "secteur",
  "cluster",
  "etapeMece",
  "maillons",
  "mairie",
  "region",
  "departement",
  "pays",
  "ville",
  "adresse",
  "email",
  "telephone",
  "whatsapp",
  "site",
  "linkedin",
  "source",
  "tags",
  "prochaineRelance",
  "pourquoi",
  "msg",
  "priorite",
  "score",
  "etapePipeline",
  "ownerId",
  "pack",
  "valeur",
  "notes",
  "aVerifier",
] as const;

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await ctx.params;

  const row = await collections.contacts().findOne({ id }, { projection: { _id: 0 } });
  if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  let formToken = row.formToken;
  if (!formToken) {
    formToken = newFormToken();
    await collections.contacts().updateOne(
      { id },
      { $set: { formToken, updatedAt: new Date() } },
    );
  }

  const journal = await collections
    .journal()
    .find({ contactId: id }, { projection: { _id: 0 } })
    .sort({ createdAt: 1 })
    .toArray();

  return NextResponse.json({ ...row, formToken, journal });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await ctx.params;
  const body = await req.json();

  const prev = await collections.contacts().findOne({ id }, { projection: { _id: 0 } });
  if (!prev) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const patch: Partial<ContactDoc> = {};
  for (const k of PATCH_KEYS) {
    if (k in body) (patch as Record<string, unknown>)[k] = body[k];
  }

  const merged = { ...prev, ...patch };
  patch.completude = calcCompletude(merged);
  patch.updatedAt = new Date();

  await collections.contacts().updateOne({ id }, { $set: patch });

  if (body.journalNote && String(body.journalNote).trim()) {
    await collections.journal().insertOne({
      id: crypto.randomUUID(),
      contactId: id,
      userId: session!.user.id,
      texte: String(body.journalNote).trim(),
      createdAt: new Date(),
    });
  }

  const row = await collections.contacts().findOne({ id }, { projection: { _id: 0 } });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { error } = await requireSession();
  if (error) return error;
  const { id } = await ctx.params;
  await collections.journal().deleteMany({ contactId: id });
  await collections.contacts().deleteOne({ id });
  return NextResponse.json({ ok: true });
}
