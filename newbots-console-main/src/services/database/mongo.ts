import { config as loadEnvironment } from "dotenv";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import mongoose, { type Connection } from "mongoose";
import type { Db, Document } from "mongodb";
import { createEmptyDatabase } from "@/data/seed";
import { REQUIRED_SYSTEMS } from "@/data/requiredSystems";
import type {
  AppUser,
  BotSystem,
  Client,
  ConfigRecord,
  ConfigValue,
  Database,
  License,
  LogEntry,
  OrganizationStats,
  Settings,
  SystemConfig,
  SystemField,
} from "@/data/types";

loadEnvironment({ path: ".env.mongodb", override: true, quiet: true });
loadEnvironment({ override: false, quiet: true });

const STATE_COLLECTION = "application_state";
const BOT_CREDENTIALS_COLLECTION = "bot_credentials";
const STATE_ID = "primary";
const MANAGED_BY = "nexo-network-panel";
const COLLECTIONS = ["usuarios", "clientes", "servidores", "configuracoes_bot", "logs"] as const;

type RawRecord = Record<string, unknown>;
type ApplicationStateDocument = {
  _id: string;
  database: Database;
  updatedAt: Date;
};

type BotCredentialDocument = {
  _id: string;
  clientId: string;
  guildId: string;
  botId: string;
  botName: string;
  encryptedToken: string;
  iv: string;
  authTag: string;
  managedBy: string;
  updatedAt: Date;
};

let databasePromise: Promise<Db> | undefined;
let activeConnection: Connection | undefined;

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function valueAt(record: RawRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (isRecord(value) && typeof value.toHexString === "function") {
    return String(value.toHexString());
  }
  return fallback;
}

function asDateString(value: unknown, fallback = new Date().toISOString()): string {
  if (value instanceof Date) return value.toISOString();
  const text = asString(value);
  if (!text) return fallback;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function documentBody(document: Document): RawRecord {
  const record = document as RawRecord;
  const nested = valueAt(record, "document", "data");
  return isRecord(nested) ? nested : record;
}

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const found = new Map<string, T>();
  for (const item of items) {
    const itemKey = key(item);
    if (itemKey) found.set(itemKey, item);
  }
  return [...found.values()];
}

function getDatabaseName(uri: string): string | undefined {
  const withoutQuery = uri.split("?", 1)[0] ?? "";
  const slash = withoutQuery.lastIndexOf("/");
  if (slash < 0 || slash === withoutQuery.length - 1) return undefined;
  const databaseName = withoutQuery.slice(slash + 1);
  try {
    return decodeURIComponent(databaseName);
  } catch {
    return databaseName;
  }
}

function describeMongoError(error: unknown): string {
  const raw = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return raw.replace(/mongodb(?:\+srv)?:\/\/[^@\s]+@/gi, "mongodb://***:***@");
}

async function inspectCollections(database: Db): Promise<void> {
  const names = new Set(
    (await database.listCollections({}, { nameOnly: true }).toArray()).map((item) => item.name),
  );
  const status = await Promise.all(
    COLLECTIONS.map(async (name) => ({
      name,
      exists: names.has(name),
      count: names.has(name) ? await database.collection(name).estimatedDocumentCount() : 0,
    })),
  );
  console.info(`[MongoDB] Coleções verificadas: ${JSON.stringify(status)}.`);
}

