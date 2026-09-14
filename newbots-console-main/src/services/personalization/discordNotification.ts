import type {
  BotCustomizationInput,
  PersonalizationApplication,
} from "@/services/personalization/personalization.types";

const DISCORD_API = "https://discord.com/api/v10";
const REQUEST_CHANNEL_ID =
  process.env["DISCORD_PERSONALIZATION_CHANNEL_ID"]?.trim() || "1521534205148922016";
const ERROR_CHANNEL_ID =
  process.env["DISCORD_TECHNICAL_ERROR_CHANNEL_ID"]?.trim() || "1549111447215280209";
const COMPONENTS_V2_FLAG = 1 << 15;

type DiscordAttachment = {
  filename: string;
  url: string;
};

type DiscordMessage = {
  id: string;
  attachments?: DiscordAttachment[] | undefined;
};

function notificationToken(fallbackToken?: string): string {
  return process.env["DISCORD_NOTIFICATION_BOT_TOKEN"]?.trim() || fallbackToken?.trim() || "";
}

function escapeDiscordMarkdown(value: string): string {
  const markdownCharacters = new Set("\\`*_{}[]()<>#+-.!|");
  return [...value]
    .map((character) => (markdownCharacters.has(character) ? `\\${character}` : character))
    .join("")
    .replace(/@/g, "@\u200b");
}

function extensionFor(file: File): string {
  const extensions: Record<string, string> = {
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return extensions[file.type] ?? "png";
}

async function discordRequest(
  channelId: string,
  token: string,
  body: BodyInit,
  headers?: HeadersInit,
): Promise<Response> {
  if (!token) {
    throw new Error("Nenhum token está disponível para enviar a notificação ao Discord.");
  }
  const response = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${token}`, ...headers },
    body,
    signal: AbortSignal.timeout(20_000),
  });
  if (response.ok) return response;
  const details = (await response.text()).slice(0, 1_000);
  throw new Error(`Discord recusou a mensagem (HTTP ${response.status}): ${details}`);
}

export async function sendCustomizationRequest(input: {
  application: PersonalizationApplication;
  customization: BotCustomizationInput;
  requesterId: string;
  requesterName: string;
  fallbackToken: string;
  avatar?: File | undefined;
  banner?: File | undefined;
}): Promise<{ messageId: string; avatarUrl?: string; bannerUrl?: string }> {
  const token = notificationToken(input.fallbackToken);
  const files: Array<{ field: "avatar" | "banner"; file: File; filename: string }> = [];
  if (input.avatar) {
    files.push({
      field: "avatar",
      file: input.avatar,
      filename: `perfil-${input.application.guildId}.${extensionFor(input.avatar)}`,
    });
  }
  if (input.banner) {
    files.push({
      field: "banner",
      file: input.banner,
      filename: `banner-${input.application.guildId}.${extensionFor(input.banner)}`,
    });
  }

  const mediaUrl = (field: "avatar" | "banner", existing?: string) => {
    const uploaded = files.find((item) => item.field === field);
    return uploaded ? `attachment://${uploaded.filename}` : existing;
  };
  const avatarMedia = mediaUrl("avatar", input.application.customization?.avatarUrl);
  const bannerMedia = mediaUrl("banner", input.application.customization?.bannerUrl);
  const statusLines = input.customization.statusMessages
    .map((status) => `- ${escapeDiscordMarkdown(status)}`)
    .join("\n");
  const requestedAt = Math.floor(Date.now() / 1_000);
  const components: Array<Record<string, unknown>> = [
    {
      type: 10,
      content:
        "# Nova solicitação de personalização\n" +
        `**Qual Aplicação:** ${escapeDiscordMarkdown(input.application.appName)}\n` +
        `**Qual o User:** <@${input.requesterId}> (\`${input.requesterId}\`) — ${escapeDiscordMarkdown(input.requesterName)}\n` +
        `**Horário:** <t:${requestedAt}:F>\n` +
        `**Servidor:** \`${input.application.guildId}\`\n` +
        `**Bot:** ${escapeDiscordMarkdown(input.application.botName)} (\`${input.application.botId}\`)\n` +
        `**Nome solicitado:** ${escapeDiscordMarkdown(input.customization.requestedName)}\n` +
        `**Cor:** \`${input.customization.accentColor}\`\n` +
        `**Presença:** \`${input.customization.presenceStatus}\`\n` +
        `**Status em rotação:**\n${statusLines}`,
    },
  ];

  if (avatarMedia) {
    components.push(
      { type: 14, divider: true, spacing: 1 },
      { type: 10, content: "### Anexo do perfil" },
      {
        type: 12,
        items: [{ media: { url: avatarMedia }, description: "Foto de perfil solicitada" }],
      },
    );
  }
  if (bannerMedia) {
    components.push(
      { type: 14, divider: true, spacing: 1 },
      { type: 10, content: "### Anexo do banner" },
      {
        type: 12,
        items: [{ media: { url: bannerMedia }, description: "Banner solicitado" }],
      },
    );
  }

  const payload = {
    flags: COMPONENTS_V2_FLAG,
    allowed_mentions: { parse: [] },
    components: [
      {
        type: 17,
        accent_color: Number.parseInt(input.customization.accentColor.slice(1), 16),
        components,
      },
    ],
    attachments: files.map((item, index) => ({
      id: index,
      filename: item.filename,
      description: item.field === "avatar" ? "Foto de perfil" : "Banner",
    })),
  };
  const form = new FormData();
  form.append("payload_json", JSON.stringify(payload));
  files.forEach((item, index) => form.append(`files[${index}]`, item.file, item.filename));

  const response = await discordRequest(REQUEST_CHANNEL_ID, token, form);
  const message = (await response.json()) as DiscordMessage;
  const attachmentUrl = (field: "avatar" | "banner") => {
    const filename = files.find((item) => item.field === field)?.filename;
    return filename
      ? message.attachments?.find((attachment) => attachment.filename === filename)?.url
      : undefined;
  };
  const avatarUrl = attachmentUrl("avatar");
  const bannerUrl = attachmentUrl("banner");
  return {
    messageId: message.id,
    ...(avatarUrl ? { avatarUrl } : {}),
    ...(bannerUrl ? { bannerUrl } : {}),
  };
}

export async function reportCustomizationTechnicalError(input: {
  error: unknown;
  stage: string;
  requesterId?: string | undefined;
  clientId?: string | undefined;
  guildId?: string | undefined;
  fallbackToken?: string | undefined;
}): Promise<void> {
  const token = notificationToken(input.fallbackToken);
  const details = input.error instanceof Error ? input.error.message : String(input.error);
  const payload = {
    content:
      "## Falha técnica na personalização\n" +
      `**Etapa:** ${escapeDiscordMarkdown(input.stage)}\n` +
      `**Usuário:** ${input.requesterId ? `\`${input.requesterId}\`` : "indisponível"}\n` +
      `**Cliente:** ${input.clientId ? `\`${input.clientId}\`` : "indisponível"}\n` +
      `**Servidor:** ${input.guildId ? `\`${input.guildId}\`` : "indisponível"}\n` +
      `**Erro:**\n\`\`\`\n${details.replace(/```/g, "'''").slice(0, 1_200)}\n\`\`\``,
    allowed_mentions: { parse: [] },
  };
  try {
    await discordRequest(ERROR_CHANNEL_ID, token, JSON.stringify(payload), {
      "Content-Type": "application/json",
    });
  } catch (reportError) {
    console.error("Não foi possível enviar a falha ao canal técnico.", reportError);
  }
}
