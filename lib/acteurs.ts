export const ACTEURS = [
  {
    k: "Bâtisseur-Solutionneur",
    l: "Bâtisseurs-Solutionneurs",
    v: "--a-bs",
    d: "Porteurs de solutions diaspora & terrain.",
  },
  {
    k: "Entreprise",
    l: "Entreprises",
    v: "--a-ent",
    d: "Entreprises privées et opérateurs économiques.",
  },
  {
    k: "Mairie / CTD",
    l: "Mairies & CTD",
    v: "--a-ctd",
    d: "Collectivités territoriales décentralisées.",
  },
  {
    k: "Institution / Régulateur",
    l: "Institutions & Régulateurs",
    v: "--a-ins",
    d: "Ministères, agences, établissements publics.",
  },
  {
    k: "PTF / Bailleur",
    l: "PTF & Bailleurs",
    v: "--a-ptf",
    d: "Partenaires techniques et financiers.",
  },
  {
    k: "Média d’influence",
    l: "Médias d'influence",
    v: "--a-med",
    d: "Médias et relais d'opinion.",
  },
] as const;

export type ActeurKey = (typeof ACTEURS)[number]["k"];

export const ETAPES = [
  "01_Nouveau",
  "02_Contacté",
  "03_Qualifié",
  "04_Engagé",
  "05_Partenaire",
  "06_Pause",
] as const;

export const PRIORITES = ["Haute", "Moyenne", "Basse"] as const;

/** Sources lead usuelles CRM */
export const SOURCES = [
  "Formulaire web",
  "Référence",
  "LinkedIn",
  "Événement",
  "Email entrant",
  "Appel entrant",
  "Partenaire",
  "Autre",
] as const;
