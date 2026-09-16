"use client";

import { createContext, useContext, useMemo } from "react";
import { t, type Dict, type Locale } from "@/lib/i18n";

const Ctx = createContext<{ locale: Locale; d: Dict }>({
  locale: "fr",
  d: t("fr"),
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, d: t(locale) }), [locale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale() {
  return useContext(Ctx);
}
