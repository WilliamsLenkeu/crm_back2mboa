import { collections } from "@/db";
import type { GeoCityDoc, GeoCountryDoc } from "@/db/schema";

type ApiCountry = {
  name: string;
  alpha2Code: string;
  translations?: { fr?: string };
  flag?: string;
};

export type CountryItem = { code: string; name: string; flag: string };

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toCountryDoc(c: ApiCountry, now = new Date()): GeoCountryDoc | null {
  const code = (c.alpha2Code || "").toUpperCase();
  const nameEn = (c.name || "").trim();
  const nameFr = (c.translations?.fr || nameEn).trim();
  if (!code || !nameEn) return null;
  return {
    code,
    nameEn,
    nameFr,
    flag: c.flag || "",
    nameEnLower: nameEn.toLowerCase(),
    nameFrLower: nameFr.toLowerCase(),
    updatedAt: now,
  };
}

/** Charge tous les pays depuis countries.dev → Mongo (idempotent). */
export async function syncCountriesFromApi() {
  const res = await fetch("https://countries.dev/countries");
  if (!res.ok) throw new Error(`countries.dev ${res.status}`);
  const raw = (await res.json()) as ApiCountry[];
  const now = new Date();
  const docs = raw.map((c) => toCountryDoc(c, now)).filter(Boolean) as GeoCountryDoc[];
  if (!docs.length) return 0;

  const ops = docs.map((d) => ({
    updateOne: {
      filter: { code: d.code },
      update: { $set: d },
      upsert: true,
    },
  }));
  // ponytail: bulkWrite par paquets si >1000 pays un jour
  await collections.countries().bulkWrite(ops, { ordered: false });
  return docs.length;
}

async function ensureCountriesSeeded() {
  const n = await collections.countries().estimatedDocumentCount();
  if (n > 0) return;
  await syncCountriesFromApi();
}

export async function searchCountries(opts: {
  q: string;
  lang: "fr" | "en";
  limit: number;
  offset: number;
}): Promise<{ items: CountryItem[]; hasMore: boolean; total: number }> {
  await ensureCountriesSeeded();

  const { q, lang, limit, offset } = opts;
  const nameField = lang === "en" ? "nameEn" : "nameFr";
  const lowerField = lang === "en" ? "nameEnLower" : "nameFrLower";

  const filter = q
    ? {
        $or: [
          { [lowerField]: { $regex: escapeRe(q.toLowerCase()) } },
          { code: { $regex: `^${escapeRe(q)}`, $options: "i" } },
        ],
      }
    : {};

  let total = await collections.countries().countDocuments(filter);
  let docs: GeoCountryDoc[] = await collections
    .countries()
    .find(filter, { projection: { _id: 0 } })
    .sort({ [nameField]: 1 })
    .skip(offset)
    .limit(limit)
    .toArray();

  // Fallback API si recherche sans hit Mongo
  if (q && total === 0) {
    try {
      const res = await fetch("https://countries.dev/countries");
      if (res.ok) {
        const raw = (await res.json()) as ApiCountry[];
        const now = new Date();
        const ql = q.toLowerCase();
        const hits = raw
          .map((c) => toCountryDoc(c, now))
          .filter((d): d is GeoCountryDoc => {
            if (!d) return false;
            return (
              d.nameFrLower.includes(ql) ||
              d.nameEnLower.includes(ql) ||
              d.code.toLowerCase().includes(ql)
            );
          });
        if (hits.length) {
          await collections.countries().bulkWrite(
            hits.map((d) => ({
              updateOne: {
                filter: { code: d.code },
                update: { $set: d },
                upsert: true,
              },
            })),
            { ordered: false },
          );
          total = hits.length;
          docs = hits
            .sort((a, b) => a[nameField].localeCompare(b[nameField], lang))
            .slice(offset, offset + limit);
        }
      }
    } catch {
      /* garde total=0 */
    }
  }

  const items = docs.map((d) => ({
    code: d.code,
    name: lang === "en" ? d.nameEn : d.nameFr,
    flag: d.flag,
  }));

  return {
    items,
    hasMore: offset + items.length < total,
    total,
  };
}

