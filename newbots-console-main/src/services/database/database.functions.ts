import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/data/types";
import { loadDatabaseFromMongo, resetDatabaseInMongo, saveDatabaseToMongo } from "./mongo";

export const loadDatabase = createServerFn({ method: "GET" }).handler(async () =>
  loadDatabaseFromMongo(),
);

export const saveDatabase = createServerFn({ method: "POST" })
  .validator(z.object({ database: z.unknown() }))
  .handler(async ({ data }) => {
    await saveDatabaseToMongo(data.database as Database);
  });

export const resetDatabase = createServerFn({ method: "POST" }).handler(async () =>
  resetDatabaseInMongo(),
);
