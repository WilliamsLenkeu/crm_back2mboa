/** Champs exposés au formulaire client lié (pas d’id, notes, score, pipeline…) */
export const PUBLIC_FORM_KEYS = [
  "nom",
  "acteur",
  "organisation",
  "fonction",
  "email",
  "telephone",
  "whatsapp",
  "pays",
  "ville",
  "secteur",
  "site",
  "linkedin",
  "source",
  "tags",
  "pourquoi",
] as const;

export type PublicFormFields = {
  [K in (typeof PUBLIC_FORM_KEYS)[number]]: string;
};

export function toPublicForm(row: Record<string, unknown>): PublicFormFields {
  const out = {} as PublicFormFields;
  for (const k of PUBLIC_FORM_KEYS) {
    out[k] = String(row[k] ?? "");
  }
  return out;
}

export function newFormToken() {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}
