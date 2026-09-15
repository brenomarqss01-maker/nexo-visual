import { config as loadEnvironment } from "dotenv";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
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
  OrganizationMemberStat,
  OrganizationStats,
  ProductSalesStat,
  Settings,
  SystemConfig,
  SystemField,
} from "@/data/types";
import type {
  BotCustomization,
  BotCustomizationInput,
  DiscordViewerAccess,
  PersonalizationApplication,
} from "@/services/personalization/personalization.types";

loadEnvironment({ path: ".env.mongodb", override: true, quiet: true });
loadEnvironment({ override: false, quiet: true });

const STATE_COLLECTION = "application_state";
const BOT_CREDENTIALS_COLLECTION = "bot_credentials";
const BOT_CUSTOMIZATIONS_COLLECTION = "bot_customizations";
const DISCORD_MEMBER_ACCESS_CACHE_COLLECTION = "discord_member_access_cache";
const ORGANIZATION_EVENTS_COLLECTION = "estatisticas_eventos";
const STATE_ID = "primary";
const MANAGED_BY = "nexo-network-panel";
const COLLECTIONS = [
  "usuarios",
  "clientes",
  "servidores",
  "configuracoes_bot",
  "logs",
  ORGANIZATION_EVENTS_COLLECTION,
  BOT_CUSTOMIZATIONS_COLLECTION,
  DISCORD_MEMBER_ACCESS_CACHE_COLLECTION,
] as const;

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
  guildName?: string | undefined;
  botId: string;
  botName: string;
  encryptedToken: string;
  iv: string;
  authTag: string;
  managedBy: string;
  updatedAt: Date;
};

type BotCustomizationDocument = Omit<BotCustomization, "updatedAt"> & {
  _id: string;
  managedBy: string;
  updatedAt: Date;
};

type DiscordMemberAccessCacheDocument = {
  _id: string;
  discordId: string;
  guildId: string;
  roles: string[];
  managedBy: string;
  updatedAt: Date;
};

type ManagedCollectionDocument = {
  _id: string;
  managedBy: string;
  entityType: string;
  document: unknown;
  updatedAt: Date;
};

export type OrganizationEventInput = {
  eventId: string;
  guildId: string;
  type: "recruitment" | "sale";
  actor: {
    discordId: string;
    name: string;
  };
  recruited?:
    | {
        discordId: string;
        name: string;
      }
    | undefined;
  product?:
    | {
        id: string;
        name: string;
      }
    | undefined;
  quantity: number;
  revenue: number;
  occurredAt?: string | undefined;
};

type OrganizationEventDocument = OrganizationEventInput & {
  _id: string;
  managedBy: string;
  recordedAt: Date;
  occurredAt: string;
};

