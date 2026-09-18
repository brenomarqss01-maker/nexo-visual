const DISCORD_API = "https://discord.com/api/v10";
const REQUEST_TIMEOUT_MS = 5_000;
const DUPLICATE_COOLDOWN_MS = 60_000;

export type SiteLogCategory =
  "personalization" | "access" | "changes" | "admin" | "errors" | "alerts" | "oauth" | "versions";

type SiteLogField = {
  name: string;
  value: string | number | boolean | null | undefined;
  inline?: boolean | undefined;
};

export type SiteLogInput = {
  category: SiteLogCategory;
  title: string;
  description?: string | undefined;
  actorId?: string | undefined;
  fields?: SiteLogField[] | undefined;
  error?: unknown;
};

const channelEnvironmentByCategory: Record<SiteLogCategory, string> = {
  personalization: "DISCORD_PERSONALIZATION_CHANNEL_ID",
  access: "DISCORD_LOG_ACCESS_CHANNEL_ID",
  changes: "DISCORD_LOG_CHANGES_CHANNEL_ID",
  admin: "DISCORD_LOG_ADMIN_CHANNEL_ID",
  errors: "DISCORD_TECHNICAL_ERROR_CHANNEL_ID",
  alerts: "DISCORD_LOG_ALERTS_CHANNEL_ID",
  oauth: "DISCORD_LOG_OAUTH_BOTS_CHANNEL_ID",
  versions: "DISCORD_LOG_VERSIONS_CHANNEL_ID",
};

const colorsByCategory: Record<SiteLogCategory, number> = {
  personalization: 0x8b5cf6,
  access: 0x3b82f6,
  changes: 0xf59e0b,
  admin: 0x6366f1,
  errors: 0xef4444,
  alerts: 0xf97316,
  oauth: 0x5865f2,
  versions: 0x22c55e,
};

const recentMessages = new Map<string, number>();

function siteLogToken(): string {
  return (
    process.env["DISCORD_SITE_LOG_BOT_TOKEN"]?.trim() ||
    process.env["DISCORD_NOTIFICATION_BOT_TOKEN"]?.trim() ||
    ""
  );
}

function hideSecrets(value: string): string {
  return value
    .replace(/(?:mfa\.[\w-]{20,}|[\w-]{20,}\.[\w-]{5,}\.[\w-]{20,})/g, "[TOKEN OCULTO]")
    .replace(/mongodb(?:\+srv)?:\/\/[^@\s]+@/gi, "mongodb://***:***@")
    .replace(/(authorization\s*[:=]\s*)(?:bot|bearer)?\s*[^\s,;]+/gi, "$1[OCULTO]")
    .replace(/```/g, "''' ")
    .trim();
}

function safeText(value: unknown, limit: number): string {
  let text: string;
  if (value instanceof Error) text = value.message;
  else if (typeof value === "string") text = value;
  else {
    try {
      text = JSON.stringify(value);
    } catch {
      text = String(value);
    }
  }
  const sanitized = hideSecrets(text || "Não informado");
  return sanitized.length > limit ? `${sanitized.slice(0, limit - 3)}...` : sanitized;
}

function shouldSkipDuplicate(input: SiteLogInput): boolean {
  if (input.category !== "errors" && input.category !== "alerts") return false;
  const key = `${input.category}:${safeText(input.title, 120)}:${safeText(input.error, 240)}`;
  const now = Date.now();
  const previous = recentMessages.get(key);
  recentMessages.set(key, now);
  for (const [storedKey, timestamp] of recentMessages) {
    if (now - timestamp > DUPLICATE_COOLDOWN_MS) recentMessages.delete(storedKey);
  }
  return previous !== undefined && now - previous < DUPLICATE_COOLDOWN_MS;
}

export async function sendSiteLog(input: SiteLogInput): Promise<boolean> {
  const token = siteLogToken();
  const channelId = process.env[channelEnvironmentByCategory[input.category]]?.trim() || "";
  if (!token || !channelId || shouldSkipDuplicate(input)) return false;

  const fields = (input.fields ?? [])
    .filter((field) => field.value !== undefined && field.value !== null && field.value !== "")
    .slice(0, 20)
    .map((field) => ({
      name: safeText(field.name, 256),
      value: safeText(field.value, 1_024),
      inline: field.inline ?? false,
    }));

  if (input.actorId) {
    fields.unshift({ name: "Usuário", value: `\`${safeText(input.actorId, 64)}\``, inline: true });
  }
  if (input.error !== undefined) {
    fields.push({
      name: "Detalhes",
      value: `\`\`\`\n${safeText(input.error, 950)}\n\`\`\``,
      inline: false,
    });
  }

  try {
    const response = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "DiscordBot (https://nexobotss.vercel.app, 1.0)",
      },
      body: JSON.stringify({
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: safeText(input.title, 256),
            ...(input.description ? { description: safeText(input.description, 4_000) } : {}),
            color: colorsByCategory[input.category],
            fields,
            timestamp: new Date().toISOString(),
            footer: { text: "NEXO NETWORK • Logs do site" },
          },
        ],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.ok) return true;
    const details = safeText(await response.text(), 500);
    console.error(
      `[Discord Site Logs] Falha em ${input.category} (HTTP ${response.status}): ${details}`,
    );
  } catch (error) {
    console.error(`[Discord Site Logs] Falha em ${input.category}: ${safeText(error, 500)}`);
  }
  return false;
}
