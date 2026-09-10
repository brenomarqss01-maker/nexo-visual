/**
 * Configuração central de links e textos institucionais.
 * Edite APENAS este arquivo para trocar o Discord da loja, suporte etc.
 */

export const DISCORD_URL = "https://discord.gg/BMJfav9TNR";

export const siteConfig = {
  companyName: "NEXO NETWORK",
  companyTag: "NETWORK",
  discordUrl: DISCORD_URL,
  supportUrl: DISCORD_URL,
  copyright: "© 2026 NEXO NETWORK. Todos os direitos reservados.",
} as const;

/** Intervalo do autoplay do carrossel de produtos (ms). */
export const PRODUCT_AUTOPLAY_INTERVAL = 18000;

/** Configuração futura do Discord OAuth (somente valores públicos). */
export const discordOAuthConfig = {
  clientId: import.meta.env["VITE_DISCORD_CLIENT_ID"] ?? "",
  redirectUri: import.meta.env["VITE_DISCORD_REDIRECT_URI"] ?? "",
  scopes: ["identify"],
  // DISCORD_CLIENT_SECRET nunca vive no frontend — apenas em server functions.
} as const;