async function getMongoDatabase(): Promise<Db> {
  if (databasePromise) return databasePromise;

  databasePromise = (async () => {
    const uri = process.env.MONGODB_URI?.trim();
    if (!uri) throw new Error("MONGODB_URI não está configurada no servidor.");

    const connection = mongoose.createConnection(uri, { maxPoolSize: 1 });

    try {
      await connection.asPromise();
      const configuredName = process.env.MONGODB_DATABASE?.trim();
      const database = connection.client.db(configuredName || getDatabaseName(uri));
      await database.command({ ping: 1 });
      await inspectCollections(database);
      activeConnection = connection;
      console.info(`[MongoDB] Conectado ao banco "${database.databaseName}".`);
      return database;
    } catch (error) {
      await connection.close().catch(() => undefined);
      const details = describeMongoError(error);
      if (/tlsv1 alert internal error|SSL alert number 80/i.test(details)) {
        throw new Error(
          "O servidor encerrou a negociação TLS (SSL alert 80) antes da autenticação. " +
            "Confirme na Shard Cloud se a instância está ativa, se a URL de conexão está atualizada " +
            "e se conexões externas estão liberadas.",
        );
      }
      throw new Error(`Falha ao conectar ao MongoDB: ${details}`);
    }
  })().catch((error) => {
    databasePromise = undefined;
    activeConnection = undefined;
    throw error;
  });

  return databasePromise;
}

function getBotTokenEncryptionKey(): Buffer {
  const secret =
    process.env["BOT_TOKEN_ENCRYPTION_KEY"]?.trim() || process.env["DISCORD_CLIENT_SECRET"]?.trim();
  if (!secret) {
    throw new Error(
      "Configure BOT_TOKEN_ENCRYPTION_KEY ou DISCORD_CLIENT_SECRET para proteger os tokens dos bots.",
    );
  }
  return createHash("sha256").update(secret).digest();
}

