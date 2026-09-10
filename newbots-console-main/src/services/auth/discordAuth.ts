/**
 * Camada de autenticação Discord.
 *
 * Hoje: mock (nenhuma chamada externa).
 * Futuro: `beginDiscordLogin` redireciona para o OAuth do Discord e o callback
 * troca o `code` por um token em uma server function (o secret NUNCA fica no
 * frontend). O resto do app consome apenas as funções abaixo.
 */

import { discordOAuthConfig } from "@/config/site";

export interface DiscordIdentity {
  discordId: string;
  username: string;
  avatarUrl?: string;
}

export type AccessRole = "admin" | "client" | "none";

export interface AccessResult {
  discordId: string;
  role: AccessRole;
  productIds: string[];
}

/** Usuários fictícios usados enquanto não existe backend. */
export const mockUsers: Array<{
  discordId: string;
  username: string;
  role: "admin" | "client";
  products?: string[];
}> = [
  { discordId: "1063194868677095454", username: "NEXO NETWORK Admin", role: "admin" },
  {
    discordId: "123456789",
    username: "Cliente Demo",
    role: "client",
    products: ["sistema-ticket", "sistema-registro"],
  },
];

export const isOAuthConfigured = (): boolean =>
  Boolean(discordOAuthConfig.clientId && discordOAuthConfig.redirectUri);

const OAUTH_STATE_KEY = "nexo-network.discord-oauth-state.v1";

/** URL real do OAuth (usada quando as variáveis estiverem configuradas). */
export function buildAuthorizeUrl(state = "nexo-network"): string {
  const params = new URLSearchParams({
    client_id: discordOAuthConfig.clientId,
    redirect_uri: discordOAuthConfig.redirectUri,
    response_type: "code",
    scope: discordOAuthConfig.scopes.join(" "),
    state,
    prompt: "consent",
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export function beginDiscordLogin(): void {
  if (!isOAuthConfigured()) {
    throw new Error("Configure VITE_DISCORD_CLIENT_ID e VITE_DISCORD_REDIRECT_URI para entrar.");
  }

  const state = crypto.randomUUID();
  window.sessionStorage.setItem(OAUTH_STATE_KEY, state);
  window.location.assign(buildAuthorizeUrl(state));
}

export function isValidDiscordOAuthState(state: string | null): boolean {
  return Boolean(state && state === window.sessionStorage.getItem(OAUTH_STATE_KEY));
}

export function clearDiscordOAuthState(): void {
  window.sessionStorage.removeItem(OAUTH_STATE_KEY);
}

/** Mock: resolve uma identidade a partir de um Discord ID informado. */
export async function resolveIdentity(discordId: string): Promise<DiscordIdentity> {
  const found = mockUsers.find((u) => u.discordId === discordId);
  return { discordId, username: found?.username ?? `Usuário ${discordId.slice(-4)}` };
}

/**
 * Decide o destino após o login. `hasLicenses` vem do store local hoje e virá
 * do backend depois — a assinatura não muda.
 */
export function resolveAccess(
  discordId: string,
  adminDiscordId: string,
  hasLicenses: boolean,
): AccessResult {
  if (discordId === adminDiscordId) return { discordId, role: "admin", productIds: [] };
  if (hasLicenses) return { discordId, role: "client", productIds: [] };
  return { discordId, role: "none", productIds: [] };
}

export function routeForRole(role: AccessRole): string {
  if (role === "admin") return "/admin";
  if (role === "client") return "/painel";
  return "/no-products";
}
