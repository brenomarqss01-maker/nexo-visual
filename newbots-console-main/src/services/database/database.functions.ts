import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ADMIN_DISCORD_ID } from "@/data/seed";
import type { Database, SystemConfig } from "@/data/types";
import { requireAuthenticatedDiscordSession } from "@/services/auth/discordSession";
import { sendSiteLog } from "@/services/discordSiteLog";
import { loadDatabaseFromMongo, resetDatabaseInMongo, saveDatabaseToMongo } from "./mongo";

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function collectionChangeSummary<T>(
  previous: T[],
  next: T[],
  label: string,
  getId: (item: T) => string,
): string | null {
  const previousById = new Map(previous.map((item) => [getId(item), item]));
  const nextById = new Map(next.map((item) => [getId(item), item]));
  const added = next.filter((item) => !previousById.has(getId(item))).length;
  const removed = previous.filter((item) => !nextById.has(getId(item))).length;
  const updated = next.filter((item) => {
    const oldItem = previousById.get(getId(item));
    return oldItem !== undefined && !sameValue(oldItem, item);
  }).length;
  if (added + removed + updated === 0) return null;
  return `${label}: ${added} adicionado(s), ${updated} alterado(s), ${removed} removido(s)`;
}

function changedConfigFields(previous: SystemConfig | undefined, next: SystemConfig): string[] {
  const keys = new Set([...Object.keys(previous ?? {}), ...Object.keys(next)]);
  return [...keys].filter((key) => !sameValue(previous?.[key], next[key]));
}

async function auditDatabaseChanges(
  previous: Database,
  next: Database,
  actorId: string,
): Promise<void> {
  const previousConfigs = new Map(
    previous.configs.map((config) => [`${config.guildId}:${config.systemId}`, config]),
  );
  const changedConfigs = next.configs
    .map((config) => ({
      config,
      previous: previousConfigs.get(`${config.guildId}:${config.systemId}`),
    }))
    .filter(({ config, previous: oldConfig }) => !sameValue(oldConfig?.values, config.values));

  const adminChanges = [
    collectionChangeSummary(previous.clients, next.clients, "Clientes", (item) => item.id),
    collectionChangeSummary(previous.systems, next.systems, "Sistemas", (item) => item.id),
    collectionChangeSummary(previous.licenses, next.licenses, "Licenças", (item) => item.id),
    collectionChangeSummary(previous.users, next.users, "Usuários", (item) => item.discordId),
    !sameValue(previous.settings, next.settings) ? "Configurações gerais alteradas" : null,
  ].filter((item): item is string => Boolean(item));

  await Promise.all([
    ...changedConfigs.map(({ config, previous: oldConfig }) => {
      const client = next.clients.find((item) => item.id === config.clientId);
      const system = next.systems.find((item) => item.id === config.systemId);
      const fields = changedConfigFields(oldConfig?.values, config.values);
      return sendSiteLog({
        category: "changes",
        title: oldConfig ? "Configuração atualizada" : "Configuração criada",
        actorId,
        fields: [
          { name: "Aplicação", value: client?.appName ?? config.clientId, inline: true },
          { name: "Sistema", value: system?.name ?? config.systemId, inline: true },
          { name: "Servidor", value: config.guildId, inline: true },
          { name: "Campos alterados", value: fields.join(", ") || "Nenhum campo identificado" },
        ],
      });
    }),
    ...(adminChanges.length > 0
      ? [
          sendSiteLog({
            category: "admin" as const,
            title: "Dados administrativos alterados",
            actorId,
            description: adminChanges.join("\n"),
          }),
        ]
      : []),
  ]);
}

export const loadDatabase = createServerFn({ method: "GET" }).handler(async () =>
  loadDatabaseFromMongo(),
);

export const saveDatabase = createServerFn({ method: "POST" })
  .validator(z.object({ database: z.unknown() }))
  .handler(async ({ data }) => {
    const viewer = await requireAuthenticatedDiscordSession();
    const previous = await loadDatabaseFromMongo();
    const next = data.database as Database;
    await saveDatabaseToMongo(next);
    await auditDatabaseChanges(previous, next, viewer.discordId);
  });

export const resetDatabase = createServerFn({ method: "POST" }).handler(async () => {
  const viewer = await requireAuthenticatedDiscordSession();
  if (viewer.discordId !== ADMIN_DISCORD_ID) {
    throw new Error("Apenas o administrador NEXO pode limpar o banco de dados.");
  }
  const database = await resetDatabaseInMongo();
  await sendSiteLog({
    category: "admin",
    title: "Banco de dados restaurado",
    description: "Clientes, licenças, configurações e registros foram restaurados.",
    actorId: viewer.discordId,
  });
  return database;
});