async function cacheCities(country: string, names: string[]) {
  const now = new Date();
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (!unique.length) return 0;
  await collections.cities().bulkWrite(
    unique.map((name) => {
      const doc: GeoCityDoc = {
        country,
        name,
        nameLower: name.toLowerCase(),
        updatedAt: now,
      };
      return {
        updateOne: {
          filter: { country, nameLower: doc.nameLower },
          update: { $set: doc },
          upsert: true,
        },
      };
    }),
    { ordered: false },
  );
  return unique.length;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Charge les villes de chaque pays (countriesnow) → Mongo.
 * Idempotent. ~quelques minutes pour les 250 pays.
 */
export async function syncCitiesFromApi(log: (msg: string) => void = console.log) {
  await ensureCountriesSeeded();
  const countries = await collections
    .countries()
    .find({}, { projection: { _id: 0, code: 1, nameEn: 1 } })
    .sort({ code: 1 })
    .toArray();

  let total = 0;
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < countries.length; i++) {
    const c = countries[i]!;
    try {
      const res = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: c.nameEn }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { error?: boolean; data?: string[]; msg?: string };
      if (json.error || !Array.isArray(json.data)) throw new Error(json.msg || "no data");
      const n = await cacheCities(c.code, json.data);
      total += n;
      ok++;
      if ((i + 1) % 25 === 0 || i === countries.length - 1) {
        log(`villes ${i + 1}/${countries.length} — ${c.code}: +${n} (total ${total})`);
      }
    } catch (e) {
      fail++;
      log(`skip ${c.code} (${c.nameEn}): ${e instanceof Error ? e.message : e}`);
    }
    await sleep(80);
  }

  log(`geo_cities: ${total} villes, ${ok} pays OK, ${fail} skip`);
  return { total, ok, fail };
}

export async function searchCities(opts: {
  country: string;
  q: string;
  limit: number;
  cursor: string;
}): Promise<{ items: string[]; hasMore: boolean; cursor: string | null }> {
  const country = opts.country.toUpperCase();
  const { q, limit, cursor } = opts;

  if (q.length >= 1) {
    const filter = {
      country,
      nameLower: { $regex: escapeRe(q.toLowerCase()) },
    };
    let items = await collections
      .cities()
      .find(filter, { projection: { _id: 0, name: 1 } })
      .sort({ name: 1 })
      .limit(limit)
      .toArray()
      .then((rows) => rows.map((r) => r.name));

    if (items.length === 0) {
      const url = `https://countries.dev/cities?country=${encodeURIComponent(country)}&q=${encodeURIComponent(q)}&limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`countries.dev cities ${res.status}`);
      const data = (await res.json()) as { name: string }[];
      items = [...new Set(data.map((c) => c.name).filter(Boolean))];
      await cacheCities(country, items);
    }

    return { items, hasMore: false, cursor: null };
  }

  // Scroll sans q : Mongo d’abord (page par skip via cursor numérique), sinon cityapi
  const skip = cursor && /^\d+$/.test(cursor) ? Number(cursor) : 0;
  const cachedCount = await collections.cities().countDocuments({ country });

  if (cachedCount > 0) {
    const rows = await collections
      .cities()
      .find({ country }, { projection: { _id: 0, name: 1 } })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    const items = rows.map((r) => r.name);
    const next = skip + items.length;
    return {
      items,
      hasMore: next < cachedCount,
      cursor: next < cachedCount ? String(next) : null,
    };
  }

  const sp = new URLSearchParams({
    country,
    population_min: "1",
    limit: String(limit),
  });
  if (cursor && !/^\d+$/.test(cursor)) sp.set("cursor", cursor);
  const res = await fetch(`https://api.cityapi.org/v1/cities?${sp}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`cityapi ${res.status}: ${err.slice(0, 120)}`);
  }
  const json = (await res.json()) as {
    data?: { name: string }[];
    meta?: { has_more?: boolean; next_cursor?: string };
  };
  const items = [...new Set((json.data || []).map((c) => c.name).filter(Boolean))];
  await cacheCities(country, items);
  return {
    items,
    hasMore: !!json.meta?.has_more,
    cursor: json.meta?.next_cursor || null,
  };
}
