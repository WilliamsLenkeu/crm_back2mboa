import { NextRequest, NextResponse } from "next/server";
import { searchCities } from "@/lib/geo-cache";

/** Villes : Mongo d’abord ; fallback countries.dev / cityapi puis cache. */
export async function GET(req: NextRequest) {
  const country = (req.nextUrl.searchParams.get("country") || "").trim().toUpperCase();
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const cursor = req.nextUrl.searchParams.get("cursor") || "";
  const limit = Math.min(40, Math.max(10, Number(req.nextUrl.searchParams.get("limit")) || 30));

  if (!country || country.length !== 2) {
    return NextResponse.json({ error: "country ISO-2 requis" }, { status: 400 });
  }

  try {
    const result = await searchCities({ country, q, limit, cursor });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "geo cities failed" },
      { status: 502 },
    );
  }
}