export class StatisticsAuthorizationError extends Error {}

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
  if (isRecord(value) && typeof value["toHexString"] === "function") {
    return String(value["toHexString"]());
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
    const uri = process.env["MONGODB_URI"]?.trim();
    if (!uri) throw new Error("MONGODB_URI não está configurada no servidor.");

    const connection = mongoose.createConnection(uri, { maxPoolSize: 1 });

    try {
      await connection.asPromise();
      const configuredName = process.env["MONGODB_DATABASE"]?.trim();
      const database = connection.getClient().db(configuredName || getDatabaseName(uri));
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
  guildName: string;
  botId: string;
  botName: string;
  token: string;
}): Promise<void> {
  const database = await getMongoDatabase();
  const collection = database.collection<BotCredentialDocument>(BOT_CREDENTIALS_COLLECTION);
  const conflictingCredential = await collection.findOne({
    guildId: input.guildId,
    managedBy: MANAGED_BY,
    _id: { $ne: input.clientId },
  });
  if (conflictingCredential) {
    throw new Error("Este servidor Discord já está vinculado ao bot de outro cliente.");
  }

  const encrypted = encryptBotToken(input.token);
  await collection.replaceOne(
    { _id: input.clientId },
    {
      clientId: input.clientId,
      guildId: input.guildId,
      guildName: input.guildName,
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
  guildName?: string | undefined;
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
    ...(document.guildName ? { guildName: document.guildName } : {}),
    botId: document.botId,
    botName: document.botName,
  };
}

function serializeBotCustomization(
  document: BotCustomizationDocument | null,
): BotCustomization | undefined {
  if (!document) return undefined;
  return {
    clientId: document.clientId,
    guildId: document.guildId,
    botId: document.botId,
    requestedName: document.requestedName,
    accentColor: document.accentColor,
    presenceStatus: document.presenceStatus,
    statusMessages: document.statusMessages,
    ...(document.avatarUrl ? { avatarUrl: document.avatarUrl } : {}),
    ...(document.bannerUrl ? { bannerUrl: document.bannerUrl } : {}),
    requestedBy: document.requestedBy,
    updatedAt: document.updatedAt.toISOString(),
  };
}

const DISCORD_API = "https://discord.com/api/v10";

type DiscordViewerGuild = {
  id: string;
  name: string;
  icon: string | null;
};

type DiscordGuildCacheEntry = {
  guilds: DiscordViewerGuild[];
  expiresAt: number;
  staleUntil: number;
};

type DiscordMemberRoleCacheEntry = {
  roles: string[];
  updatedAt: number;
};

const DISCORD_CACHE_FRESH_MS = 2 * 60 * 1_000;
const DISCORD_CACHE_STALE_MS = 30 * 60 * 1_000;
const DISCORD_MAX_RETRY_WAIT_MS = 15_000;
const viewerGuildCache = new Map<string, DiscordGuildCacheEntry>();
const memberRoleCache = new Map<string, DiscordMemberRoleCacheEntry>();
const memberRoleRequests = new Map<string, Promise<string[] | null>>();

class DiscordRateLimitError extends Error {
  constructor(readonly retryAfterMs: number) {
    super("O Discord limitou temporariamente a validação dos cargos.");
  }
}

function waitForDiscord(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function readDiscordRetryAfter(response: Response): Promise<number> {
  const headerSeconds = Number(response.headers.get("retry-after"));
  if (Number.isFinite(headerSeconds) && headerSeconds > 0) {
    return Math.ceil(headerSeconds * 1_000);
  }
  try {
    const body = (await response.clone().json()) as { retry_after?: number | undefined };
    if (typeof body.retry_after === "number" && Number.isFinite(body.retry_after)) {
      return Math.ceil(Math.max(body.retry_after, 0.25) * 1_000);
    }
  } catch {
    // Alguns proxies não preservam o corpo JSON do erro 429.
  }
  return 1_000;
}

async function fetchDiscordForViewer(path: string, accessToken: string): Promise<Response | null> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(`${DISCORD_API}${path}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "DiscordBot (https://nexobotss.vercel.app, 1.0)",
        },
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new Error("Não foi possível validar seus servidores no Discord.");
    }
    if (response.ok) return response;
    if (response.status === 404) return null;
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "O Discord não autorizou a leitura dos seus cargos. Saia e entre novamente no painel.",
      );
    }
    if (response.status === 429) {
      const retryAfterMs = await readDiscordRetryAfter(response);
      if (attempt < 2 && retryAfterMs <= DISCORD_MAX_RETRY_WAIT_MS) {
        await waitForDiscord(retryAfterMs + 150);
        continue;
      }
      throw new DiscordRateLimitError(retryAfterMs);
    }
    throw new Error(`Não foi possível validar seu acesso no Discord (HTTP ${response.status}).`);
  }
  throw new DiscordRateLimitError(1_000);
}

async function loadViewerGuilds(
  viewer: DiscordViewerAccess,
): Promise<Map<string, DiscordViewerGuild>> {
  if (!viewer.accessToken) return new Map();
  const now = Date.now();
  const cached = viewerGuildCache.get(viewer.discordId);
  if (cached && cached.expiresAt > now) {
    return new Map(cached.guilds.map((guild) => [guild.id, guild]));
  }

  try {
    const response = await fetchDiscordForViewer("/users/@me/guilds", viewer.accessToken);
    if (!response) return new Map();
    const guilds = (await response.json()) as DiscordViewerGuild[];
    viewerGuildCache.set(viewer.discordId, {
      guilds,
      expiresAt: now + DISCORD_CACHE_FRESH_MS,
      staleUntil: now + DISCORD_CACHE_STALE_MS,
    });
    return new Map(guilds.map((guild) => [guild.id, guild]));
  } catch (error) {
    if (error instanceof DiscordRateLimitError && cached && cached.staleUntil > now) {
      return new Map(cached.guilds.map((guild) => [guild.id, guild]));
    }
    throw error;
  }
}

async function loadViewerMemberRoles(
  viewer: DiscordViewerAccess,
  guildId: string,
): Promise<string[] | null> {
  const accessToken = viewer.accessToken;
  if (!accessToken) return null;
  const key = `${viewer.discordId}:${guildId}`;
  const now = Date.now();
  const memoryCached = memberRoleCache.get(key);
  if (memoryCached && memoryCached.updatedAt + DISCORD_CACHE_FRESH_MS > now) {
    return memoryCached.roles;
  }

  const existingRequest = memberRoleRequests.get(key);
  if (existingRequest) return existingRequest;

  const request = (async () => {
    const database = await getMongoDatabase();
    const collection = database.collection<DiscordMemberAccessCacheDocument>(
      DISCORD_MEMBER_ACCESS_CACHE_COLLECTION,
    );
    const persisted = await collection.findOne({ _id: key, managedBy: MANAGED_BY });
    const persistedUpdatedAt = persisted ? new Date(persisted.updatedAt).getTime() : 0;
    const persistedRoles = persisted?.roles.filter((role) => typeof role === "string") ?? [];

    if (persisted && persistedUpdatedAt + DISCORD_CACHE_FRESH_MS > now) {
      memberRoleCache.set(key, { roles: persistedRoles, updatedAt: persistedUpdatedAt });
      return persistedRoles;
    }

    try {
      const response = await fetchDiscordForViewer(
        `/users/@me/guilds/${guildId}/member`,
        accessToken,
      );
      if (!response) return null;
      const member = (await response.json()) as { roles?: unknown };
      const roles = Array.isArray(member.roles)
        ? [...new Set(member.roles.filter((role): role is string => typeof role === "string"))]
        : [];
      const updatedAt = new Date();
      memberRoleCache.set(key, { roles, updatedAt: updatedAt.getTime() });
      await collection.replaceOne(
        { _id: key },
        {
          discordId: viewer.discordId,
          guildId,
          roles,
          managedBy: MANAGED_BY,
          updatedAt,
        },
        { upsert: true },
      );
      return roles;
    } catch (error) {
      const staleRoles =
        memoryCached && memoryCached.updatedAt + DISCORD_CACHE_STALE_MS > now
          ? memoryCached.roles
          : persisted && persistedUpdatedAt + DISCORD_CACHE_STALE_MS > now
            ? persistedRoles
            : undefined;
      if (error instanceof DiscordRateLimitError && staleRoles) return staleRoles;
      throw error;
    }
  })();

  memberRoleRequests.set(key, request);
  try {
    return await request;
  } finally {
    if (memberRoleRequests.get(key) === request) memberRoleRequests.delete(key);
  }
}

async function viewerCanAccessClient(
  client: Client,
  viewer: DiscordViewerAccess,
): Promise<boolean> {
  if (client.discordId === viewer.discordId) return true;
  if (!client.accessRoleId || !viewer.accessToken) return false;
  if (client.accessRoleId === client.guildId) {
    return (await loadViewerGuilds(viewer)).has(client.guildId);
  }
  const roles = await loadViewerMemberRoles(viewer, client.guildId);
  return Boolean(roles?.includes(client.accessRoleId));
}

export async function assertClientAccessForViewer(
  clientId: string,
  guildId: string,
  viewer: DiscordViewerAccess,
): Promise<Client> {
  const database = await getMongoDatabase();
  const state = await readCanonicalDatabase(database);
  const client = state.clients.find((item) => item.id === clientId && item.guildId === guildId);
  if (!client || !(await viewerCanAccessClient(client, viewer))) {
    throw new Error("Você não possui acesso a esta aplicação.");
  }
  return client;
}

export async function loadPersonalizationApplicationsForViewer(
  viewer: DiscordViewerAccess,
): Promise<PersonalizationApplication[]> {
  const database = await getMongoDatabase();
  const state = await readCanonicalDatabase(database);
  const viewerGuilds = await loadViewerGuilds(viewer);
  const candidates = state.clients.filter(
    (client) =>
      client.discordId === viewer.discordId ||
      (Boolean(client.accessRoleId) && viewerGuilds.has(client.guildId)),
  );
  if (candidates.length === 0) {
    if (!viewer.accessToken && state.clients.some((client) => Boolean(client.accessRoleId))) {
      throw new Error(
        "Para validar seus cargos, saia e entre novamente no painel autorizando o acesso aos servidores do Discord.",
      );
    }
    return [];
  }

  const hasOwnedApplication = candidates.some((client) => client.discordId === viewer.discordId);
  const hasRoleApplication = candidates.some(
    (client) => client.discordId !== viewer.discordId && Boolean(client.accessRoleId),
  );
  if (!viewer.accessToken && !hasOwnedApplication && hasRoleApplication) {
    throw new Error(
      "Para validar seus cargos, saia e entre novamente no painel autorizando o acesso aos servidores do Discord.",
    );
  }

  const accessResults: Array<{ client: Client; allowed: boolean }> = [];
  for (const client of candidates) {
    accessResults.push({
      client,
      allowed: await viewerCanAccessClient(client, viewer),
    });
  }
  const clients = accessResults.filter((item) => item.allowed).map((item) => item.client);
  if (clients.length === 0) return [];

  const clientIds = clients.map((client) => client.id);
  const guildIds = clients.map((client) => client.guildId);
  const [credentials, customizations] = await Promise.all([
    database
      .collection<BotCredentialDocument>(BOT_CREDENTIALS_COLLECTION)
      .find({ clientId: { $in: clientIds }, managedBy: MANAGED_BY })
      .toArray(),
    database
      .collection<BotCustomizationDocument>(BOT_CUSTOMIZATIONS_COLLECTION)
      .find({ guildId: { $in: guildIds }, managedBy: MANAGED_BY })
      .toArray(),
  ]);
  const credentialByClient = new Map(credentials.map((item) => [item.clientId, item]));
  const customizationByGuild = new Map(customizations.map((item) => [item.guildId, item]));

  return clients.flatMap((client) => {
    const credential = credentialByClient.get(client.id);
    if (!credential || credential.guildId !== client.guildId) return [];
    const viewerGuild = viewerGuilds.get(client.guildId);
    return [
      {
        clientId: client.id,
        appName: client.appName,
        guildId: client.guildId,
        guildName: viewerGuild?.name || credential.guildName || client.appName,
        ...(viewerGuild?.icon
          ? {
              guildIconUrl: `https://cdn.discordapp.com/icons/${client.guildId}/${viewerGuild.icon}.png?size=128`,
            }
          : {}),
        botId: credential.botId,
        botName: credential.botName,
        accessMode: client.discordId === viewer.discordId ? "owner" : "role",
        ...(client.accessRoleId ? { accessRoleId: client.accessRoleId } : {}),
        customization: serializeBotCustomization(customizationByGuild.get(client.guildId) ?? null),
      },
    ];
  });
}

