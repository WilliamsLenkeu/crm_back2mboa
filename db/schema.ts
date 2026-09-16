/** Types métier CRM (MongoDB). Better Auth gère user/session/account/verification. */

export type ContactDoc = {
  id: string;
  formToken?: string | null;
  acteur: string;
  nom: string;
  categorie?: string;
  organisation?: string;
  fonction?: string;
  dirigeant?: string;
  role?: string;
  secteur?: string;
  cluster?: string;
  etapeMece?: string;
  maillons?: string;
  mairie?: string;
  region?: string;
  departement?: string;
  pays?: string;
  ville?: string;
  adresse?: string;
  email?: string;
  telephone?: string;
  whatsapp?: string;
  site?: string;
  linkedin?: string;
  source?: string;
  tags?: string;
  prochaineRelance?: string;
  pourquoi?: string;
  msg?: string;
  priorite?: string;
  score: number;
  etapePipeline: string;
  ownerId?: string | null;
  pack?: string;
  valeur?: number;
  notes?: string;
  completude: number;
  aVerifier?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type JournalDoc = {
  id: string;
  contactId: string;
  userId?: string | null;
  texte: string;
  createdAt: Date;
};

export type UserSettingsDoc = {
  userId: string;
  prefs: Record<string, unknown>;
  updatedAt: Date;
};

export type GeoCountryDoc = {
  code: string;
  nameEn: string;
  nameFr: string;
  flag: string;
  nameEnLower: string;
  nameFrLower: string;
  updatedAt: Date;
};

export type GeoCityDoc = {
  country: string;
  name: string;
  nameLower: string;
  updatedAt: Date;
};
