import "dotenv/config";
import { syncCitiesFromApi, syncCountriesFromApi } from "../lib/geo-cache";
import { ensureIndexes } from "../db/ensure-indexes";
import { mongoClient } from "../db";

async function main() {
  await ensureIndexes();
  const n = await syncCountriesFromApi();
  console.log(`geo_countries synchronisés: ${n}`);
  const cities = await syncCitiesFromApi();
  console.log(`geo_cities synchronisés: ${cities.total}`);
  await mongoClient.close();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await mongoClient.close();
  } catch {
    /* */
  }
  process.exit(1);
});