export async function loadPersonalizationContextForViewer(
  clientId: string,
  viewer: DiscordViewerAccess,
): Promise<{
  application: PersonalizationApplication;
  requesterName: string;
  token: string;
}> {
  const database = await getMongoDatabase();
  const state = await readCanonicalDatabase(database);
  const client = state.clients.find((item) => item.id === clientId);
  if (!client || !(await viewerCanAccessClient(client, viewer))) {
    throw new Error("Você não possui acesso a esta aplicação.");
  }

  const [credential, customization] = await Promise.all([
    database
      .collection<BotCredentialDocument>(BOT_CREDENTIALS_COLLECTION)
      .findOne({ clientId, guildId: client.guildId, managedBy: MANAGED_BY }),
    database
      .collection<BotCustomizationDocument>(BOT_CUSTOMIZATIONS_COLLECTION)
      .findOne({ guildId: client.guildId, managedBy: MANAGED_BY }),
  ]);
  if (!credential) {
    throw new Error("Esta aplicação ainda não possui um bot Discord conectado.");
  }

  return {
    application: {
      clientId: client.id,
      appName: client.appName,
      guildId: client.guildId,
      guildName: credential.guildName || client.appName,
      botId: credential.botId,
      botName: credential.botName,
      accessMode: client.discordId === viewer.discordId ? "owner" : "role",
      ...(client.accessRoleId ? { accessRoleId: client.accessRoleId } : {}),
      customization: serializeBotCustomization(customization),
    },
    requesterName:
      state.users.find((user) => user.discordId === viewer.discordId)?.name ??
      `Usuário ${viewer.discordId.slice(-4)}`,
    token: decryptBotToken(credential),
  };
}

