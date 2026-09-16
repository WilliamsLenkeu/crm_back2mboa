import { NextRequest, NextResponse } from "next/server";
import { searchCountries } from "@/lib/geo-cache";

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
    const lang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "fr";
    const limit = Math.min(50, Math.max(10, Number(req.nextUrl.searchParams.get("limit")) || 30));
    const offset = Math.max(0, Number(req.nextUrl.searchParams.get("offset")) || 0);

    const result = await searchCountries({ q, lang, limit, offset });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "geo countries failed" },
      { status: 502 },
    );
  }
}
