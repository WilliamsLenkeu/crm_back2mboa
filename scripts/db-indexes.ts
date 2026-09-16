import "dotenv/config";
import { ensureIndexes } from "../db/ensure-indexes";
import { mongoClient } from "../db";

ensureIndexes()
  .then(async () => {
    console.log("Indexes MongoDB OK");
    await mongoClient.close();
  })
  .catch(async (e) => {
    console.error(e);
    try {
      await mongoClient.close();
    } catch {
      /* */
    }
    process.exit(1);
  });
