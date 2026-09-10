import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { loadClientBotCredential, saveClientBotCredential } from "@/services/database/mongo";

const DISCORD_API = "https://discord.com/api/v10";

const connectBotSchema = z.object({
  clientId: z.string().min(1),
  guildId: z.string().regex(/^\d+$/, "ID do servidor inválido."),
  token: z.string().min(20, "Token do bot inválido."),
});

const resourcesSchema = z.object({
  clientId: z.string().min(1),
  guildId: z.string().regex(/^\d+$/, "ID do servidor inválido."),
});

interface DiscordBotUser {
  id: string;
  username: string;
  global_name?: string | null;
  bot?: boolean;
}

interface DiscordGuild {
  id: string;
  name: string;
}

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  position?: number;
  parent_id?: string | null;
}

interface DiscordRole {
  id: string;
  name: string;
  position: number;
  managed?: boolean;
}

function normalizeBotToken(token: string): string {
  return token.trim().replace(/^Bot\s+/i, "");
}

async function fetchDiscordBot(path: string, token: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${DISCORD_API}${path}`, {
      headers: { Authorization: `Bot ${token}` },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error("Não foi possível comunicar com o Discord. Tente novamente.");
  }

  if (response.ok) return response;
  if (response.status === 401) throw new Error("O token do bot é inválido ou foi redefinido.");
  if (response.status === 403) {
    throw new Error("O bot não possui permissão para acessar esse servidor.");
  }
  if (response.status === 404) throw new Error("O bot não está instalado nesse servidor.");
  if (response.status === 429)
    throw new Error("O Discord limitou as consultas. Aguarde e tente novamente.");
  throw new Error(`O Discord recusou a consulta do bot (HTTP ${response.status}).`);
}

export const connectClientDiscordBot = createServerFn({ method: "POST" })
  .validator(connectBotSchema)
  .handler(async ({ data }) => {
    const token = normalizeBotToken(data.token);
    const [botResponse, guildResponse] = await Promise.all([
      fetchDiscordBot("/users/@me", token),
      fetchDiscordBot(`/guilds/${data.guildId}`, token),
    ]);
    const bot = (await botResponse.json()) as DiscordBotUser;
    const guild = (await guildResponse.json()) as DiscordGuild;
    if (!bot.bot) throw new Error("O token informado não pertence a um bot do Discord.");

    await saveClientBotCredential({
      clientId: data.clientId,
      guildId: data.guildId,
      botId: bot.id,
      botName: bot.global_name || bot.username,
      token,
    });

    return {
      botId: bot.id,
      botName: bot.global_name || bot.username,
      guildId: guild.id,
      guildName: guild.name,
    };
  });

export const getClientDiscordResources = createServerFn({ method: "POST" })
  .validator(resourcesSchema)
  .handler(async ({ data }) => {
    const credential = await loadClientBotCredential(data.clientId);
    if (!credential) {
      throw new Error("Este cliente ainda não possui um bot conectado.");
    }
    if (credential.guildId !== data.guildId) {
      throw new Error("O bot conectado pertence a outro servidor. Atualize o token do cliente.");
    }

    const [channelsResponse, rolesResponse] = await Promise.all([
      fetchDiscordBot(`/guilds/${data.guildId}/channels`, credential.token),
      fetchDiscordBot(`/guilds/${data.guildId}/roles`, credential.token),
    ]);
    const allChannels = (await channelsResponse.json()) as DiscordChannel[];
    const allRoles = (await rolesResponse.json()) as DiscordRole[];

    const byPosition = (left: DiscordChannel, right: DiscordChannel) =>
      (left.position ?? 0) - (right.position ?? 0) || left.name.localeCompare(right.name, "pt-BR");

    return {
      botName: credential.botName,
      channels: allChannels
        .filter((channel) => channel.type !== 4)
        .sort(byPosition)
        .map((channel) => ({
          id: channel.id,
          name: channel.name,
          type: channel.type,
          parentId: channel.parent_id ?? undefined,
        })),
      categories: allChannels
        .filter((channel) => channel.type === 4)
        .sort(byPosition)
        .map((channel) => ({ id: channel.id, name: channel.name })),
      roles: allRoles
        .filter((role) => role.id !== data.guildId && !role.managed)
        .sort((left, right) => right.position - left.position)
        .map((role) => ({ id: role.id, name: role.name })),
    };
  });
