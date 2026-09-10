import type { Database } from "./types";
import {
  loadDatabase,
  resetDatabase as resetRemoteDatabase,
  saveDatabase,
} from "@/services/database/database.functions";

/** Persistência remota: os dados ficam no MongoDB, nunca no navegador. */
export interface Repository {
  load(): Promise<Database>;
  save(database: Database): Promise<void>;
  reset(): Promise<Database>;
}

export const repository: Repository = {
  load: () => loadDatabase(),
  save: (database) => saveDatabase({ data: { database } }),
  reset: () => resetRemoteDatabase(),
};