export async function saveBotCustomizationForViewer(
  input: BotCustomizationInput,
  viewer: DiscordViewerAccess,
): Promise<BotCustomization> {
  const database = await getMongoDatabase();
  const context = await loadPersonalizationContextForViewer(input.clientId, viewer);
  const now = new Date();
  const document: BotCustomizationDocument = {
    _id: `nexo:bot_customization:${context.application.guildId}`,
    clientId: context.application.clientId,
    guildId: context.application.guildId,
    botId: context.application.botId,
    requestedName: input.requestedName,
    accentColor: input.accentColor,
    presenceStatus: input.presenceStatus,
    statusMessages: input.statusMessages,
    ...(input.avatarUrl ? { avatarUrl: input.avatarUrl } : {}),
    ...(input.bannerUrl ? { bannerUrl: input.bannerUrl } : {}),
    requestedBy: viewer.discordId,
    managedBy: MANAGED_BY,
    updatedAt: now,
  };

  const collection = database.collection<BotCustomizationDocument>(BOT_CUSTOMIZATIONS_COLLECTION);
  await collection.createIndex({ guildId: 1, managedBy: 1 }, { unique: true });
  await collection.replaceOne({ _id: document._id }, document, { upsert: true });
  return serializeBotCustomization(document)!;
}

