"use client";

import { useCallback } from "react";
import { AsyncCombobox, type GeoItem } from "./combobox";

export function PaysCombobox({
  value,
  code = "",
  lang = "fr",
  onChange,
}: {
  value: string;
  code?: string;
  lang?: "fr" | "en";
  onChange: (v: { name: string; code: string }) => void;
}) {
  const load = useCallback(
    async ({ q, offset }: { q: string; offset: number; cursor: string | null }) => {
      const sp = new URLSearchParams({
        lang,
        limit: "30",
        offset: String(offset),
      });
      if (q) sp.set("q", q);
      const res = await fetch(`/api/geo/countries?${sp}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pays indisponibles");
      return {
        items: (data.items as { name: string; code: string; flag: string }[]).map((i) => ({
          name: i.name,
          code: i.code,
          flag: i.flag,
        })),
        hasMore: !!data.hasMore,
        cursor: null as string | null,
      };
    },
    [lang],
  );

  return (
    <AsyncCombobox
      value={value}
      load={load}
      placeholder={lang === "en" ? "Search a country…" : "Rechercher un pays…"}
      onChange={(name) => {
        // garder le code tant que le libellé n’a pas changé (évite de bloquer Continuer)
        onChange({ name, code: name === value ? code : "" });
      }}
      onPick={(item: GeoItem) => onChange({ name: item.name, code: item.code || "" })}
    />
  );
}

export function VilleCombobox({
  countryCode,
  value,
  lang = "fr",
  onChange,
}: {
  countryCode: string;
  value: string;
  lang?: "fr" | "en";
  onChange: (v: string) => void;
}) {
  const load = useCallback(
    async ({ q, cursor }: { q: string; offset: number; cursor: string | null }) => {
      if (!countryCode) return { items: [], hasMore: false, cursor: null };
      const sp = new URLSearchParams({
        country: countryCode,
        limit: "30",
      });
      if (q) sp.set("q", q);
      else if (cursor) sp.set("cursor", cursor);
      const res = await fetch(`/api/geo/cities?${sp}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Villes indisponibles");
      return {
        items: (data.items as string[]).map((name) => ({ name })),
        hasMore: !!data.hasMore,
        cursor: (data.cursor as string | null) || null,
      };
    },
    [countryCode],
  );

  return (
    <AsyncCombobox
      value={value}
      load={load}
      disabled={!countryCode}
      placeholder={
        !countryCode
          ? lang === "en"
            ? "Choose a country first…"
            : "Choisir un pays d’abord…"
          : lang === "en"
            ? "Search a city…"
            : "Rechercher une ville…"
      }
      onChange={onChange}
      onPick={(item) => onChange(item.name)}
    />
  );
}
