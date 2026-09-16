"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { ACTEURS, SOURCES } from "@/lib/acteurs";
import { t, type Locale } from "@/lib/i18n";
import { PaysCombobox, VilleCombobox } from "@/components/crm/geo-fields";
import { CrmSelect } from "@/components/crm/crm-select";

type FormState = {
  nom: string;
  acteur: string;
  organisation: string;
  fonction: string;
  email: string;
  telephone: string;
  whatsapp: string;
  pays: string;
  paysCode: string;
  ville: string;
  secteur: string;
  site: string;
  linkedin: string;
  source: string;
  tags: string;
  pourquoi: string;
};

const empty: FormState = {
  nom: "",
  acteur: ACTEURS[0].k,
  organisation: "",
  fonction: "",
  email: "",
  telephone: "",
  whatsapp: "",
  pays: "Cameroun",
  paysCode: "CM",
  ville: "",
  secteur: "",
  site: "",
  linkedin: "",
  source: "Formulaire web",
  tags: "",
  pourquoi: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i;
const LANG_KEY = "b2m-inscription-lang";

const stepMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const },
};

export default function InscriptionPage() {
  const [locale, setLocale] = useState<Locale>("fr");
  const d = t(locale);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [error, setError] = useState("");
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY) as Locale | null;
      if (saved === "fr" || saved === "en") setLocale(saved);
    } catch {
      /* */
    }
  }, []);

  function setLang(l: Locale) {
    setLocale(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* */
    }
  }

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErr((e) => {
      if (!e[k]) return e;
      const n = { ...e };
      delete n[k];
      return n;
    });
  }

  function validateStep(s: number): boolean {
    const err: Record<string, string> = {};
    if (s === 0) {
      if (form.nom.trim().length < 2) {
        err.nom = locale === "en" ? "Name required (min. 2 chars)" : "Nom requis (2 caractères min.)";
      }
      if (!form.acteur) err.acteur = locale === "en" ? "Choose a type" : "Choisissez un type";
    }
    if (s === 1) {
      if (!form.email.trim() && !form.telephone.trim()) {
        const msg = locale === "en" ? "Email or phone required" : "Email ou téléphone requis";
        err.email = msg;
        err.telephone = msg;
      }
      if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) {
        err.email = locale === "en" ? "Invalid email" : "Email invalide";
      }
      // pays requis ; paysCode optionnel (liste API peut être lente)
      if (!form.pays.trim()) {
        err.pays = locale === "en" ? "Country required" : "Pays requis";
      }
      if (form.site.trim() && !URL_RE.test(form.site.trim())) {
        err.site = locale === "en" ? "Invalid URL" : "URL invalide";
      }
    }
    if (s === 2 && form.pourquoi.trim().length > 0 && form.pourquoi.trim().length < 10) {
      err.pourquoi =
        locale === "en"
          ? "Add a bit more (min. 10 chars) or leave empty"
          : "Précisez un peu plus (10 car. min.) ou laissez vide";
    }
    setFieldErr(err);
    setError(Object.values(err)[0] || "");
    return Object.keys(err).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) {
      setStatus("err");
      return;
    }
    setStatus("idle");
    setError("");
    setStep((s) => Math.min(2, s + 1));
  }

  function goBack() {
    setError("");
    setFieldErr({});
    setStatus("idle");
    setStep((s) => Math.max(0, s - 1));
  }

  /** Jamais via submit natif — uniquement bouton final */
  function openConfirm() {
    for (const s of [0, 1, 2] as const) {
      if (!validateStep(s)) {
        setStep(s);
        setStatus("err");
        setConfirmOpen(false);
        return;
      }
    }
    setError("");
    setStatus("idle");
    setConfirmOpen(true);
  }

  async function doSubmit() {
    setStatus("loading");
    setError("");
    const res = await fetch("/api/public/inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, pays: form.pays }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("err");
      setConfirmOpen(false);
      setError(data.error || (locale === "en" ? "Submit failed" : "Échec de l’envoi"));
      return;
    }
    setConfirmOpen(false);
    setStatus("ok");
  }

  const summary = useMemo(
    () =>
      [
        [locale === "en" ? "Name" : "Nom", form.nom],
        [locale === "en" ? "Type" : "Type", ACTEURS.find((a) => a.k === form.acteur)?.l || form.acteur],
        [locale === "en" ? "Organisation" : "Organisation", form.organisation],
        ["Email", form.email],
        [locale === "en" ? "Phone" : "Téléphone", form.telephone],
        [locale === "en" ? "Country" : "Pays", form.pays],
        [locale === "en" ? "City" : "Ville", form.ville],
        [locale === "en" ? "Message" : "Message", form.pourquoi],
      ].filter(([, v]) => String(v || "").trim()),
    [form, locale],
  );

  const stepTitle =
    step === 0
      ? locale === "en"
        ? "Who are you?"
        : "Qui êtes-vous ?"
      : step === 1
        ? locale === "en"
          ? "Contact details"
          : "Coordonnées"
        : locale === "en"
          ? "Context"
          : "Contexte";

  if (status === "ok") {
    return (
      <main className="min-h-dvh flex items-center justify-center p-5 sm:p-8 bg-[var(--surface-page)]">
        <motion.div
          className="max-w-md w-full text-center"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-14 h-14 mx-auto mb-5 rounded-full bg-[var(--success-light)] text-[var(--success)] grid place-items-center text-2xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
          >
            <i className="bi bi-check-lg" aria-hidden />
          </motion.div>
          <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight mb-2">{d.successTitle}</h1>
          <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">{d.successBody}</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="pub-form min-h-dvh flex flex-col bg-[var(--surface-page)]">
      {/* Bandeau mobile : marque + langue */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border-default)] bg-white/95 backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-[8px] bg-[var(--color-primary)] text-white grid place-items-center text-[11px] font-bold shrink-0">
            B2
          </span>
          <div className="min-w-0">
            <p className="font-bold text-[14px] truncate">Back2Mboa</p>
            <p className="text-[11px] text-[var(--text-tertiary)] truncate">{d.joinNetwork}</p>
          </div>
        </div>
        <LangSwitch locale={locale} setLang={setLang} />
      </header>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)] lg:min-h-dvh">
        {/* Panneau marque — desktop only */}
        <aside className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 text-white overflow-hidden bg-[var(--color-primary-active)]">
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 20% 20%, #ea580c, transparent), radial-gradient(ellipse 70% 50% at 90% 80%, #9a3412, transparent)",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-3 mb-14">
              <span className="w-11 h-11 rounded-[10px] bg-white/15 grid place-items-center text-[13px] font-bold border border-white/20">
                B2
              </span>
              <div>
                <p className="font-bold text-[17px] tracking-tight">Back2Mboa</p>
                <p className="text-[12px] text-white/70">CRM</p>
              </div>
            </div>
            <h1 className="text-[34px] xl:text-[40px] font-bold leading-[1.15] tracking-tight max-w-sm">
              {d.joinNetwork}
            </h1>
            <p className="mt-4 text-[15px] text-white/80 max-w-sm leading-relaxed">{d.formIntro}</p>
          </div>
          <p className="relative text-[12px] text-white/55">
            {d.stepOf} {step + 1} / 3 — {stepTitle}
          </p>
        </aside>

        {/* Formulaire */}
        <section className="flex flex-col flex-1 min-h-0">
          <div className="hidden lg:flex items-center justify-end px-6 xl:px-10 py-4 border-b border-[var(--border-default)] bg-white">
            <LangSwitch locale={locale} setLang={setLang} />
          </div>

          {/* pas de <form> : Enter / autofill ne déclenchent plus de submit */}
          <div className="flex-1 flex flex-col w-full max-w-lg mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
            <div className="mb-5 sm:mb-6">
              <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-wide text-[var(--color-primary)] mb-1">
                {d.stepOf} {step + 1} / 3
              </p>
              <h2 className="text-[22px] sm:text-[24px] font-bold tracking-tight">{stepTitle}</h2>
              <div className="mt-3.5 flex gap-1.5" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1 flex-1 rounded-full bg-[var(--border-default)] overflow-hidden">
                    <motion.span
                      className="block h-full bg-[var(--color-primary)] origin-left"
                      initial={false}
                      animate={{ scaleX: i <= step ? 1 : 0 }}
                      transition={{ duration: 0.25 }}
                    />
                  </span>
                ))}
              </div>
              <p className="mt-2.5 text-[12px] text-[var(--text-tertiary)]">
                <span className="text-[var(--negative)] font-semibold">*</span> {d.required}
                {" · "}
                {d.optional}
              </p>
            </div>

            <div className="flex-1 min-h-[220px] sm:min-h-[260px]">
              <AnimatePresence mode="wait">
                <motion.div key={step} className="space-y-3" {...stepMotion}>
                  {step === 0 ? (
                    <>
                      <Field label={locale === "en" ? "Full name" : "Nom complet"} required error={fieldErr.nom}>
                        <input
                          className={`crm-input ${fieldErr.nom ? "border-[var(--negative)]" : ""}`}
                          autoFocus
                          autoComplete="name"
                          value={form.nom}
                          onChange={(e) => set("nom", e.target.value)}
                        />
                      </Field>
                      <Field label={locale === "en" ? "You are" : "Vous êtes"} required error={fieldErr.acteur}>
                        <CrmSelect
                          value={form.acteur}
                          onChange={(v) => set("acteur", v)}
                          options={ACTEURS.map((a) => ({ value: a.k, label: a.l }))}
                        />
                      </Field>
                      <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2">
                        <Field label="Organisation">
                          <input
                            className="crm-input"
                            autoComplete="organization"
                            value={form.organisation}
                            onChange={(e) => set("organisation", e.target.value)}
                          />
                        </Field>
                        <Field label={locale === "en" ? "Role" : "Fonction"}>
                          <input
                            className="crm-input"
                            autoComplete="organization-title"
                            value={form.fonction}
                            onChange={(e) => set("fonction", e.target.value)}
                          />
                        </Field>
                      </div>
                      <Field label={locale === "en" ? "Sector" : "Secteur d’activité"}>
                        <input
                          className="crm-input"
                          value={form.secteur}
                          onChange={(e) => set("secteur", e.target.value)}
                        />
                      </Field>
                    </>
                  ) : null}

                  {step === 1 ? (
                    <>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="Email" error={fieldErr.email}>
                          <input
                            className={`crm-input ${fieldErr.email ? "border-[var(--negative)]" : ""}`}
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            value={form.email}
                            onChange={(e) => set("email", e.target.value)}
                          />
                        </Field>
                        <Field label={locale === "en" ? "Phone" : "Téléphone"} error={fieldErr.telephone}>
                          <input
                            className={`crm-input ${fieldErr.telephone ? "border-[var(--negative)]" : ""}`}
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            value={form.telephone}
                            onChange={(e) => set("telephone", e.target.value)}
                          />
                        </Field>
                      </div>
                      <Field label="WhatsApp">
                        <input
                          className="crm-input"
                          type="tel"
                          inputMode="tel"
                          value={form.whatsapp}
                          onChange={(e) => set("whatsapp", e.target.value)}
                        />
                      </Field>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label={locale === "en" ? "Country" : "Pays"} required error={fieldErr.pays}>
                          <PaysCombobox
                            value={form.pays}
                            code={form.paysCode}
                            lang={locale}
                            onChange={({ name, code }) => {
                              set("pays", name);
                              set("paysCode", code);
                              if (code) set("ville", "");
                            }}
                          />
                        </Field>
                        <Field label={locale === "en" ? "City" : "Ville"}>
                          <VilleCombobox
                            countryCode={form.paysCode}
                            value={form.ville}
                            lang={locale}
                            onChange={(v) => set("ville", v)}
                          />
                        </Field>
                      </div>
                      <Field label={locale === "en" ? "Website" : "Site web"} error={fieldErr.site}>
                        <input
                          className={`crm-input ${fieldErr.site ? "border-[var(--negative)]" : ""}`}
                          inputMode="url"
                          autoComplete="url"
                          value={form.site}
                          onChange={(e) => set("site", e.target.value)}
                        />
                      </Field>
                      <Field label="LinkedIn">
                        <input
                          className="crm-input"
                          inputMode="url"
                          value={form.linkedin}
                          onChange={(e) => set("linkedin", e.target.value)}
                        />
                      </Field>
                    </>
                  ) : null}

                  {step === 2 ? (
                    <>
                      <Field
                        label={
                          locale === "en" ? "How did you hear about us?" : "Comment nous avez-vous connus ?"
                        }
                      >
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
                        />
                      </Field>
                      <Field
                        label={locale === "en" ? "Your message" : "Votre message / objectif"}
                        error={fieldErr.pourquoi}
                      >
                        <textarea
                          className={`crm-input !h-auto py-2.5 min-h-[120px] ${
                            fieldErr.pourquoi ? "border-[var(--negative)]" : ""
                          }`}
                          rows={5}
                          value={form.pourquoi}
                          onChange={(e) => set("pourquoi", e.target.value)}
                        />
                      </Field>
                    </>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            {error ? (
              <p className="text-[13px] text-[var(--negative)] font-medium mt-3" role="alert">
                {error}
              </p>
            ) : null}

            {/* Actions sticky bas écran mobile */}
            <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:mx-0 mt-6 px-4 sm:px-6 lg:px-0 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[var(--surface-page)] border-t border-[var(--border-default)] lg:border-0 lg:bg-transparent lg:pt-0 lg:pb-0 flex gap-2">
              {step > 0 ? (
                <button type="button" className="crm-btn crm-btn-secondary !h-11 flex-1" onClick={goBack}>
                  {d.back}
                </button>
              ) : null}
              {step < 2 ? (
                <button type="button" className="crm-btn crm-btn-primary !h-11 flex-1" onClick={goNext}>
                  {d.continue}
                </button>
              ) : (
                <button type="button" className="crm-btn crm-btn-primary !h-11 flex-1" onClick={openConfirm}>
                  {d.send}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {confirmOpen ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => status !== "loading" && setConfirmOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal
              aria-labelledby="confirm-title"
              className="crm-card w-full sm:max-w-md p-5 shadow-[var(--shadow-2)] rounded-t-[16px] sm:rounded-[var(--radius-md)] max-h-[90dvh] overflow-auto"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="confirm-title" className="text-[18px] font-bold mb-1">
                {d.confirmTitle}
              </h3>
              <p className="text-[13px] text-[var(--text-secondary)] mb-4">{d.confirmHint}</p>
              <ul className="space-y-2 max-h-56 overflow-auto crm-scroll mb-5 text-[13px]">
                {summary.map(([k, v]) => (
                  <li
                    key={k}
                    className="flex justify-between gap-3 border-b border-[var(--border-default)] py-1.5"
                  >
                    <span className="text-[var(--text-tertiary)] shrink-0">{k}</span>
                    <span className="font-medium text-right break-words">{v}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="crm-btn crm-btn-secondary flex-1 !h-11"
                  disabled={status === "loading"}
                  onClick={() => setConfirmOpen(false)}
                >
                  {d.confirmNo}
                </button>
                <button
                  type="button"
                  className="crm-btn crm-btn-primary flex-1 !h-11 gap-2"
                  disabled={status === "loading"}
                  onClick={() => void doSubmit()}
                >
                  {status === "loading" ? (
                    <>
                      <i className="bi bi-arrow-repeat crm-spin" aria-hidden />
                      {d.sending}
                    </>
                  ) : (
                    d.confirmYes
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function LangSwitch({
  locale,
  setLang,
}: {
  locale: Locale;
  setLang: (l: Locale) => void;
}) {
  return (
    <div className="flex gap-1 shrink-0">
      <button
        type="button"
        className={`crm-btn !h-8 !px-2.5 gap-1 text-[12px] ${locale === "fr" ? "crm-btn-primary" : "crm-btn-secondary"}`}
        onClick={() => setLang("fr")}
        title="Français"
      >
        FR
      </button>
      <button
        type="button"
        className={`crm-btn !h-8 !px-2.5 gap-1 text-[12px] ${locale === "en" ? "crm-btn-primary" : "crm-btn-secondary"}`}
        onClick={() => setLang("en")}
        title="English"
      >
        EN
      </button>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="crm-label flex items-baseline gap-1.5">
        <span>{label}</span>
        {required ? <span className="text-[var(--negative)] text-[12px]">*</span> : null}
      </label>
      {children}
      {error ? <p className="text-[11px] text-[var(--negative)] mt-1">{error}</p> : null}
    </div>
  );
}
