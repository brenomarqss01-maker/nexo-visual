import type { Database } from "./types";
import { REQUIRED_SYSTEMS } from "./requiredSystems";

export const ADMIN_DISCORD_ID = "1063194868677095454";

/** Estado inicial real: sem dados de demonstraÃ§Ã£o ou clientes fictÃ­cios. */
export function createEmptyDatabase(): Database {
  return {
    settings: {
      brandName: "NEXO NETWORK",
      defaultExpirationDays: 30,
      adminDiscordId: ADMIN_DISCORD_ID,
      supportUrl: "https://discord.gg/SEU-LINK",
    },
    systems: REQUIRED_SYSTEMS.map((system) => ({
      ...system,
      fields: system.fields.map((field) => ({ ...field })),
    })),
    clients: [],
    licenses: [],
    configs: [],
    organizationStats: [],
    users: [
      { discordId: ADMIN_DISCORD_ID, name: "Administrador", role: "admin", avatarColor: "#8b8b8b" },
    ],
    logs: [],
  };
}

const now = new Date();
const iso = (d: Date) => d.toISOString();
const days = (n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return iso(d);
};

export function createSeedDatabase(): Database {
  return {
    settings: {
      brandName: "NEXO NETWORK",
      defaultExpirationDays: 30,
      adminDiscordId: ADMIN_DISCORD_ID,
      supportUrl: "https://discord.gg/SEU-LINK",
    },
    systems: [
      {
        id: "sistema_ticket",
        name: "Sistema de Ticket",
        description: "Atendimento com categorias, logs e cargos de suporte.",
        createdAt: iso(now),
        fields: [
          {
            id: "f_ticket_1",
            title: "Canal de Logs",
            label: "ID do canal onde serão enviados os logs",
            key: "canal_logs",
            type: "discord_channel",
            required: true,
          },
          {
            id: "f_ticket_2",
            title: "Categoria dos Tickets",
            label: "ID da categoria onde os tickets serão criados",
            key: "categoria_ticket",
            type: "discord_category",
            required: true,
          },
          {
            id: "f_ticket_3",
            title: "Cargo de Suporte",
            label: "ID do cargo que poderá atender os tickets",
            key: "cargo_suporte",
            type: "discord_role",
          },
          {
            id: "f_ticket_4",
            title: "Mensagem de abertura",
            label: "Texto enviado quando um ticket é aberto",
            key: "mensagem_abertura",
            type: "text",
          },
        ],
      },
      {
        id: "sistema_farm",
        name: "Sistema de Farm",
        description: "Registro de farm por cargo com metas semanais.",
        createdAt: iso(now),
        fields: [
          {
            id: "f_farm_1",
            title: "Canal de Registro",
            label: "ID do canal onde o farm será registrado",
            key: "canal_farm",
            type: "discord_channel",
          },
          {
            id: "f_farm_2",
            title: "Meta semanal",
            label: "Quantidade mínima de itens por semana",
            key: "meta_semanal",
            type: "number",
          },
          {
            id: "f_farm_3",
            title: "Farm ativo",
            label: "Ativar ou desativar o sistema de farm",
            key: "farm_ativo",
            type: "boolean",
          },
        ],
      },
      {
        id: "sistema_hierarquia",
        name: "Sistema de Hierarquia",
        description: "Promoções, rebaixamentos e logs de cargos.",
        createdAt: iso(now),
        fields: [
          {
            id: "f_hier_1",
            title: "Canal de Promoções",
            label: "ID do canal onde as promoções serão anunciadas",
            key: "canal_promocoes",
            type: "discord_channel",
          },
          {
            id: "f_hier_2",
            title: "Cargo de Liderança",
            label: "ID do cargo que pode promover membros",
            key: "cargo_lideranca",
            type: "discord_role",
          },
        ],
      },
      {
        id: "sistema_ausencia",
        name: "Sistema de Ausência",
        description: "Solicitações de ausência com aprovação.",
        createdAt: iso(now),
        fields: [
          {
            id: "f_aus_1",
            title: "Canal de Ausências",
            label: "ID do canal das solicitações de ausência",
            key: "canal_ausencia",
            type: "discord_channel",
          },
          {
            id: "f_aus_2",
            title: "Dias máximos",
            label: "Número máximo de dias por solicitação",
            key: "dias_maximos",
            type: "number",
          },
        ],
      },
      {
        id: "sistema_recrutamento",
        name: "Sistema de Recrutamento",
        description: "Formulário de registro com aprovação por cargo.",
        createdAt: iso(now),
        fields: [
          {
            id: "f_rec_1",
            title: "ID Registro",
            label: "ID do canal de registro",
            key: "id_registro_rec",
            type: "discord_channel",
          },
          {
            id: "f_rec_2",
            title: "Nome Banner",
            label: "Identificador do banner exibido no registro",
            key: "nome_banner_rec",
            type: "text",
          },
          {
            id: "f_rec_3",
            title: "Canal de Logs",
            label: "ID do canal de logs do recrutamento",
            key: "canal_logs_rec",
            type: "discord_channel",
          },
          {
            id: "f_rec_4",
            title: "Cargo Aprovado",
            label: "ID do cargo dado ao membro aprovado",
            key: "cargo_aprovado_rec",
            type: "discord_role",
          },
        ],
      },
    ],
    clients: [
      {
        id: "cli_1",
        appName: "New Era City",
        discordId: ADMIN_DISCORD_ID,
        guildId: "100000000000000001",
        createdAt: iso(now),
      },
      {
        id: "cli_2",
        appName: "Vice Roleplay",
        discordId: "289374829374829374",
        guildId: "100000000000000002",
        createdAt: days(-12),
      },
      {
        id: "cli_3",
        appName: "Atlas City",
        discordId: "482938472938472938",
        guildId: "100000000000000003",
        createdAt: days(-40),
      },
      {
        id: "cli_4",
        appName: "Nova Vida RP",
        discordId: "739284739284739284",
        guildId: "100000000000000004",
        createdAt: days(-3),
      },
    ],
    licenses: [
      {
        id: "lic_1",
        clientId: "cli_1",
        systemId: "sistema_ticket",
        createdAt: iso(now),
        expiresAt: days(30),
      },
      {
        id: "lic_2",
        clientId: "cli_1",
        systemId: "sistema_farm",
        createdAt: iso(now),
        expiresAt: days(30),
      },
      {
        id: "lic_3",
        clientId: "cli_1",
        systemId: "sistema_hierarquia",
        createdAt: iso(now),
        expiresAt: days(30),
      },
      {
        id: "lic_4",
        clientId: "cli_2",
        systemId: "sistema_ticket",
        createdAt: days(-12),
        expiresAt: days(18),
      },
      {
        id: "lic_5",
        clientId: "cli_3",
        systemId: "sistema_recrutamento",
        createdAt: days(-40),
        expiresAt: days(-10),
      },
      {
        id: "lic_6",
        clientId: "cli_4",
        systemId: "sistema_ausencia",
        createdAt: days(-3),
        expiresAt: days(27),
      },
    ],
    configs: [
      {
        guildId: "100000000000000002",
        clientId: "cli_2",
        systemId: "sistema_ticket",
        updatedAt: days(-2),
        values: {
          canal_logs: "123456789012345678",
          categoria_ticket: "987654321098765432",
          cargo_suporte: "555555555555555555",
        },
      },
    ],
    organizationStats: [],
    users: [
      { discordId: ADMIN_DISCORD_ID, name: "Marques", role: "admin", avatarColor: "#8b8b8b" },
      {
        discordId: "289374829374829374",
        name: "Vice Owner",
        role: "client",
        avatarColor: "#4f7fd6",
      },
      {
        discordId: "482938472938472938",
        name: "Atlas Owner",
        role: "client",
        avatarColor: "#c98b4b",
      },
      {
        discordId: "739284739284739284",
        name: "Nova Owner",
        role: "client",
        avatarColor: "#4bbd8a",
      },
    ],
    logs: [
      {
        id: "log_1",
        at: iso(now),
        actor: "Marques",
        action: "Sistema criado",
        detail: "Sistema de Ticket",
      },
      {
        id: "log_2",
        at: days(-2),
        actor: "Vice Owner",
        action: "Configuração salva",
        detail: "Sistema de Ticket",
      },
      {
        id: "log_3",
        at: days(-3),
        actor: "Marques",
        action: "Cliente criado",
        detail: "Nova Vida RP",
      },
    ],
  };
}
