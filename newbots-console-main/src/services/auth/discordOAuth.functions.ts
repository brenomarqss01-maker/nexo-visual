import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { discordOAuthConfig } from "@/config/site";
import {
  clearAuthenticatedDiscordSession,
  saveAuthenticatedDiscordSession,
} from "@/services/auth/discordSession";

const callbackSchema = z.object({
  code: z.string().min(1),
});

interface DiscordUserResponse {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
}

async function fetchDiscord(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  } catch {
    throw new Error("Nao foi possivel comunicar com o Discord. Tente novamente em instantes.");
  }
}

export const exchangeDiscordAuthorizationCode = createServerFn({ method: "POST" })
  .validator(callbackSchema)
  .handler(async ({ data }) => {
    const clientSecret = process.env["DISCORD_CLIENT_SECRET"];
    const { clientId, redirectUri } = discordOAuthConfig;

    if (!clientId || !redirectUri || !clientSecret) {
      throw new Error("A configuracao do OAuth do Discord esta incompleta no servidor.");
    }

    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code: data.code,
      redirect_uri: redirectUri,
    });
    const tokenResponse = await fetchDiscord("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      throw new Error("O Discord recusou a autorizacao. Tente entrar novamente.");
    }

    const token = (await tokenResponse.json()) as { access_token?: string; expires_in?: number };
    if (!token.access_token) {
      throw new Error("O Discord nao retornou um token de acesso.");
    }

    const userResponse = await fetchDiscord("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!userResponse.ok) {
      throw new Error("Nao foi possivel obter a conta Discord autorizada.");
    }

    const user = (await userResponse.json()) as DiscordUserResponse;
    await saveAuthenticatedDiscordSession({
      discordId: user.id,
      accessToken: token.access_token,
      expiresIn: token.expires_in ?? 604_800,
    });
    return {
      discordId: user.id,
      username: user.global_name || user.username,
      avatarUrl: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : undefined,
    };
  });

export const endDiscordSession = createServerFn({ method: "POST" }).handler(async () => {
  await clearAuthenticatedDiscordSession();
  return { ok: true };
});
