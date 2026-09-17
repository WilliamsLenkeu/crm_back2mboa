import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { collections, getDb, mongoClient } from "./index";
import type { ContactDoc } from "./schema";
import { ensureIndexes } from "./ensure-indexes";
import { auth } from "../lib/auth";
import { calcCompletude } from "../lib/utils";
import { newFormToken } from "../lib/public-form";

type Raw = Record<string, unknown>;

function findSketch(): string {
  const dir = path.join(process.cwd(), "sketch");
  const hit = fs.readdirSync(dir).find((f) => f.endsWith(".html"));
  if (!hit) throw new Error("Esquisse HTML introuvable dans sketch/");
  return path.join(dir, hit);
}

function extractData(html: string): Raw[] {
  const marker = "const DATA=";
  const start = html.indexOf(marker);
  if (start < 0) throw new Error("const DATA= introuvable");
  let i = start + marker.length;
  while (html[i] && /\s/.test(html[i])) i++;
  if (html[i] !== "[") throw new Error("DATA n'est pas un tableau");
  let depth = 0;
  let inStr = false;
  let esc = false;
  let quote = "";
  const from = i;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (ch === "\\") {
        esc = true;
        continue;
      }
      if (ch === quote) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = true;
      quote = ch;
      continue;
    }
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        return JSON.parse(html.slice(from, i + 1)) as Raw[];
      }
    }
  }
  throw new Error("Fin de DATA non trouvée");
}

function str(v: unknown) {
  return v == null ? "" : String(v);
}

function num(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function ensureAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@back2mboa.local";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
  const users = getDb().collection("user");
  const existing = await users.findOne({ email });
  if (existing) {
    await users.updateOne({ id: existing.id }, { $set: { role: "admin" } });
    await users.updateMany(
      { role: { $in: ["member", "user"] } },
      { $set: { role: "manager" } },
    );
    console.log("Admin déjà présent:", email);
    return existing.id as string;
  }
  const res = await auth.api.signUpEmail({
    body: { email, password, name: "Admin Back2Mboa" },
  });
  const id = res.user.id;
  await users.updateOne({ id }, { $set: { role: "admin" } });
  await users.updateMany(
    { role: { $in: ["member", "user"] } },
    { $set: { role: "manager" } },
  );
  console.log("Admin créé:", email, "/", password);
  return id;
}

async function main() {
  await ensureIndexes();
  const adminId = await ensureAdmin();
  const rows = extractData(fs.readFileSync(findSketch(), "utf8"));
  console.log(`Import de ${rows.length} fiches…`);

  await collections.journal().deleteMany({});
  await collections.contacts().deleteMany({});

  const now = new Date();
  const batch: ContactDoc[] = [];

  for (const r of rows) {
    const row: ContactDoc = {
      id: str(r.ID) || crypto.randomUUID(),
      formToken: newFormToken(),
      acteur: str(r.acteur),
      nom: str(r.Nom) || "Sans nom",
      categorie: str(r.Categorie),
      organisation: str(r.Organisation),
      fonction: str(r.Fonction),
      dirigeant: str(r.Dirigeant),
      role: str(r.Role),
      secteur: str(r.Secteur),
      cluster: str(r.Cluster),
      etapeMece: str(r.Etape_MECE),
      maillons: str(r.Maillons),
      mairie: str(r.Mairie),
      region: str(r.Region),
      departement: str(r.Departement),
      pays: str(r.Pays),
      ville: str(r.Ville),
      adresse: str(r.Adresse),
      email: str(r.Email),
      telephone: str(r.Telephone),
      site: str(r.Site),
      linkedin: str(r.LinkedIn),
      pourquoi: str(r.Pourquoi),
      msg: str(r.Msg),
      priorite: str(r.Priorite_N) || "Moyenne",
      score: num(r.Score_N),
      etapePipeline: str(r.Etape_N) || "01_Nouveau",
      ownerId: null,
      pack: str(r.Pack),
      valeur: num(r.Valeur),
      notes: str(r.Notes),
      completude: num(r.Completude),
      aVerifier: str(r.A_verifier) || "Non",
      createdAt: now,
      updatedAt: now,
    };
    if (!row.completude) row.completude = calcCompletude(row);
    batch.push(row);
  }

  const CHUNK = 200;
  for (let i = 0; i < batch.length; i += CHUNK) {
    await collections.contacts().insertMany(batch.slice(i, i + CHUNK), { ordered: false });
  }

  console.log(`OK — ${batch.length} contacts. Admin id=${adminId}`);
  await mongoClient.close();
  process.exit(0);
}

main().catch(async (e) => {
  console.error(e);
  try {
    await mongoClient.close();
  } catch {
    /* */
  }
  process.exit(1);
});
