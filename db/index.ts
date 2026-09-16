import { MongoClient, type Db, type Collection } from "mongodb";
import type {
  ContactDoc,
  JournalDoc,
  UserSettingsDoc,
  GeoCountryDoc,
  GeoCityDoc,
} from "./schema";

function requireUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI manquant dans .env");
  return uri;
}

const g = globalThis as unknown as {
  _mongoClient?: MongoClient;
};

function getClient() {
  if (!g._mongoClient) {
    g._mongoClient = new MongoClient(requireUri());
  }
  return g._mongoClient;
}

/** Client Mongo (Better Auth + CRM). Lazy connect via driver. */
export const mongoClient = getClient();

/** DB nommée dans l’URI (`…mongodb.net/crm_back2mboa?…`) sinon défaut driver. */
export function getDb(): Db {
  return mongoClient.db();
}

export const collections = {
  contacts: () => getDb().collection<ContactDoc>("contacts"),
  journal: () => getDb().collection<JournalDoc>("journal_entries"),
  userSettings: () => getDb().collection<UserSettingsDoc>("user_settings"),
  countries: () => getDb().collection<GeoCountryDoc>("geo_countries"),
  cities: () => getDb().collection<GeoCityDoc>("geo_cities"),
};

export type { Collection };
