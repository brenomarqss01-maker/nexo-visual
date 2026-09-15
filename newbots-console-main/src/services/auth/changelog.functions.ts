import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ADMIN_DISCORD_ID } from "@/data/seed";
import { requireAuthenticatedDiscordSession } from "@/services/auth/discordSession";
import { loadClientBotCredential } from "@/services/database/mongo";

const DISCORD_API = "https://discord.com/api/v10";
const MESSAGEABLE_CHANNEL_TYPES = new Set([0, 5]);

const applicationSchema = z.object({
  clientId: z.string().trim().min(1).max(100),
  guildId: z.string().regex(/^\d{15,22}$/, "ID do servidor inválido."),
});

const publishSchema = applicationSchema.extend({
  channelId: z.string().regex(/^\d{15,22}$/, "Canal inválido."),
  content: z
    .string()
    .trim()
    .min(1, "Escreva o changelog antes de publicar.")
    .max(2_000, "O Discord aceita no máximo 2.000 caracteres por mensagem."),
});

interface DiscordChannel {
  id: string;
  guild_id?: string;
  name?: string;
  type: number;
  position?: number;
  parent_id?: string | null;
}

interface DiscordMessage {
  id: string;
  channel_id: string;
}

async function requireAdmin(): Promise<void> {
  const viewer = await requireAuthenticatedDiscordSession();
  if (viewer.discordId !== ADMIN_DISCORD_ID) {
    throw new Error("Apenas o administrador NEXO pode publicar changelogs.");
  }
}

async function discordRequest(path: string, token: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${DISCORD_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bot ${token}`,
        "User-Agent": "DiscordBot (https://nexobotss.vercel.app, 1.0)",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error("Não foi possível comunicar com o Discord. Tente novamente.");
  }

  if (response.ok) return response;

  let discordMessage = "";
  try {
    const body = (await response.json()) as { message?: string };
    discordMessage = body.message?.trim() ?? "";
  } catch {
    // O status HTTP abaixo ainda produz uma mensagem útil.
  }

  if (response.status === 401) throw new Error("O token do bot é inválido ou foi redefinido.");
  if (response.status === 403) {
    throw new Error("O bot não possui as permissões Ver canal e Enviar mensagens nesse canal.");
  }
  if (response.status === 404) {
    throw new Error("O canal não existe ou não está acessível para esse bot.");
  }
  if (response.status === 429) {
    throw new Error("O Discord limitou os envios. Aguarde alguns segundos e tente novamente.");
  }
  throw new Error(
    discordMessage
      ? `O Discord recusou a operação: ${discordMessage}`
      : `O Discord recusou a operação (HTTP ${response.status}).`,
  );
}

async function getCredential(clientId: string, guildId: string) {
  const credential = await loadClientBotCredential(clientId);
  if (!credential) throw new Error("Esta aplicação ainda não possui um bot conectado.");
  if (credential.guildId !== guildId) {
    throw new Error("O bot conectado não pertence ao servidor desta aplicação.");
  }
  return credential;
}

export const getAdminChangelogChannels = createServerFn({ method: "POST" })
  .validator(applicationSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const credential = await getCredential(data.clientId, data.guildId);
    const response = await discordRequest(
      `/guilds/${encodeURIComponent(data.guildId)}/channels`,
      credential.token,
    );
    const channels = (await response.json()) as DiscordChannel[];
    const categoryNames = new Map(
      channels
        .filter((channel) => channel.type === 4)
        .map((channel) => [channel.id, channel.name || "Sem nome"]),
    );

    return {
      botName: credential.botName,
      guildName: credential.guildName,
      channels: channels
        .filter((channel) => MESSAGEABLE_CHANNEL_TYPES.has(channel.type))
        .sort(
          (left, right) =>
            (left.position ?? 0) - (right.position ?? 0) ||
            (left.name ?? "").localeCompare(right.name ?? "", "pt-BR"),
        )
        .map((channel) => ({
          id: channel.id,
          name: channel.name || `canal-${channel.id}`,
          type: channel.type,
          parentId: channel.parent_id ?? undefined,
          categoryName: channel.parent_id ? categoryNames.get(channel.parent_id) : undefined,
        })),
    };
  });

export const publishAdminChangelog = createServerFn({ method: "POST" })
  .validator(publishSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const credential = await getCredential(data.clientId, data.guildId);

    const channelResponse = await discordRequest(
      `/channels/${encodeURIComponent(data.channelId)}`,
      credential.token,
    );
    const channel = (await channelResponse.json()) as DiscordChannel;
    if (channel.guild_id !== data.guildId || !MESSAGEABLE_CHANNEL_TYPES.has(channel.type)) {
      throw new Error("O canal selecionado não pertence a esta aplicação ou não aceita mensagens.");
    }

    const messageResponse = await discordRequest(
      `/channels/${encodeURIComponent(data.channelId)}/messages`,
      credential.token,
      {
        method: "POST",
        body: JSON.stringify({
          content: data.content,
          allowed_mentions: { parse: [] },
        }),
      },
    );
    const message = (await messageResponse.json()) as DiscordMessage;

    return {
      messageId: message.id,
      channelId: message.channel_id,
      channelName: channel.name || data.channelId,
    };
  });
