import { config as loadEnvironment } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { MongoClient } from "mongodb";
import { createClient } from "@supabase/supabase-js";

loadEnvironment({ path: ".env.supabase", override: false, quiet: true });
loadEnvironment({ override: false, quiet: true });

const mongoUri = process.env.MONGODB_URI?.trim();
const supabaseUrl = (
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL
)?.trim();
const privilegedKey = (
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
)?.trim();
const publishableKey = (
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
)?.trim();
const databaseAccessToken = process.env.SUPABASE_DATABASE_ACCESS_TOKEN?.trim();

if (!mongoUri) throw new Error("MONGODB_URI não está configurada.");
if (!supabaseUrl) throw new Error("SUPABASE_URL não está configurada.");
if (!privilegedKey && !publishableKey) throw new Error("A chave do Supabase não está configurada.");
if (!privilegedKey && !databaseAccessToken) {
  throw new Error("SUPABASE_DATABASE_ACCESS_TOKEN não está configurado.");
}

const allowInsecureTls = process.env.MONGODB_TLS_INSECURE === "true";
const mongo = new MongoClient(mongoUri, {
  serverSelectionTimeoutMS: 15_000,
  ...(allowInsecureTls
    ? { tlsAllowInvalidCertificates: true, tlsAllowInvalidHostnames: true }
    : {}),
});
const supabase = createClient(supabaseUrl, privilegedKey ?? publishableKey, {
  auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
});

try {
  console.info("[Migração] Lendo o documento principal do MongoDB...");
  await mongo.connect();
  const document = await mongo
    .db("newbots")
    .collection("application_state")
    .findOne({ _id: "primary" });
  if (!document?.database) throw new Error("O documento principal não foi encontrado no MongoDB.");

  const database = document.database;
  const backupDirectory = join(process.cwd(), "backups");
  const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const backupPath = join(backupDirectory, `mongodb-application-state-${timestamp}.json`);
  await mkdir(backupDirectory, { recursive: true });
  await writeFile(backupPath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
  console.info(`[Migração] Backup local criado em ${backupPath}.`);

  let error;
  if (privilegedKey) {
    ({ error } = await supabase.from("application_state").upsert(
      {
        id: "primary",
        database,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    ));
  } else {
    ({ error } = await supabase.rpc("save_application_state", {
      p_access_token: databaseAccessToken,
      p_database: database,
    }));
  }
  if (error) throw new Error(`Não foi possível gravar no Supabase: ${error.message}`);

  console.info(
    `[Migração] Concluída: ${database.clients?.length ?? 0} clientes, ` +
      `${database.systems?.length ?? 0} sistemas e ${database.licenses?.length ?? 0} licenças.`,
  );
} finally {
  await mongo.close().catch(() => undefined);
}
