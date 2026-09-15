// Domain types. This layer is storage-agnostic: swapping the mock repository
// for MongoDB/Postgres/API only requires a new Repository implementation.

export type FieldType =
  | "text"
  | "number"
  | "discord_id"
  | "discord_channel"
  | "discord_role"
  | "discord_role_multi"
  | "discord_category"
  | "boolean"
  | "select"
  | "textarea";

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Texto",
  number: "Número",
  discord_id: "ID Discord",
  discord_channel: "Canal Discord",
  discord_role: "Cargo Discord",
  discord_role_multi: "Múltiplos cargos Discord",
  discord_category: "Categoria Discord",
  boolean: "Ativado / Desativado",
  select: "Select",
  textarea: "Texto longo / JSON",
};

export interface SystemField {
  id: string;
  /** Título exibido para o cliente */
  title: string;
  /** Texto de ajuda / descrição do campo */
  label: string;
  /** Chave única usada para persistir o valor (ex: canal_logs) */
  key: string;
  type: FieldType;
  /** Opções, apenas para type === "select" */
  options?: string[] | undefined;
  /** Limite para campos de multisseleção. */
  maxSelections?: number | undefined;
  required?: boolean | undefined;
}

export interface BotSystem {
  id: string;
  name: string;
  description?: string | undefined;
  fields: SystemField[];
  createdAt: string;
}

export interface Client {
  id: string;
  /** Nome do App (ex: New Era City) */
  appName: string;
  /** Discord ID do cliente */
  discordId: string;
  /** Servidor Discord onde este bot/sistema opera. */
  guildId: string;
  /** Cargo do servidor que também pode acessar e editar esta aplicação. */
  accessRoleId?: string | undefined;
  createdAt: string;
}

export interface License {
  id: string;
  clientId: string;
  systemId: string;
  createdAt: string;
  expiresAt: string;
}

/** config[guildId][systemId][fieldKey] = valor */
export type ConfigValue = string | number | boolean;
export type SystemConfig = Record<string, ConfigValue>;

export interface ConfigRecord {
  /** Chave do servidor Discord: impede conflito entre clientes e bots. */
  guildId: string;
  /** Mantido para auditoria e exclusão do cliente. */
  clientId: string;
  systemId: string;
  values: SystemConfig;
  updatedAt: string;
}

export interface AppUser {
  discordId: string;
  name: string;
  role: "admin" | "client";
  avatarColor: string;
}

export interface LogEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail?: string | undefined;
}

export interface Settings {
  brandName: string;
  defaultExpirationDays: number;
  adminDiscordId: string;
  supportUrl: string;
}

/** Total vendido por produto no servidor Discord do cliente. */
export interface ProductSalesStat {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

/** Ranking de membros calculado pelos bots da organização. */
export interface OrganizationMemberStat {
  discordId: string;
  name: string;
  count: number;
  revenue: number;
}

/** Estatísticas isoladas pela chave do servidor Discord (guildId). */
export interface OrganizationStats {
  guildId: string;
  recruitmentsTotal: number;
  salesTotal: number;
  organizationRevenue: number;
  products: ProductSalesStat[];
  recruiters: OrganizationMemberStat[];
  sellers: OrganizationMemberStat[];
  updatedAt: string;
}

export interface Database {
  clients: Client[];
  systems: BotSystem[];
  licenses: License[];
  configs: ConfigRecord[];
  organizationStats: OrganizationStats[];
  users: AppUser[];
  logs: LogEntry[];
  settings: Settings;
}