function encryptBotToken(
  token: string,
): Pick<BotCredentialDocument, "encryptedToken" | "iv" | "authTag"> {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getBotTokenEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return {
    encryptedToken: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

function decryptBotToken(document: BotCredentialDocument): string {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getBotTokenEncryptionKey(),
    Buffer.from(document.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(document.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(document.encryptedToken, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export async function saveClientBotCredential(input: {
  clientId: string;
  guildId: string;
  botId: string;
  botName: string;
  token: string;
}): Promise<void> {
  const database = await getMongoDatabase();
  const encrypted = encryptBotToken(input.token);
  await database.collection<BotCredentialDocument>(BOT_CREDENTIALS_COLLECTION).replaceOne(
    { _id: input.clientId },
    {
      _id: input.clientId,
      clientId: input.clientId,
      guildId: input.guildId,
      botId: input.botId,
      botName: input.botName,
      ...encrypted,
      managedBy: MANAGED_BY,
      updatedAt: new Date(),
    },
    { upsert: true },
  );
}

export async function loadClientBotCredential(clientId: string): Promise<{
  token: string;
  guildId: string;
  botId: string;
  botName: string;
} | null> {
  const database = await getMongoDatabase();
  const document = await database
    .collection<BotCredentialDocument>(BOT_CREDENTIALS_COLLECTION)
    .findOne({ _id: clientId, managedBy: MANAGED_BY });
  if (!document) return null;
  return {
    token: decryptBotToken(document),
    guildId: document.guildId,
    botId: document.botId,
    botName: document.botName,
  };
}

function mergeRequiredSystems(systems: BotSystem[]): {
  systems: BotSystem[];
  additions: BotSystem[];
} {
  const existing = new Map(systems.map((system) => [system.id, system]));
  const additions = REQUIRED_SYSTEMS.filter((required) => !existing.has(required.id));
  const required = REQUIRED_SYSTEMS.map((system) => ({
    ...system,
    createdAt: existing.get(system.id)?.createdAt || system.createdAt,
  }));
  const custom = systems.filter(
    (system) => !REQUIRED_SYSTEMS.some((requiredSystem) => requiredSystem.id === system.id),
  );
  return { systems: [...required, ...custom], additions };
}

function normalizeCanonicalDatabase(value: unknown): { database: Database; changed: boolean } {
  const initial = createEmptyDatabase();
  if (!isRecord(value)) return { database: initial, changed: true };

  const clients = Array.isArray(value.clients) ? (value.clients as Client[]) : [];
  const systems = Array.isArray(value.systems) ? (value.systems as BotSystem[]) : [];
  const licenses = Array.isArray(value.licenses) ? (value.licenses as License[]) : [];
  const users = Array.isArray(value.users) ? (value.users as AppUser[]) : initial.users;
  const logs = Array.isArray(value.logs) ? (value.logs as LogEntry[]) : [];
  const organizationStats = Array.isArray(value.organizationStats)
    ? (value.organizationStats as OrganizationStats[])
    : [];
  const settings = isRecord(value.settings)
    ? ({ ...initial.settings, ...value.settings } as Settings)
    : initial.settings;
  const guildIdsByClient = new Map(clients.map((client) => [client.id, client.guildId]));
  let changed =
    !Array.isArray(value.organizationStats) ||
    !Array.isArray(value.users) ||
    !isRecord(value.settings);
  const configs = (Array.isArray(value.configs) ? (value.configs as ConfigRecord[]) : []).map(
    (config) => {
      if (config.guildId) return config;
      const guildId = guildIdsByClient.get(config.clientId);
      if (!guildId) return config;
      changed = true;
      return { ...config, guildId };
    },
  );
  const merged = mergeRequiredSystems(systems);
  if (merged.additions.length > 0) {
    changed = true;
    logs.unshift({
      id: `log_required_systems_${Date.now()}`,
      at: new Date().toISOString(),
      actor: "Sistema",
      action: "Sistemas obrigatórios restaurados",
      detail: merged.additions.map((system) => system.name).join(", "),
    });
  }

  return {
    database: {
      clients,
      systems: merged.systems,
      licenses,
      configs,
      organizationStats,
      users,
      logs: logs.slice(0, 1_000),
      settings,
    },
    changed,
  };
}

function normalizeUser(record: RawRecord): AppUser | null {
  const discordId = asString(
    valueAt(record, "discordId", "discord_id", "idDiscord", "usuarioId", "userId"),
  );
  if (!discordId) return null;
  const rawRole = asString(valueAt(record, "role", "cargo", "tipo", "permissao")).toLowerCase();
  return {
    discordId,
    name: asString(valueAt(record, "name", "nome", "username", "usuario"), discordId),
    role: rawRole === "admin" || rawRole === "administrador" ? "admin" : "client",
    avatarColor: asString(valueAt(record, "avatarColor", "avatar_color", "cor"), "#8b8b8b"),
  };
}

function normalizeClient(record: RawRecord, server?: RawRecord): Client | null {
  const id = asString(valueAt(record, "id", "clientId", "clienteId", "cliente_id", "_id"));
  if (!id) return null;
  const guildId = asString(
    valueAt(record, "guildId", "guild_id", "servidorId", "servidor_id", "serverId", "server_id") ??
      (server
        ? valueAt(server, "guildId", "guild_id", "servidorId", "servidor_id", "id", "_id")
        : undefined),
  );
  return {
    id,
    appName: asString(
      valueAt(record, "appName", "app_name", "nomeApp", "nome", "name"),
      server ? asString(valueAt(server, "name", "nome"), id) : id,
    ),
    discordId: asString(
      valueAt(record, "discordId", "discord_id", "usuarioId", "usuario_id", "ownerId"),
    ),
    guildId,
    createdAt: asDateString(valueAt(record, "createdAt", "created_at", "criadoEm", "dataCriacao")),
  };
}

function normalizeField(value: unknown, fallbackId: string): SystemField | null {
  if (!isRecord(value)) return null;
  const key = asString(valueAt(value, "key", "chave", "id"));
  if (!key) return null;
  const rawType = asString(valueAt(value, "type", "tipo"), "text");
  const validTypes = new Set([
    "text",
    "number",
    "discord_id",
    "discord_channel",
    "discord_role",
    "discord_category",
    "boolean",
    "select",
    "textarea",
  ]);
  return {
    id: asString(valueAt(value, "id"), fallbackId),
    key,
    title: asString(valueAt(value, "title", "titulo", "name", "nome"), key),
    label: asString(valueAt(value, "label", "descricao", "description"), key),
    type: (validTypes.has(rawType) ? rawType : "text") as SystemField["type"],
    required: Boolean(valueAt(value, "required", "obrigatorio")),
    ...(Array.isArray(value.options)
      ? { options: value.options.map((option) => asString(option)).filter(Boolean) }
      : {}),
  };
}

function normalizeSystem(record: RawRecord): BotSystem | null {
  const id = asString(valueAt(record, "id", "systemId", "sistemaId", "sistema_id", "_id"));
  const name = asString(valueAt(record, "name", "nome", "titulo"));
  if (!id || !name) return null;
  const rawFields = valueAt(record, "fields", "campos");
  const fields = Array.isArray(rawFields)
    ? rawFields
        .map((item, index) => normalizeField(item, `${id}_field_${index + 1}`))
        .filter((item): item is SystemField => Boolean(item))
    : [];
  return {
    id,
    name,
    description: asString(valueAt(record, "description", "descricao")),
    fields,
    createdAt: asDateString(valueAt(record, "createdAt", "created_at", "criadoEm")),
  };
}

function normalizeConfigValues(value: unknown): SystemConfig {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, ConfigValue] => {
      const item = entry[1];
      return typeof item === "string" || typeof item === "number" || typeof item === "boolean";
    }),
  );
}

function normalizeConfig(record: RawRecord, clients: Client[]): ConfigRecord | null {
  const guildId = asString(
    valueAt(record, "guildId", "guild_id", "servidorId", "servidor_id", "serverId"),
  );
  const explicitClientId = asString(valueAt(record, "clientId", "clienteId", "cliente_id"));
  const clientId =
    explicitClientId || clients.find((client) => client.guildId === guildId)?.id || "";
  const systemId = asString(valueAt(record, "systemId", "sistemaId", "sistema_id", "botId"));
  if (!guildId || !clientId || !systemId) return null;
  return {
    guildId,
    clientId,
    systemId,
    values: normalizeConfigValues(valueAt(record, "values", "config", "configuracao", "dados")),
    updatedAt: asDateString(valueAt(record, "updatedAt", "updated_at", "atualizadoEm")),
  };
}

function normalizeLog(record: RawRecord): LogEntry | null {
  const id = asString(valueAt(record, "id", "logId", "_id"));
  const action = asString(valueAt(record, "action", "acao", "evento", "type", "tipo"));
  if (!id || !action) return null;
  return {
    id,
    at: asDateString(valueAt(record, "at", "createdAt", "created_at", "data")),
    actor: asString(valueAt(record, "actor", "autor", "usuario", "user"), "Sistema"),
    action,
    detail: asString(valueAt(record, "detail", "detalhe", "descricao", "message", "mensagem")),
  };
}

function normalizeLicense(record: RawRecord): License | null {
  const clientId = asString(valueAt(record, "clientId", "clienteId", "cliente_id"));
  const systemId = asString(valueAt(record, "systemId", "sistemaId", "sistema_id", "botId"));
  if (!clientId || !systemId) return null;
  return {
    id: asString(valueAt(record, "id", "licenseId", "licencaId", "_id"), `${clientId}:${systemId}`),
    clientId,
    systemId,
    createdAt: asDateString(valueAt(record, "createdAt", "created_at", "criadoEm")),
    expiresAt: asDateString(valueAt(record, "expiresAt", "expires_at", "expiraEm", "validade")),
  };
}

function embeddedLicenses(record: RawRecord, clientId: string): License[] {
  const raw = valueAt(record, "licenses", "licencas", "systems", "sistemas", "bots");
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index): License | null => {
      const itemRecord = isRecord(item) ? item : { systemId: item };
      return normalizeLicense({
        ...itemRecord,
        id: valueAt(itemRecord, "id", "licenseId", "licencaId") ?? `${clientId}:embedded:${index}`,
        clientId,
      });
    })
    .filter((item): item is License => Boolean(item));
}

async function readCollection(database: Db, name: string, limit = 10_000): Promise<RawRecord[]> {
  const documents = await database.collection(name).find({}).limit(limit).toArray();
  return documents.map(documentBody);
}

async function recoverFromNamedCollections(database: Db): Promise<Database> {
  const [userDocs, clientDocs, serverDocs, configDocs, logDocs, systemDocs, licenseDocs] =
    await Promise.all([
      readCollection(database, "usuarios"),
      readCollection(database, "clientes"),
      readCollection(database, "servidores"),
      readCollection(database, "configuracoes_bot"),
      readCollection(database, "logs", 1_000),
      readCollection(database, "sistemas"),
      readCollection(database, "licencas"),
    ]);

  const serversByClient = new Map<string, RawRecord>();
  for (const server of serverDocs) {
    const clientId = asString(valueAt(server, "clientId", "clienteId", "cliente_id"));
    if (clientId) serversByClient.set(clientId, server);
  }

  const clients = uniqueBy(
    clientDocs
      .map((record) => {
        const id = asString(valueAt(record, "id", "clientId", "clienteId", "cliente_id", "_id"));
        return normalizeClient(record, serversByClient.get(id));
      })
      .filter((item): item is Client => Boolean(item)),
    (client) => client.id,
  );

  for (const server of serverDocs) {
    const clientId = asString(valueAt(server, "clientId", "clienteId", "cliente_id"));
    if (clientId && clients.some((client) => client.id === clientId)) continue;
    const recovered = normalizeClient({ ...server, id: clientId || valueAt(server, "id", "_id") });
    if (recovered) clients.push(recovered);
  }

  const users = uniqueBy(
    userDocs.map(normalizeUser).filter((item): item is AppUser => Boolean(item)),
    (user) => user.discordId,
  );
  const systems = systemDocs
    .map(normalizeSystem)
    .filter((item): item is BotSystem => Boolean(item));
  const configs = uniqueBy(
    configDocs
      .map((record) => normalizeConfig(record, clients))
      .filter((item): item is ConfigRecord => Boolean(item)),
    (config) => `${config.guildId}:${config.systemId}`,
  );
  const logs = uniqueBy(
    logDocs.map(normalizeLog).filter((item): item is LogEntry => Boolean(item)),
    (log) => log.id,
  );
  const licenses = uniqueBy(
    [
      ...licenseDocs.map(normalizeLicense).filter((item): item is License => Boolean(item)),
      ...clientDocs.flatMap((record) => {
        const clientId = asString(
          valueAt(record, "id", "clientId", "clienteId", "cliente_id", "_id"),
        );
        return embeddedLicenses(record, clientId);
      }),
      ...serverDocs.flatMap((record) => {
        const clientId = asString(valueAt(record, "clientId", "clienteId", "cliente_id"));
        return embeddedLicenses(record, clientId);
      }),
    ],
    (license) => license.id,
  );

  const initial = createEmptyDatabase();
  return normalizeCanonicalDatabase({
    ...initial,
    clients,
    systems,
    licenses,
    configs,
    users: users.length > 0 ? users : initial.users,
    logs,
  }).database;
}

async function syncManagedCollection(
  database: Db,
  collectionName: string,
  entityType: string,
  documents: Array<{ id: string; document: unknown }>,
): Promise<void> {
  const collection = database.collection(collectionName);
  const ids = documents.map((item) => `nexo:${entityType}:${item.id}`);
  await collection.deleteMany({
    managedBy: MANAGED_BY,
    entityType,
    ...(ids.length > 0 ? { _id: { $nin: ids } } : {}),
  });
  if (documents.length === 0) return;
  await collection.bulkWrite(
    documents.map((item) => ({
      replaceOne: {
        filter: { _id: `nexo:${entityType}:${item.id}` },
        replacement: {
          _id: `nexo:${entityType}:${item.id}`,
          managedBy: MANAGED_BY,
          entityType,
          document: item.document,
          updatedAt: new Date(),
        },
        upsert: true,
      },
    })),
    { ordered: false },
  );
}

async function saveDatabase(database: Db, state: Database): Promise<void> {
  await database
    .collection<ApplicationStateDocument>(STATE_COLLECTION)
    .replaceOne(
      { _id: STATE_ID },
      { _id: STATE_ID, database: state, updatedAt: new Date() },
      { upsert: true },
    );

  const licensesByClient = new Map<string, License[]>();
  for (const license of state.licenses) {
    const current = licensesByClient.get(license.clientId) ?? [];
    current.push(license);
    licensesByClient.set(license.clientId, current);
  }

  await Promise.all([
    syncManagedCollection(
      database,
      "usuarios",
      "user",
      state.users.map((document) => ({ id: document.discordId, document })),
    ),
    syncManagedCollection(
      database,
      "clientes",
      "client",
      state.clients.map((document) => ({ id: document.id, document })),
    ),
    syncManagedCollection(
      database,
      "servidores",
      "server",
      state.clients.map((client) => ({
        id: client.guildId || client.id,
        document: {
          guildId: client.guildId,
          clientId: client.id,
          appName: client.appName,
          licenses: licensesByClient.get(client.id) ?? [],
          statistics: state.organizationStats.find((item) => item.guildId === client.guildId),
        },
      })),
    ),
    syncManagedCollection(
      database,
      "configuracoes_bot",
      "config",
      state.configs.map((document) => ({
        id: `${document.guildId}:${document.systemId}`,
        document,
      })),
    ),
    syncManagedCollection(database, "configuracoes_bot", "settings", [
      { id: "primary", document: state.settings },
    ]),
    syncManagedCollection(
      database,
      "logs",
      "log",
      state.logs.map((document) => ({ id: document.id, document })),
    ),
    syncManagedCollection(
      database,
      "sistemas",
      "system",
      state.systems.map((document) => ({ id: document.id, document })),
    ),
    syncManagedCollection(
      database,
      "licencas",
      "license",
      state.licenses.map((document) => ({ id: document.id, document })),
    ),
  ]);

  const clientIds = state.clients.map((client) => client.id);
  await database.collection(BOT_CREDENTIALS_COLLECTION).deleteMany({
    managedBy: MANAGED_BY,
    ...(clientIds.length > 0 ? { clientId: { $nin: clientIds } } : {}),
  });
}

export async function saveDatabaseToMongo(state: Database): Promise<void> {
  const database = await getMongoDatabase();
  const normalized = normalizeCanonicalDatabase(state).database;
  await saveDatabase(database, normalized);
  console.info("[MongoDB] Dados salvos e coleções sincronizadas.");
}

export async function loadDatabaseFromMongo(): Promise<Database> {
  console.info("[MongoDB] Carregando dados do painel...");
  const database = await getMongoDatabase();
  const stored = await database
    .collection<ApplicationStateDocument>(STATE_COLLECTION)
    .findOne({ _id: STATE_ID });
  const normalized = stored?.database
    ? normalizeCanonicalDatabase(stored.database).database
    : await recoverFromNamedCollections(database);

  await saveDatabase(database, normalized);
  console.info(
    `[MongoDB] Dados recuperados: ${normalized.clients.length} clientes, ` +
      `${normalized.systems.length} sistemas e ${normalized.licenses.length} licenças.`,
  );
  return normalized;
}

export async function resetDatabaseInMongo(): Promise<Database> {
  const database = createEmptyDatabase();
  await saveDatabaseToMongo(database);
  return database;
}
