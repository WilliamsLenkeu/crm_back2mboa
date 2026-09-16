import { collections, getDb, mongoClient } from "./index";

/** Indexes CRM + auth — idempotent. */
export async function ensureIndexes() {
  await mongoClient.connect();
  const db = getDb();

  await collections.contacts().createIndexes([
    { key: { id: 1 }, unique: true, name: "contacts_id_uq" },
    { key: { formToken: 1 }, unique: true, sparse: true, name: "contacts_form_token_uq" },
    { key: { acteur: 1 }, name: "contacts_acteur" },
    { key: { etapePipeline: 1 }, name: "contacts_etape" },
    { key: { ownerId: 1 }, name: "contacts_owner" },
    { key: { score: -1 }, name: "contacts_score" },
  ]);

  await collections.journal().createIndexes([
    { key: { id: 1 }, unique: true, name: "journal_id_uq" },
    { key: { contactId: 1 }, name: "journal_contact" },
  ]);

  await collections.userSettings().createIndexes([
    { key: { userId: 1 }, unique: true, name: "user_settings_user_uq" },
  ]);

  await collections.countries().createIndexes([
    { key: { code: 1 }, unique: true, name: "geo_countries_code_uq" },
    { key: { nameFrLower: 1 }, name: "geo_countries_fr" },
    { key: { nameEnLower: 1 }, name: "geo_countries_en" },
  ]);

  await collections.cities().createIndexes([
    { key: { country: 1, nameLower: 1 }, unique: true, name: "geo_cities_country_name_uq" },
    { key: { country: 1, name: 1 }, name: "geo_cities_country_name" },
  ]);

  // Better Auth collections
  await db.collection("user").createIndex({ email: 1 }, { unique: true, name: "user_email_uq" });
  await db.collection("session").createIndex({ token: 1 }, { unique: true, name: "session_token_uq" });
  await db.collection("session").createIndex({ userId: 1 }, { name: "session_user" });
  await db.collection("account").createIndex({ userId: 1 }, { name: "account_user" });
  await db.collection("verification").createIndex({ identifier: 1 }, { name: "verification_identifier" });
}
