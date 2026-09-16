"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ACTEURS, SOURCES } from "@/lib/acteurs";
import { t, type Locale } from "@/lib/i18n";
import type { PublicFormFields } from "@/lib/public-form";
import { PaysCombobox, VilleCombobox } from "@/components/crm/geo-fields";
import { CrmSelect } from "@/components/crm/crm-select";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LANG_KEY = "b2m-inscription-lang";

const empty: PublicFormFields = {
  nom: "",
  acteur: ACTEURS[0].k,
  organisation: "",
  fonction: "",
  email: "",
  telephone: "",
  whatsapp: "",
  pays: "",
  ville: "",
  secteur: "",
  site: "",
  linkedin: "",
  source: "Formulaire web",
  tags: "",
  pourquoi: "",
};

export default function ClientFormPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [locale, setLocale] = useState<Locale>("fr");
  const d = t(locale);
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "ok" | "err" | "missing">(
    "loading",
  );
  const [error, setError] = useState("");
  const [form, setForm] = useState<PublicFormFields>(empty);
  const [paysCode, setPaysCode] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY) as Locale | null;
      if (saved === "fr" || saved === "en") setLocale(saved);
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    let ok = true;
    void fetch(`/api/public/form/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("missing");
        return r.json();
      })
      .then((data) => {
        if (!ok) return;
        setForm({ ...empty, ...(data.fields || {}) });
        setStatus("idle");
      })
      .catch(() => {
        if (ok) setStatus("missing");
      });
    return () => {
      ok = false;
    };
  }, [token]);

  const initials = useMemo(() => {
    const parts = form.nom.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "B2";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [form.nom]);

  function setLang(l: Locale) {
    setLocale(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* */
    }
  }

  function set<K extends keyof PublicFormFields>(k: K, v: PublicFormFields[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validate(): boolean {
    if (form.nom.trim().length < 2) {
      setError(locale === "en" ? "Name required" : "Nom requis");
      return false;
    }
    if (!form.email.trim() && !form.telephone.trim()) {
      setError(locale === "en" ? "Email or phone required" : "Email ou téléphone requis");
      return false;
    }
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) {
      setError(locale === "en" ? "Invalid email" : "Email invalide");
      return false;
    }
    setError("");
    return true;
  }

  async function doSubmit() {
    if (!validate()) {
      setStatus("err");
      return;
    }
    setStatus("saving");
    setError("");
    const res = await fetch(`/api/public/form/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus("err");
      setError(data.error || (locale === "en" ? "Save failed" : "Échec"));
      return;
    }
    setStatus("ok");
  }

  const en = locale === "en";

  if (status === "loading") {
    return (
      <Shell>
        <div className="grid min-h-[16rem] place-items-center text-[var(--text-secondary)]">{d.loading}</div>
      </Shell>
    );
  }

  if (status === "missing") {
    return (
      <Shell>
        <div className="px-8 py-14 text-center">
          <p className="text-[15px] text-[var(--negative)]">{d.formNotFound}</p>
        </div>
      </Shell>
    );
  }

  if (status === "ok") {
    return (
      <Shell>
        <div className="px-8 py-14 text-center sm:px-10">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[var(--success-light)] text-[var(--success)]">
            <i className="bi bi-check-lg text-2xl" aria-hidden />
          </div>
          <h1 className="mb-2 text-[1.5rem] font-semibold tracking-tight text-balance">{d.successTitle}</h1>
          <p className="text-[15px] text-[var(--text-secondary)] text-pretty">{d.successBody}</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] px-6 py-4 sm:px-8">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-[var(--color-primary)] text-[11px] font-bold text-white">
            B2
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold leading-tight">Back2Mboa</p>
            <p className="truncate text-[12px] text-[var(--text-tertiary)]">
              {en ? "Partner profile" : "Profil partenaire"}
            </p>
          </div>
        </div>
        <div
          className="flex shrink-0 overflow-hidden rounded-md border border-[var(--border-default)] bg-[var(--grey-100)] p-0.5"
          role="group"
          aria-label={en ? "Language" : "Langue"}
        >
          {(["fr", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              className={`h-7 min-w-[2.1rem] rounded-[5px] px-2 text-[11px] font-semibold uppercase transition-colors ${
                locale === l
                  ? "bg-white text-[var(--text-primary)] shadow-[var(--shadow-1)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
              onClick={() => setLang(l)}
              aria-pressed={locale === l}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-[var(--border-default)] bg-[var(--color-primary-light)]/40 px-6 py-6 sm:px-8">
        <div className="flex items-start gap-4">
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-[15px] font-bold text-white"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 pt-0.5">
            <h1 className="text-[1.35rem] font-semibold tracking-tight text-balance">
              {en ? "Update your profile" : "Mettre à jour votre profil"}
            </h1>
            <p className="mt-1 text-[13.5px] leading-snug text-[var(--text-secondary)] text-pretty">
              {d.formUpdateIntro}
            </p>
          </div>
        </div>
      </div>

      <form
        className="pub-form"
        onSubmit={(e) => {
          e.preventDefault();
          void doSubmit();
        }}
      >
        <div className="space-y-0 px-6 sm:px-8">
          <Section title={en ? "Identity" : "Identité"}>
            <Field label={en ? "Full name" : "Nom complet"} required>
              <input
                className="crm-input"
                value={form.nom}
                onChange={(e) => set("nom", e.target.value)}
                autoComplete="name"
              />
            </Field>
            <Field label={en ? "You are" : "Vous êtes"}>
              <CrmSelect
                value={form.acteur}
                onChange={(v) => set("acteur", v)}
                options={ACTEURS.map((a) => ({ value: a.k, label: a.l }))}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Organisation">
                <input
                  className="crm-input"
                  value={form.organisation}
                  onChange={(e) => set("organisation", e.target.value)}
                  autoComplete="organization"
                />
              </Field>
              <Field label={en ? "Role" : "Fonction"}>
                <input
                  className="crm-input"
                  value={form.fonction}
                  onChange={(e) => set("fonction", e.target.value)}
                  autoComplete="organization-title"
                />
              </Field>
            </div>
            <Field label={en ? "Sector" : "Secteur"}>
              <input
                className="crm-input"
                value={form.secteur}
                onChange={(e) => set("secteur", e.target.value)}
              />
            </Field>
          </Section>

          <Section title={en ? "Contact" : "Coordonnées"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <input
                  className="crm-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  autoComplete="email"
                />
              </Field>
              <Field label={en ? "Phone" : "Téléphone"}>
                <input
                  className="crm-input"
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => set("telephone", e.target.value)}
                  autoComplete="tel"
                />
              </Field>
            </div>
            <Field label="WhatsApp">
              <input
                className="crm-input"
                type="tel"
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={en ? "Country" : "Pays"}>
                <PaysCombobox
                  value={form.pays}
                  code={paysCode}
                  lang={locale}
                  onChange={({ name, code }) => {
                    set("pays", name);
                    setPaysCode(code);
                    set("ville", "");
                  }}
                />
              </Field>
              <Field label={en ? "City" : "Ville"}>
                <VilleCombobox
                  countryCode={paysCode}
                  value={form.ville}
                  lang={locale}
                  onChange={(v) => set("ville", v)}
                />
              </Field>
            </div>
          </Section>

          <Section title={en ? "Online presence" : "Présence en ligne"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={en ? "Website" : "Site web"}>
                <input
                  className="crm-input"
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  value={form.site}
                  onChange={(e) => set("site", e.target.value)}
                />
              </Field>
              <Field label="LinkedIn">
                <input
                  className="crm-input"
                  type="url"
                  inputMode="url"
                  value={form.linkedin}
                  onChange={(e) => set("linkedin", e.target.value)}
                />
              </Field>
            </div>
          </Section>

          <Section title={en ? "Context" : "Contexte"} last>
            <Field label={en ? "How did you hear about us?" : "Comment nous avez-vous connus ?"}>
              <CrmSelect
                value={form.source}
                onChange={(v) => set("source", v)}
                options={SOURCES.map((s) => ({ value: s, label: s }))}
              />
            </Field>
            <Field label="Tags">
              <input
                className="crm-input"
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder={en ? "Comma-separated" : "Séparés par des virgules"}
              />
            </Field>
            <Field label={en ? "Your message" : "Votre message"}>
              <textarea
                className="crm-input !h-auto py-2.5"
                rows={4}
                value={form.pourquoi}
                onChange={(e) => set("pourquoi", e.target.value)}
              />
            </Field>
          </Section>
        </div>

        {error ? (
          <p className="px-6 pb-2 text-[13px] text-[var(--negative)] sm:px-8" role="alert">
            {error}
          </p>
        ) : null}

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-[var(--border-default)] bg-white/95 px-6 py-4 backdrop-blur-sm sm:px-8">
          <p className="hidden text-[12px] text-[var(--text-tertiary)] sm:block">
            {en ? "Your updates reach the Back2Mboa team." : "Vos mises à jour arrivent à l’équipe Back2Mboa."}
          </p>
          <button
            type="submit"
            className="crm-btn crm-btn-primary ml-auto !h-10 min-w-[9.5rem] !px-5"
            disabled={status === "saving"}
          >
            {status === "saving"
              ? en
                ? "Saving…"
                : "Enregistrement…"
              : en
                ? "Save changes"
                : "Enregistrer"}
          </button>
        </div>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-dvh overflow-x-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(234,88,12,0.12), transparent 55%), linear-gradient(180deg, #faf8f6 0%, #f3f1ef 45%, #eeebe8 100%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-[36rem] px-4 py-8 sm:px-6 sm:py-12">
        <div className="overflow-hidden rounded-[12px] border border-[var(--border-default)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_rgba(33,33,33,0.06)]">
          {children}
        </div>
        <p className="mt-5 text-center text-[11px] text-[var(--text-tertiary)]">
          © {new Date().getFullYear()} Back2Mboa
        </p>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section className={`py-7 ${last ? "" : "border-b border-[var(--border-default)]"}`}>
      <h2 className="mb-4 text-[12px] font-semibold tracking-[0.02em] text-[var(--text-primary)]">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="crm-label flex items-baseline gap-1">
        <span>{label}</span>
        {required ? <span className="text-[var(--negative)]">*</span> : null}
      </label>
      {children}
    </div>
  );
}
