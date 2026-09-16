import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/db";
import type { ContactDoc } from "@/db/schema";
import { requireSession } from "@/lib/session";
import type { Filter } from "mongodb";

const ALL_COLS = [
  "nom",
  "acteur",
  "organisation",
  "fonction",
  "email",
  "telephone",
  "whatsapp",
  "ville",
  "pays",
  "secteur",
  "source",
  "tags",
  "priorite",
  "score",
  "etapePipeline",
  "completude",
] as const;

type Col = (typeof ALL_COLS)[number];

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireSession();
    if (error) return error;

    const sp = req.nextUrl.searchParams;
    const acteur = sp.get("acteur");
    const etape = sp.get("etape");
    const priorite = sp.get("priorite");
    const ids = (sp.get("ids") || "").split(",").filter(Boolean);
    const colsParam = (sp.get("cols") || "").split(",").filter(Boolean) as Col[];
    const cols = (colsParam.length ? colsParam : ALL_COLS).filter((c): c is Col =>
      (ALL_COLS as readonly string[]).includes(c),
    );

    const filter: Filter<ContactDoc> = {};
    if (acteur) filter.acteur = acteur;
    if (etape) filter.etapePipeline = etape;
    if (priorite) filter.priorite = priorite;
    if (ids.length) filter.id = { $in: ids };

    const rows = await collections.contacts().find(filter, { projection: { _id: 0 } }).toArray();

    const esc = (v: unknown) => {
      if (v == null) return '""';
      if (v instanceof Date) return `"${v.toISOString()}"`;
      return `"${String(v).replace(/"/g, '""')}"`;
    };

    const lines = [
      cols.join(","),
      ...rows.map((r) => cols.map((c) => esc((r as Record<string, unknown>)[c])).join(",")),
    ];

    const body = `\uFEFF${lines.join("\n")}`;
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="back2mboa-contacts.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[export]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Export failed" },
      { status: 500 },
    );
  }
}
