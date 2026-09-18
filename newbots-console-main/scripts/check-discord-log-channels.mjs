import "dotenv/config";

const token = process.env.DISCORD_SITE_LOG_BOT_TOKEN;
const channelKeys = [
  "DISCORD_PERSONALIZATION_CHANNEL_ID",
  "DISCORD_LOG_ACCESS_CHANNEL_ID",
  "DISCORD_LOG_CHANGES_CHANNEL_ID",
  "DISCORD_LOG_ADMIN_CHANNEL_ID",
  "DISCORD_TECHNICAL_ERROR_CHANNEL_ID",
  "DISCORD_LOG_ALERTS_CHANNEL_ID",
  "DISCORD_LOG_OAUTH_BOTS_CHANNEL_ID",
  "DISCORD_LOG_VERSIONS_CHANNEL_ID",
];

if (!token) {
  console.error("DISCORD_SITE_LOG_BOT_TOKEN não está configurado.");
  process.exitCode = 1;
} else {
  for (const key of channelKeys) {
    const channelId = process.env[key];
    if (!channelId) {
      console.log(JSON.stringify({ key, ok: false, error: "Canal não configurado" }));
      process.exitCode = 1;
      continue;
    }

    try {
      const response = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
        headers: { Authorization: `Bot ${token}` },
      });
      const channel = response.ok ? await response.json() : null;
      console.log(
        JSON.stringify({
          key,
          status: response.status,
          ok: response.ok,
          name: channel?.name ?? "",
        }),
      );
      if (!response.ok) process.exitCode = 1;
    } catch (error) {
      console.log(
        JSON.stringify({
          key,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      process.exitCode = 1;
    }
  }
}
