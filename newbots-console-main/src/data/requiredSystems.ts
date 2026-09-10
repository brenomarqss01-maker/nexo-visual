import type { BotSystem, FieldType, SystemField } from "./types";

const CREATED_AT = "2026-08-30T00:00:00.000Z";
let fieldSequence = 0;

function field(
  key: string,
  title: string,
  label: string,
  type: FieldType,
  required = false,
): SystemField {
  return {
    id: `base_field_${++fieldSequence}`,
    key,
    title,
    label,
    type,
    required,
  };
}

/** Sistemas que devem existir em toda instalação da NEXO NETWORK. */
export const REQUIRED_SYSTEMS: BotSystem[] = [
  {
    id: "base_registro_siglas",
    name: "Registro e Siglas",
    description: "Registro de membros, cargos iniciais, aprovação e patentes.",
    fields: [
      field(
        "titulo_registro",
        "Título do registro",
        "Título exibido no painel de registro.",
        "text",
      ),
      field(
        "descricao_registro",
        "Descrição do registro",
        "Texto de orientação para o membro.",
        "textarea",
      ),
      field("cor_hex", "Cor hexadecimal", "Exemplo: #006cff.", "text"),
      field("banner_url", "Banner", "URL da imagem do painel.", "text"),
      field(
        "canal_logs_registro",
        "Canal de registros",
        "Canal que recebe pedidos de registro.",
        "discord_channel",
        true,
      ),
      field(
        "cargo_staff",
        "Cargo da staff",
        "Cargo autorizado a analisar registros.",
        "discord_role",
        true,
      ),
      field(
        "cargo_inicial",
        "Cargo inicial",
        "Cargo entregue ao membro aprovado.",
        "discord_role",
        true,
      ),
      field(
        "siglas_json",
        "Patentes e siglas",
        'JSON: [{"label":"Gerente","value":"GRT","cargoId":"ID"}].',
        "textarea",
      ),
    ],
    createdAt: CREATED_AT,
  },
  {
    id: "base_acoes",
    name: "Ações Operacionais",
    description: "Painel de operações, presença e relatório final.",
    fields: [
      field(
        "canal_acoes",
        "Canal de ações",
        "Canal onde as operações serão publicadas.",
        "discord_channel",
        true,
      ),
      field(
        "cargo_acoes",
        "Cargo de ações",
        "Cargo autorizado a gerenciar ações.",
        "discord_role",
        true,
      ),
      field(
        "canal_resultados",
        "Canal de resultados",
        "Canal que recebe relatórios finalizados.",
        "discord_channel",
        true,
      ),
    ],
    createdAt: CREATED_AT,
  },
  {
    id: "base_ranking_recrutamento",
    name: "Ranking de Recrutamento",
    description: "Ranking de aprovações e premiação dos recrutadores.",
    fields: [
      field("premio_primeiro", "Prêmio do 1º lugar", "Descrição da premiação.", "text"),
      field("premio_segundo", "Prêmio do 2º lugar", "Descrição da premiação.", "text"),
      field("premio_terceiro", "Prêmio do 3º lugar", "Descrição da premiação.", "text"),
    ],
    createdAt: CREATED_AT,
  },
  {
    id: "base_farm",
    name: "Farm",
    description: "Pastas de farm, categoria privada e análise da gerência.",
    fields: [
      field(
        "categoria_farm",
        "Categoria de farm",
        "Categoria onde as pastas privadas serão criadas.",
        "discord_category",
        true,
      ),
      field(
        "cargo_gerencia_farm",
        "Cargo da gerência",
        "Cargo que visualiza e aprova farms.",
        "discord_role",
        true,
      ),
      field(
        "categoria_farm_aprovados",
        "Categoria de farms aprovados",
        "Categoria para onde a pasta é movida após a aprovação.",
        "discord_category",
      ),
      field(
        "categoria_farm_pagos",
        "Categoria de farms pagos",
        "Categoria para onde a pasta é movida após o pagamento.",
        "discord_category",
      ),
    ],
    createdAt: CREATED_AT,
  },
  {
    id: "base_vendas",
    name: "Vendas e Arsenal",
    description: "Produtos, aliados, divisão de valores e logs de venda.",
    fields: [
      field(
        "produtos_json",
        "Produtos",
        'JSON: [{"id":"1","nome":"Produto","preco":1000}].',
        "textarea",
      ),
      field("aliados_json", "Aliados", 'JSON: [{"nome":"Nome do aliado"}].', "textarea"),
      field(
        "porcentagem_vendedor",
        "Porcentagem do vendedor",
        "Percentual recebido pelo vendedor.",
        "number",
      ),
      field(
        "porcentagem_faccao",
        "Porcentagem da facção",
        "Percentual recebido pela facção.",
        "number",
      ),
      field(
        "canal_logs_vendas",
        "Canal de logs",
        "Canal que recebe comprovantes de venda.",
        "discord_channel",
        true,
      ),
    ],
    createdAt: CREATED_AT,
  },
  {
    id: "base_advertencias",
    name: "Advertências",
    description: "Aplicação, retirada e níveis de advertência.",
    fields: [
      field(
        "canal_advertencias_dadas",
        "Canal de advertências dadas",
        "Canal de registro das advertências aplicadas.",
        "discord_channel",
        true,
      ),
      field(
        "canal_advertencias_retiradas",
        "Canal de advertências retiradas",
        "Canal de registro das retiradas.",
        "discord_channel",
        true,
      ),
      field(
        "canal_de_retirados_pd",
        "Canal de Retirados (PD)",
        "Canal dos Retirados da Facção",
        "discord_channel",
        true,
      ),
      field(
        "cargo_staff_advertencias",
        "Cargo da staff",
        "Cargo autorizado a administrar advertências.",
        "discord_role",
        true,
      ),
      field(
        "cargo_advertencia_1",
        "Cargo advertência 1",
        "Cargo da primeira advertência.",
        "discord_role",
      ),
      field(
        "cargo_advertencia_2",
        "Cargo advertência 2",
        "Cargo da segunda advertência.",
        "discord_role",
      ),
      field(
        "cargo_advertencia_3",
        "Cargo advertência 3",
        "Cargo da terceira advertência.",
        "discord_role",
      ),
    ],
    createdAt: CREATED_AT,
  },
  {
    id: "base_ausencias",
    name: "Ausências",
    description: "Solicitações de ausência e decisão da staff.",
    fields: [
      field(
        "canal_ausencias",
        "Canal de ausências",
        "Canal que recebe solicitações.",
        "discord_channel",
        true,
      ),
      field(
        "cargo_staff_ausencias",
        "Cargo da staff",
        "Cargo autorizado a aceitar ou recusar ausências.",
        "discord_role",
        true,
      ),
    ],
    createdAt: CREATED_AT,
  },
  {
    id: "base_logs_gerais",
    name: "Logs Gerais",
    description: "Boas-vindas, saídas e monitoramento de mensagens.",
    fields: [
      field("canal_entrada", "Canal de entrada", "Canal de boas-vindas.", "discord_channel"),
      field("canal_saida", "Canal de saída", "Canal de despedidas.", "discord_channel"),
      field(
        "canal_logs_completos",
        "Canal de logs completos",
        "Canal de mensagens apagadas e editadas.",
        "discord_channel",
      ),
      field(
        "logs_completos_ativo",
        "Ativar logs completos",
        "Registra mensagens apagadas e editadas.",
        "boolean",
      ),
      field(
        "canal_anti_spam",
        "Canal anti-spam",
        "Qualquer mensagem humana neste canal aciona a proteção.",
        "discord_channel",
      ),
      field(
        "canal_logs_anti_spam",
        "Canal de logs anti-spam",
        "Canal que recebe o resultado das ações automáticas.",
        "discord_channel",
      ),
      field(
        "anti_spam_ativo",
        "Ativar anti-spam",
        "Ativa a proteção no canal selecionado.",
        "boolean",
      ),
    ],
    createdAt: CREATED_AT,
  },
  {
    id: "base_hierarquia",
    name: "Hierarquia",
    description: "Listas de cargos para os painéis de hierarquia padrão e elite.",
    fields: [
      field(
        "cargos_hierarquia_json",
        "Cargos da hierarquia",
        "JSON com IDs de cargos na ordem desejada.",
        "textarea",
      ),
      field(
        "cargos_hierarquia_elite_json",
        "Cargos da hierarquia elite",
        "JSON com IDs de cargos da elite.",
        "textarea",
      ),
    ],
    createdAt: CREATED_AT,
  },
  {
    id: "base_dm_cargo",
    name: "DM por Cargo",
    description: "Disparos de mensagem direta por cargo, com permissão e log.",
    fields: [
      field(
        "cargo_permissao_dm",
        "Cargo de permissão",
        "Cargo autorizado a disparar DMs.",
        "discord_role",
        true,
      ),
      field(
        "canal_logs_dm",
        "Canal de logs",
        "Canal que recebe o relatório do disparo.",
        "discord_channel",
      ),
      field(
        "delay_dm_segundos",
        "Intervalo entre DMs",
        "Tempo de espera entre cada mensagem, em segundos.",
        "number",
      ),
    ],
    createdAt: CREATED_AT,
  },
];