function mergeRequiredSystems(systems: BotSystem[]): {
  systems: BotSystem[];
  additions: BotSystem[];
} {
  const existing = new Map(systems.map((system) => [system.id, system]));
  const additions = REQUIRED_SYSTEMS.filter((required) => !existing.has(required.id));
  const required = REQUIRED_SYSTEMS.map((system) => {
    const savedSystem = existing.get(system.id);
    if (!savedSystem) return system;

    const savedFields = Array.isArray(savedSystem.fields) ? savedSystem.fields : [];
    const savedKeys = new Set(savedFields.map((field) => field.key));
    const missingRequiredFields = system.fields.filter((field) => !savedKeys.has(field.key));

    return {
      ...system,
      ...savedSystem,
      id: system.id,
      createdAt: savedSystem.createdAt || system.createdAt,
      fields: [...savedFields, ...missingRequiredFields],
    };
  });
  const custom = systems.filter(
    (system) => !REQUIRED_SYSTEMS.some((requiredSystem) => requiredSystem.id === system.id),
  );
  return { systems: [...required, ...custom], additions };
}

function normalizeCanonicalDatabase(value: unknown): { database: Database; changed: boolean } {
  const initial = createEmptyDatabase();
  if (!isRecord(value)) return { database: initial, changed: true };

  const clients = Array.isArray(value["clients"]) ? (value["clients"] as Client[]) : [];
  const systems = Array.isArray(value["systems"]) ? (value["systems"] as BotSystem[]) : [];
  const licenses = Array.isArray(value["licenses"]) ? (value["licenses"] as License[]) : [];
  const users = Array.isArray(value["users"]) ? (value["users"] as AppUser[]) : initial.users;
  const logs = Array.isArray(value["logs"]) ? (value["logs"] as LogEntry[]) : [];
  const organizationStats = Array.isArray(value["organizationStats"])
    ? (value["organizationStats"] as OrganizationStats[])
    : [];
  const settings = isRecord(value["settings"])
    ? ({ ...initial.settings, ...value["settings"] } as Settings)
    : initial.settings;
  const guildIdsByClient = new Map(clients.map((client) => [client.id, client.guildId]));
  let changed =
    !Array.isArray(value["organizationStats"]) ||
    !Array.isArray(value["users"]) ||
    !isRecord(value["settings"]);
  const configs = (Array.isArray(value["configs"]) ? (value["configs"] as ConfigRecord[]) : []).map(
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
    accessRoleId: asString(
      valueAt(record, "accessRoleId", "access_role_id", "cargoAcessoId", "cargo_acesso_id") ??
        (server
          ? valueAt(server, "accessRoleId", "access_role_id", "cargoAcessoId", "cargo_acesso_id")
          : undefined),
    ),
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
    ...(Array.isArray(value["options"])
      ? { options: value["options"].map((option) => asString(option)).filter(Boolean) }
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

function emptyOrganizationStats(guildId: string): OrganizationStats {
  return {
    guildId,
    recruitmentsTotal: 0,
    salesTotal: 0,
    organizationRevenue: 0,
    products: [],
    recruiters: [],
    sellers: [],
    updatedAt: "",
  };
}

function calculateOrganizationStats(
  guildId: string,
  events: OrganizationEventDocument[],
): OrganizationStats {
  const statistics = emptyOrganizationStats(guildId);
  const products = new Map<string, ProductSalesStat>();
  const recruiters = new Map<string, OrganizationMemberStat>();
  const sellers = new Map<string, OrganizationMemberStat>();
  let latestUpdate = 0;

  for (const event of events) {
    const quantity = Math.max(1, Math.trunc(event.quantity));
    const recordedAt = event.recordedAt.getTime();
    if (recordedAt > latestUpdate) latestUpdate = recordedAt;

    if (event.type === "recruitment") {
      statistics.recruitmentsTotal += quantity;
      const current = recruiters.get(event.actor.discordId) ?? {
        discordId: event.actor.discordId,
        name: event.actor.name,
        count: 0,
        revenue: 0,
      };
      current.name = event.actor.name;
      current.count += quantity;
      recruiters.set(current.discordId, current);
      continue;
    }

    statistics.salesTotal += quantity;
    statistics.organizationRevenue += event.revenue;
    const seller = sellers.get(event.actor.discordId) ?? {
      discordId: event.actor.discordId,
      name: event.actor.name,
      count: 0,
      revenue: 0,
    };
    seller.name = event.actor.name;
    seller.count += quantity;
    seller.revenue += event.revenue;
    sellers.set(seller.discordId, seller);

    if (event.product) {
      const product = products.get(event.product.id) ?? {
        productId: event.product.id,
        name: event.product.name,
        quantity: 0,
        revenue: 0,
      };
      product.name = event.product.name;
      product.quantity += quantity;
      product.revenue += event.revenue;
      products.set(product.productId, product);
    }
  }

  statistics.products = [...products.values()].sort(
    (left, right) => right.quantity - left.quantity || right.revenue - left.revenue,
  );
  statistics.recruiters = [...recruiters.values()].sort((left, right) => right.count - left.count);
  statistics.sellers = [...sellers.values()].sort(
    (left, right) => right.count - left.count || right.revenue - left.revenue,
  );
  statistics.organizationRevenue = Number(statistics.organizationRevenue.toFixed(2));
  statistics.updatedAt = latestUpdate ? new Date(latestUpdate).toISOString() : "";
  return statistics;
}

async function readCanonicalDatabase(database: Db): Promise<Database> {
  const stored = await database
    .collection<ApplicationStateDocument>(STATE_COLLECTION)
    .findOne({ _id: STATE_ID });
  return stored?.database
    ? normalizeCanonicalDatabase(stored.database).database
    : recoverFromNamedCollections(database);
}

async function loadOrganizationStatistics(
  database: Db,
  guildIds: string[],
): Promise<OrganizationStats[]> {
  const uniqueGuildIds = [...new Set(guildIds.filter(Boolean))];
  if (uniqueGuildIds.length === 0) return [];
  const events = await database
    .collection<OrganizationEventDocument>(ORGANIZATION_EVENTS_COLLECTION)
    .find({ guildId: { $in: uniqueGuildIds }, managedBy: MANAGED_BY })
    .toArray();
  const eventsByGuild = new Map<string, OrganizationEventDocument[]>();
  for (const event of events) {
    const current = eventsByGuild.get(event.guildId) ?? [];
    current.push(event);
    eventsByGuild.set(event.guildId, current);
  }
  return uniqueGuildIds.map((guildId) =>
    calculateOrganizationStats(guildId, eventsByGuild.get(guildId) ?? []),
  );
}

function tokensMatch(received: string, expected: string): boolean {
  const receivedHash = createHash("sha256").update(received).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(receivedHash, expectedHash);
}

function hasActiveStatisticsLicense(
  state: Database,
  clientId: string,
  eventType: OrganizationEventInput["type"],
): boolean {
  const systemId = eventType === "recruitment" ? "base_registro_siglas" : "base_vendas";
  const now = Date.now();
  return state.licenses.some(
    (license) =>
      license.clientId === clientId &&
      license.systemId === systemId &&
      new Date(license.expiresAt).getTime() >= now,
  );
}

export async function recordOrganizationEvent(
  input: OrganizationEventInput,
  rawBotToken: string,
): Promise<{ duplicate: boolean; statistics: OrganizationStats }> {
  const database = await getMongoDatabase();
  const credential = await database
    .collection<BotCredentialDocument>(BOT_CREDENTIALS_COLLECTION)
    .findOne({ guildId: input.guildId, managedBy: MANAGED_BY });
  const receivedToken = rawBotToken.trim().replace(/^Bot\s+/i, "");
  let authenticated = false;
  if (credential && receivedToken) {
    try {
      authenticated = tokensMatch(receivedToken, decryptBotToken(credential));
    } catch {
      authenticated = false;
    }
  }
  if (!credential || !authenticated) {
    throw new StatisticsAuthorizationError("Bot não autorizado para este servidor.");
  }

  const state = await readCanonicalDatabase(database);
  const client = state.clients.find(
    (item) => item.id === credential.clientId && item.guildId === input.guildId,
  );
  if (!client) {
    throw new StatisticsAuthorizationError("Servidor não cadastrado para este bot.");
  }
  if (!hasActiveStatisticsLicense(state, client.id, input.type)) {
    throw new StatisticsAuthorizationError(
      "Este servidor não possui uma licença ativa para este tipo de evento.",
    );
  }

  const now = new Date();
  const occurredAtDate = input.occurredAt ? new Date(input.occurredAt) : now;
  const occurredAt = Number.isNaN(occurredAtDate.getTime())
    ? now.toISOString()
    : occurredAtDate.toISOString();
  const collection = database.collection<OrganizationEventDocument>(ORGANIZATION_EVENTS_COLLECTION);
  await collection.createIndex({ guildId: 1, type: 1, recordedAt: -1 });
  let duplicate = false;
  try {
    await collection.insertOne({
      ...input,
      _id: `${input.guildId}:${input.eventId}`,
      occurredAt,
      managedBy: MANAGED_BY,
      recordedAt: now,
    });
  } catch (error) {
    if (isRecord(error) && error["code"] === 11000) duplicate = true;
    else throw error;
  }
  const [statistics] = await loadOrganizationStatistics(database, [input.guildId]);
  return { duplicate, statistics: statistics ?? emptyOrganizationStats(input.guildId) };
}

async function canViewGuild(
  state: Database,
  guildId: string,
  viewer: DiscordViewerAccess,
): Promise<boolean> {
  const client = state.clients.find((item) => item.guildId === guildId);
  return client ? viewerCanAccessClient(client, viewer) : false;
}

export async function loadOrganizationStatisticsForViewer(
  guildId: string,
  viewer: DiscordViewerAccess,
): Promise<OrganizationStats> {
  const database = await getMongoDatabase();
  const state = await readCanonicalDatabase(database);
  if (!(await canViewGuild(state, guildId, viewer))) {
    throw new StatisticsAuthorizationError("Você não possui acesso a este servidor.");
  }
  const [statistics] = await loadOrganizationStatistics(database, [guildId]);
  return statistics ?? emptyOrganizationStats(guildId);
}

export async function resetOrganizationStatisticsForViewer(
  guildId: string,
  viewer: DiscordViewerAccess,
  scope: "all" | "recruitments" | "sales",
): Promise<OrganizationStats> {
  const database = await getMongoDatabase();
  const state = await readCanonicalDatabase(database);
  if (!(await canViewGuild(state, guildId, viewer))) {
    throw new StatisticsAuthorizationError("Você não possui acesso a este servidor.");
  }
  await database.collection<OrganizationEventDocument>(ORGANIZATION_EVENTS_COLLECTION).deleteMany({
    guildId,
    managedBy: MANAGED_BY,
    ...(scope === "recruitments"
      ? { type: "recruitment" as const }
      : scope === "sales"
        ? { type: "sale" as const }
        : {}),
  });
  const [statistics] = await loadOrganizationStatistics(database, [guildId]);
  return statistics ?? emptyOrganizationStats(guildId);
}

async function syncManagedCollection(
  database: Db,
  collectionName: string,
  entityType: string,
  documents: Array<{ id: string; document: unknown }>,
): Promise<void> {
  const collection = database.collection<ManagedCollectionDocument>(collectionName);
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
    .replaceOne({ _id: STATE_ID }, { database: state, updatedAt: new Date() }, { upsert: true });

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
          accessRoleId: client.accessRoleId,
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

  normalized.organizationStats = await loadOrganizationStatistics(
    database,
    normalized.clients.map((client) => client.guildId),
  );

  await saveDatabase(database, normalized);
  console.info(
    `[MongoDB] Dados recuperados: ${normalized.clients.length} clientes, ` +
      `${normalized.systems.length} sistemas e ${normalized.licenses.length} licenças.`,
  );
  return normalized;
}

export async function resetDatabaseInMongo(): Promise<Database> {
  const database = await getMongoDatabase();
  const emptyDatabase = createEmptyDatabase();
  await database
    .collection<OrganizationEventDocument>(ORGANIZATION_EVENTS_COLLECTION)
    .deleteMany({ managedBy: MANAGED_BY });
  await saveDatabase(database, emptyDatabase);
  return emptyDatabase;
}
