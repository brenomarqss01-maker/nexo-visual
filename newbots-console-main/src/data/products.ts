/**
 * Catálogo público de produtos da Home.
 * Para adicionar um produto, basta adicionar um objeto no array `products`.
 * `enabled: false` mantém o cadastro sem exibir na Home.
 */

export interface Product {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image?: string;
  url: string;
  badge?: string;
  features: string[];
  enabled: boolean;
  /** Campos preparados para uso futuro */
  videoUrl?: string;
  price?: string;
  category?: string;
}

export const products: Product[] = [
  {
    id: "registro",
    title: "Sistema de Registro",
    subtitle: "Gerenciamento completo de membros",
    description:
      "Sistema completo para registro, siglas, ranking e gerenciamento de membros do seu servidor.",
    image: "vendas",
    url: DEFAULT_URL("registro"),
    badge: "DESTAQUE",
    features: ["Registro de membros", "Sistema de siglas", "Ranking automático", "Logs completos"],
    enabled: true,
  },
  {
    id: "ticket",
    title: "Sistema de Ticket",
    subtitle: "Atendimento organizado e rastreável",
    description:
      "Abertura de tickets por categoria, transcrições automáticas e controle total da equipe de atendimento.",
    image:
      "https://media.discordapp.net/attachments/1535672873333817365/1535690845855154288/SISTEMA_TICKET.png?ex=6a78af0d&is=6a775d8d&hm=dc9d589d342dcd322cb46314ee17fa934f01f48f12b3883727f0d1e3551f084e&=&format=webp&quality=lossless&width=1024&height=577",
    url: DEFAULT_URL("ticket"),
    features: [
      "Categorias de atendimento",
      "Transcrição automática",
      "Avaliação do atendimento",
      "Painel de equipe",
    ],
    enabled: true,
  },
  {
    id: "ponto",
    title: "Sistema de Ponto",
    subtitle: "Controle de jornada da staff",
    description:
      "Bata ponto direto no Discord, acompanhe horas trabalhadas e gere relatórios por período.",
    image: "/products/ponto.png",
    url: DEFAULT_URL("ponto"),
    features: ["Entrada e saída", "Relatório de horas", "Metas semanais", "Ranking de dedicação"],
    enabled: true,
  },
  {
    id: "vendas",
    title: "Sistema de Vendas",
    subtitle: "Loja automática para o seu servidor",
    description:
      "Catálogo, carrinho e entrega automática de produtos com registro completo de cada venda.",
    image: "/products/vendas.png",
    url: DEFAULT_URL("vendas"),
    badge: "NOVO",
    features: ["Catálogo dinâmico", "Entrega automática", "Histórico de vendas", "Cupons"],
    enabled: true,
  },
];

function DEFAULT_URL(slug: string) {
  return `/login?product=${encodeURIComponent(slug)}`;
}

/** Produtos visíveis na Home. */
export const activeProducts = (): Product[] => products.filter((p) => p.enabled);
