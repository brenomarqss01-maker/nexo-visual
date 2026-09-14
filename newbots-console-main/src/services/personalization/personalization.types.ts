export type BotPresenceStatus = "online" | "idle" | "dnd" | "invisible";

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
  botId: string;
  botName: string;
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
