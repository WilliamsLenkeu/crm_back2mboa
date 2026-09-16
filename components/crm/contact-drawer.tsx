"use client";

import { useEffect, useState } from "react";
import { ACTEURS, ETAPES, PRIORITES, SOURCES } from "@/lib/acteurs";
import { prioLabel, stageLabel } from "@/lib/i18n";
import { initials } from "@/lib/utils";
import { PaysCombobox, VilleCombobox } from "./geo-fields";
import { useLocale } from "./locale-context";
import { Field, PriorityBadge, StageBadge } from "./ui";
import { formatDate, type Contact } from "./types";

export function ContactDrawer({
  contact,
  tab,
  onTab,
  onClose,
  onSave,
  onDelete,
}: {
  contact: Contact;
  tab: "infos" | "activite";
  onTab: (t: "infos" | "activite") => void;
  onClose: () => void;
  onSave: (
    p: Partial<Contact> & { journalNote?: string },
    opts?: { keepOpen?: boolean },
  ) => void;
  onDelete: () => void;
}) {
  const { d } = useLocale();
  const isDraft = !contact.id;
  const [form, setForm] = useState(contact);
  const [note, setNote] = useState("");
  const [paysCode, setPaysCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setForm(contact);
    setNote("");
    setPaysCode("");
    setCopied(false);
  }, [contact]);

  useEffect(() => {
    const pays = (form.pays || "").trim();
    if (!pays || paysCode) return;
    let ok = true;
    void fetch(`/api/geo/countries?q=${encodeURIComponent(pays)}&limit=8`)
      .then((r) => r.json())
      .then((data) => {
        if (!ok) return;
        const hit = (data.items || []).find(
          (i: { name: string }) => i.name.toLowerCase() === pays.toLowerCase(),
        );
        if (hit?.code) setPaysCode(hit.code);
      })
      .catch(() => {});
    return () => {
      ok = false;
    };
  }, [form.pays, paysCode]);

  function set<K extends keyof Contact>(k: K, v: Contact[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const formUrl = form.formToken ? `/client/form/${form.formToken}` : "";

  async function copyFormLink() {
    if (!form.formToken) return;
    const absolute = `${window.location.origin}/client/form/${form.formToken}`;
    await navigator.clipboard.writeText(absolute);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-5 bg-black/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal
        aria-label={isDraft ? d.drawerNew : form.nom}
        className="crm-drawer flex w-full max-w-4xl max-h-[92dvh] flex-col overflow-hidden rounded-t-[16px] border border-[var(--border-default)] bg-white shadow-[var(--shadow-2)] sm:rounded-[12px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start gap-3 border-b border-[var(--border-default)] px-5 py-4 sm:px-6">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--color-primary-light)] font-bold text-[var(--color-primary-hover)]">
            {initials(form.nom || "?")}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[17px] font-bold">{isDraft ? d.drawerNew : form.nom}</h2>
            <p className="truncate text-[12px] text-[var(--text-secondary)]">
              {isDraft ? d.drawerDraftHint : form.organisation || form.fonction || form.acteur}
            </p>
            {!isDraft ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <PriorityBadge value={form.priorite} />
                <StageBadge etape={form.etapePipeline} />
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  {formatDate(contact.createdAt)} · {contact.completude}%
                </span>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="crm-btn crm-btn-ghost !h-8 !w-8 shrink-0 !p-0"
            onClick={onClose}
            aria-label={d.close}
          >
            ×
          </button>
        </div>

        {!isDraft ? (
          <div className="flex shrink-0 gap-1 border-b border-[var(--border-default)] px-5 sm:px-6">
            {(
              [
                ["infos", d.drawerTabInfos],
                ["activite", d.drawerTabActivity],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => onTab(k)}
                className={`-mb-px border-b-2 px-3 py-2.5 text-[13px] font-semibold ${
                  tab === k
                    ? "border-[var(--color-primary)] text-[var(--color-primary-hover)]"
                    : "border-transparent text-[var(--text-secondary)]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        ) : null}

        <div className="crm-scroll min-h-0 flex-1 overflow-auto p-5 sm:p-6">
          {tab === "infos" || isDraft ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label={`${d.fieldNom} *`} className="sm:col-span-2 lg:col-span-2">
                  <input
                    className="crm-input"
                    value={form.nom}
                    onChange={(e) => set("nom", e.target.value)}
                    autoFocus={isDraft}
                  />
                </Field>
                <Field label={d.fieldActeur}>
                  <select className="crm-input" value={form.acteur} onChange={(e) => set("acteur", e.target.value)}>
                    {ACTEURS.map((a) => (
                      <option key={a.k} value={a.k}>
                        {a.l}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={d.fieldOrg}>
                  <input
                    className="crm-input"
                    value={form.organisation || ""}
                    onChange={(e) => set("organisation", e.target.value)}
                  />
                </Field>
                <Field label={d.fieldFonction}>
                  <input
                    className="crm-input"
                    value={form.fonction || ""}
                    onChange={(e) => set("fonction", e.target.value)}
                  />
                </Field>
                <Field label={d.fieldEmail}>
                  <input
                    className="crm-input"
                    type="email"
                    value={form.email || ""}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </Field>
                <Field label={d.fieldPhone}>
                  <input
                    className="crm-input"
                    value={form.telephone || ""}
                    onChange={(e) => set("telephone", e.target.value)}
                  />
                </Field>
                <Field label={d.fieldWhatsapp}>
                  <input
                    className="crm-input"
                    value={form.whatsapp || ""}
                    onChange={(e) => set("whatsapp", e.target.value)}
                  />
                </Field>
                <Field label={d.fieldSite}>
                  <input className="crm-input" value={form.site || ""} onChange={(e) => set("site", e.target.value)} />
                </Field>
                <Field label={d.fieldPays}>
                  <PaysCombobox
                    value={form.pays || ""}
                    code={paysCode}
                    onChange={({ name, code }) => {
                      set("pays", name);
                      setPaysCode(code);
                      set("ville", "");
                    }}
                  />
                </Field>
                <Field label={d.fieldVille}>
                  <VilleCombobox countryCode={paysCode} value={form.ville || ""} onChange={(v) => set("ville", v)} />
                </Field>
                <Field label={d.fieldRegion}>
                  <input
                    className="crm-input"
                    value={form.region || ""}
                    onChange={(e) => set("region", e.target.value)}
                  />
                </Field>
                <Field label={d.fieldAdresse} className="sm:col-span-2 lg:col-span-2">
                  <input
                    className="crm-input"
                    value={form.adresse || ""}
                    onChange={(e) => set("adresse", e.target.value)}
                  />
                </Field>
                <Field label={d.fieldSecteur}>
                  <input
                    className="crm-input"
                    value={form.secteur || ""}
                    onChange={(e) => set("secteur", e.target.value)}
                  />
                </Field>
                <Field label={d.fieldSource}>
                  <select
                    className="crm-input"
                    value={form.source || ""}
                    onChange={(e) => set("source", e.target.value)}
                  >
                    <option value="">—</option>
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={d.fieldPriorite}>
                  <select
                    className="crm-input"
                    value={form.priorite || "Moyenne"}
                    onChange={(e) => set("priorite", e.target.value)}
                  >
                    {PRIORITES.map((pr) => (
                      <option key={pr} value={pr}>
                        {prioLabel(pr, d)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={d.fieldScore}>
                  <input
                    className="crm-input crm-mono"
                    type="number"
                    value={form.score}
                    onChange={(e) => set("score", Number(e.target.value) || 0)}
                  />
                </Field>
                <Field label={d.fieldEtape}>
                  <select
                    className="crm-input"
                    value={form.etapePipeline}
                    onChange={(e) => set("etapePipeline", e.target.value)}
                  >
                    {ETAPES.map((et) => (
                      <option key={et} value={et}>
                        {stageLabel(et, d)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={d.fieldRelance}>
                  <input
                    className="crm-input"
                    type="date"
                    value={form.prochaineRelance || ""}
                    onChange={(e) => set("prochaineRelance", e.target.value)}
                  />
                </Field>
                <Field label={d.fieldLinkedin}>
                  <input
                    className="crm-input"
                    value={form.linkedin || ""}
                    onChange={(e) => set("linkedin", e.target.value)}
                  />
                </Field>
                <Field label={d.fieldTags}>
                  <input className="crm-input" value={form.tags || ""} onChange={(e) => set("tags", e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <Field label={d.fieldContexte}>
                  <textarea className="crm-input" value={form.role || ""} onChange={(e) => set("role", e.target.value)} />
                </Field>
                <Field label={d.fieldPourquoi}>
                  <textarea
                    className="crm-input"
                    value={form.pourquoi || form.msg || ""}
                    onChange={(e) => set("pourquoi", e.target.value)}
                  />
                </Field>
                <Field label={d.fieldNotes}>
                  <textarea
                    className="crm-input"
                    value={form.notes || ""}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </Field>
              </div>
              {!isDraft && form.formToken ? (
                <div className="space-y-2 border-t border-[var(--border-default)] pt-4">
                  <p className="crm-label">{d.formLink}</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input className="crm-input min-w-0 flex-1 font-mono text-[11px]" readOnly value={formUrl} />
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        className="crm-btn crm-btn-primary !h-9 text-[12px]"
                        onClick={() => void copyFormLink()}
                      >
                        {copied ? d.copied : d.formLinkCopy}
                      </button>
                      <a
                        href={formUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="crm-btn crm-btn-secondary !h-9 text-[12px]"
                      >
                        {d.formLinkOpen}
                      </a>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="space-y-2">
                {(contact.journal || []).length === 0 ? (
                  <p className="text-[13px] text-[var(--text-tertiary)]">{d.drawerNoActivity}</p>
                ) : (
                  contact.journal!.map((j) => (
                    <div key={j.id} className="border-l-2 border-[var(--color-primary)] py-1 pl-3">
                      <p className="text-[13px]">{j.texte}</p>
                    </div>
                  ))
                )}
              </div>
              <Field label={d.drawerAddNote}>
                <textarea
                  className="crm-input"
                  placeholder={d.drawerNotePh}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </Field>
              <button
                type="button"
                className="crm-btn crm-btn-secondary"
                disabled={!note.trim()}
                onClick={() => {
                  onSave({ journalNote: note }, { keepOpen: true });
                  setNote("");
                }}
              >
                {d.drawerSave}
              </button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-2 border-t border-[var(--border-default)] px-5 py-3 sm:px-6">
          <button
            type="button"
            className="crm-btn crm-btn-primary min-w-[8rem] sm:min-w-[10rem]"
            onClick={() => onSave({ ...form, journalNote: note || undefined })}
          >
            {isDraft ? d.drawerCreate : d.drawerSave}
          </button>
          {isDraft ? (
            <button type="button" className="crm-btn crm-btn-secondary" onClick={onClose}>
              {d.close}
            </button>
          ) : (
            <button type="button" className="crm-btn crm-btn-danger ml-auto" onClick={onDelete}>
              {d.delete}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
