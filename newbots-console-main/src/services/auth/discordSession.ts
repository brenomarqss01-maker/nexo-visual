import { createHash } from "node:crypto";
import { useSession as createServerSessionManager } from "@tanstack/react-start/server";

interface DiscordSessionData {
  discordId: string;
}

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function getSessionPassword(): string {
  const secret =
    process.env["AUTH_SESSION_SECRET"]?.trim() ||
    process.env["DISCORD_CLIENT_SECRET"]?.trim() ||
    process.env["BOT_TOKEN_ENCRYPTION_KEY"]?.trim();

  if (!secret) {
    throw new Error(
      "Configure AUTH_SESSION_SECRET ou DISCORD_CLIENT_SECRET para proteger a sessão.",
    );
  }

  return createHash("sha256").update(secret).digest("hex");
}

async function getDiscordSession() {
  return createServerSessionManager<DiscordSessionData>({
    name: "nexo-network-auth",
    password: getSessionPassword(),
    maxAge: SESSION_MAX_AGE_SECONDS,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env["NODE_ENV"] === "production",
      path: "/",
    },
  });
}

export async function saveAuthenticatedDiscordId(discordId: string): Promise<void> {
  const session = await getDiscordSession();
  await session.update({ discordId });
}

export async function requireAuthenticatedDiscordId(): Promise<string> {
  const session = await getDiscordSession();
  const discordId = session.data.discordId?.trim();
  if (!discordId || !/^\d{15,22}$/.test(discordId)) {
    throw new Error("Sua sessão expirou. Entre novamente com o Discord.");
  }
  return discordId;
}
