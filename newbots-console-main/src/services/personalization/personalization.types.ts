export type BotPresenceStatus = "online" | "idle" | "dnd" | "invisible";

export interface DiscordViewerAccess {
  discordId: string;
  accessToken?: string | undefined;
}

export interface BotCustomization {
  clientId: string;
  guildId: string;
  botId: string;
  requestedName: string;
  accentColor: string;
  presenceStatus: BotPresenceStatus;
  statusMessages: string[];
  avatarUrl?: string | undefined;
  bannerUrl?: string | undefined;
  requestedBy: string;
  updatedAt: string;
}

export interface PersonalizationApplication {
  clientId: string;
  appName: string;
  guildId: string;
  guildName: string;
  guildIconUrl?: string | undefined;
  botId: string;
  botName: string;
  accessMode: "owner" | "role";
  accessRoleId?: string | undefined;
  customization?: BotCustomization | undefined;
}

export interface BotCustomizationInput {
  clientId: string;
  requestedName: string;
  accentColor: string;
  presenceStatus: BotPresenceStatus;
  statusMessages: string[];
  avatarUrl?: string | undefined;
  bannerUrl?: string | undefined;
}
