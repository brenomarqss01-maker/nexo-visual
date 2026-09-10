import { config as loadEnvironment } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createEmptyDatabase } from "@/data/seed";
import type { ConfigRecord, Database } from "@/data/types";

loadEnvironment({ path: ".env.supabase", override: false, quiet: true });
loadEnvironment({ override: false, quiet: true });

const TABLE_NAME = "application_state";
const DOCUMENT_ID = "primary";

type SupabaseConnection = {
  client: SupabaseClient;
  databaseAccessToken: string | undefined;
  usePrivilegedTableAccess: boolean;
};

let connection: SupabaseConnection | undefined;

function getEnvironmentValue(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function getSupabaseConnection(): SupabaseConnection {
  if (connection) return connection;

  const url = getEnvironmentValue("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL");
  const privilegedKey = getEnvironmentValue("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY");
  const publishableKey = getEnvironmentValue(
    "SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
  );
  const key = privilegedKey ?? publishableKey;

  if (!url) throw new Error("SUPABASE_URL não está configurada no servidor.");
  if (!key) throw new Error("A chave do Supabase não está configurada no servidor.");

  connection = {
    client: createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    }),
    databaseAccessToken: getEnvironmentValue("SUPABASE_DATABASE_ACCESS_TOKEN"),
    usePrivilegedTableAccess: Boolean(privilegedKey),
  };
  return connection;
}

function describeSupabaseError(error: unknown): string {
  if (!error || typeof error !== "object") return String(error);
  const record = error as { code?: string; details?: string; hint?: string; message?: string };
  return [
    record.message ?? String(error),
    record.code && `code=${record.code}`,
    record.details && `details=${record.details}`,
    record.hint && `hint=${record.hint}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

function requireDatabaseAccessToken(token: string | undefined): string {
  if (!token) {
    throw new Error(
      "SUPABASE_DATABASE_ACCESS_TOKEN não está configurado para o acesso protegido ao banco.",
    );
  }
  return token;
}

function normalizeDatabase(database: Database): { database: Database; migrated: boolean } {
  const guildIdsByClient = new Map(database.clients.map((client) => [client.id, client.guildId]));
  let migrated = false;
  const configs = database.configs.map((config) => {
    const legacyConfig = config as ConfigRecord & { guildId?: unknown };
    if (typeof legacyConfig.guildId === "string" && legacyConfig.guildId) return config;

    const guildId = guildIdsByClient.get(config.clientId);
    if (!guildId) return config;

    migrated = true;
    return { ...config, guildId };
  });

  const organizationStats = Array.isArray(database.organizationStats)
    ? database.organizationStats
    : [];
  if (organizationStats !== database.organizationStats) migrated = true;

  return migrated
    ? { database: { ...database, configs, organizationStats }, migrated: true }
    : { database, migrated: false };
}

async function readStoredDatabase(): Promise<Database | null> {
  const { client, databaseAccessToken, usePrivilegedTableAccess } = getSupabaseConnection();

  if (usePrivilegedTableAccess) {
    const { data, error } = await client
      .from(TABLE_NAME)
      .select("database")
      .eq("id", DOCUMENT_ID)
      .maybeSingle();
    if (error) throw new Error(`Falha ao carregar o Supabase: ${describeSupabaseError(error)}`);
    return data?.database ? (data.database as Database) : null;
  }

  const { data, error } = await client.rpc("load_application_state", {
    p_access_token: requireDatabaseAccessToken(databaseAccessToken),
  });
  if (error) throw new Error(`Falha ao carregar o Supabase: ${describeSupabaseError(error)}`);
  return data ? (data as Database) : null;
}

export async function saveDatabaseToSupabase(database: Database): Promise<void> {
  console.info("[Supabase] Salvando dados do painel...");
  const { client, databaseAccessToken, usePrivilegedTableAccess } = getSupabaseConnection();

  if (usePrivilegedTableAccess) {
    const { error } = await client.from(TABLE_NAME).upsert(
      {
        id: DOCUMENT_ID,
        database,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(`Falha ao salvar no Supabase: ${describeSupabaseError(error)}`);
  } else {
    const { error } = await client.rpc("save_application_state", {
      p_access_token: requireDatabaseAccessToken(databaseAccessToken),
      p_database: database,
    });
    if (error) throw new Error(`Falha ao salvar no Supabase: ${describeSupabaseError(error)}`);
  }

  console.info("[Supabase] Dados salvos com sucesso.");
}

export async function loadDatabaseFromSupabase(): Promise<Database> {
  console.info("[Supabase] Carregando dados do painel...");
  const stored = await readStoredDatabase();
  if (stored) {
    const normalized = normalizeDatabase(stored);
    if (normalized.migrated) await saveDatabaseToSupabase(normalized.database);
    console.info("[Supabase] Dados carregados com sucesso.");
    return normalized.database;
  }

  const emptyDatabase = createEmptyDatabase();
  await saveDatabaseToSupabase(emptyDatabase);
  console.info("[Supabase] Banco inicializado vazio.");
  return emptyDatabase;
}

export async function resetDatabaseInSupabase(): Promise<Database> {
  console.info("[Supabase] Limpando dados do painel...");
  const database = createEmptyDatabase();
  await saveDatabaseToSupabase(database);
  return database;
}
