export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function calcCompletude(c: {
  email?: string | null;
  telephone?: string | null;
  organisation?: string | null;
  fonction?: string | null;
  secteur?: string | null;
  pays?: string | null;
  ville?: string | null;
  site?: string | null;
  linkedin?: string | null;
  source?: string | null;
  pourquoi?: string | null;
  msg?: string | null;
}) {
  const fields = [
    c.email,
    c.telephone,
    c.organisation,
    c.fonction,
    c.secteur,
    c.pays,
    c.ville,
    c.site || c.linkedin,
    c.source,
    c.pourquoi || c.msg,
  ];
  const filled = fields.filter((v) => v && String(v).trim()).length;
  return Math.round((filled / fields.length) * 100);
}
