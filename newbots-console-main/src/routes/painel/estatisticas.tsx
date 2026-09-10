import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  RotateCcw,
  ShoppingBag,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth/session";
import { EmptyState, PageHeader } from "@/components/ui-kit/primitives";
import { useData, type OrganizationStatsReset } from "@/data/store";
import type { OrganizationMemberStat, OrganizationStats, ProductSalesStat } from "@/data/types";
import { isExpired } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATISTICS_SYSTEM_IDS = new Set(["base_registro_siglas", "base_vendas"]);

export const Route = createFileRoute("/painel/estatisticas")({
  validateSearch: (search: Record<string, unknown>) => ({
    clientId: typeof search["clientId"] === "string" ? search["clientId"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Estatísticas da organização — NEXO NETWORK" },
      {
        name: "description",
        content: "Acompanhe recrutamentos, vendas e receita da sua organização Discord.",
      },
    ],
  }),
  component: OrganizationStatistics,
});

function emptyStats(guildId: string): OrganizationStats {
  return {
    guildId,
    recruitmentsTotal: 0,
    salesTotal: 0,
    organizationRevenue: 0,
    products: [],
    recruiters: [],
    sellers: [],
    updatedAt: "",
  };
}

function currency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function topByCount<T extends { count: number }>(items: T[]): T | undefined {
  return items.reduce<T | undefined>(
    (top, item) => (!top || item.count > top.count ? item : top),
    undefined,
  );
}

function topProduct(products: ProductSalesStat[]): ProductSalesStat | undefined {
  return products.reduce<ProductSalesStat | undefined>(
    (top, product) => (!top || product.quantity > top.quantity ? product : top),
    undefined,
  );
}

function LeaderCard({
  title,
  icon: Icon,
  person,
  emptyLabel,
  value,
}: {
  title: string;
  icon: LucideIcon;
  person: OrganizationMemberStat | undefined;
  emptyLabel: string;
  value: (person: OrganizationMemberStat) => string;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 text-brand" />
        <span className="label-kicker">{title}</span>
      </div>
      {person ? (
        <div className="mt-5">
          <p className="truncate text-lg font-semibold">{person.name}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{value(person)}</p>
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}

function OrganizationStatistics() {
  const { db, resetOrganizationStats } = useData();
  const { clients } = useAuth();
  const { clientId } = Route.useSearch();
  const navigate = useNavigate();
  const [resetScope, setResetScope] = useState<OrganizationStatsReset | null>(null);

  const eligibleClients = useMemo(
    () =>
      clients.filter((client) =>
        db.licenses.some(
          (license) =>
            license.clientId === client.id &&
            STATISTICS_SYSTEM_IDS.has(license.systemId) &&
            !isExpired(license.expiresAt),
        ),
      ),
    [clients, db.licenses],
  );

  const selectedClient =
    eligibleClients.find((client) => client.id === clientId) ?? eligibleClients[0];
  const statistics = selectedClient
    ? ((db.organizationStats ?? []).find((item) => item.guildId === selectedClient.guildId) ??
      emptyStats(selectedClient.guildId))
    : undefined;
  const product = statistics ? topProduct(statistics.products) : undefined;
  const recruiter = statistics ? topByCount(statistics.recruiters) : undefined;
  const seller = statistics ? topByCount(statistics.sellers) : undefined;

  const resetDetails: Record<OrganizationStatsReset, { title: string; description: string }> = {
    recruitments: {
      title: "Limpar registros",
      description: "Isso vai zerar recrutados e remover o maior recrutador deste servidor.",
    },
    sales: {
      title: "Limpar vendas",
      description:
        "Isso vai zerar vendas, receita da organização, produto mais vendido e maior vendedor deste servidor.",
    },
    all: {
      title: "Limpar todas as estatísticas",
      description: "Isso vai zerar todos os indicadores de registros e vendas deste servidor.",
    },
  };

  const confirmReset = () => {
    if (!resetScope || !selectedClient) return;
    resetOrganizationStats(selectedClient.guildId, resetScope);
    toast.success("Estatísticas limpas com sucesso.");
    setResetScope(null);
  };

  if (!selectedClient || !statistics) {
    return (
      <div className="space-y-8">
        <PageHeader
          kicker="Organização"
          title="Estatísticas"
          description="Esta área é liberada quando Registro e Siglas ou Vendas e Arsenal estiver ativo para um servidor."
        />
        <div className="panel">
          <EmptyState>Nenhum servidor elegível para exibir estatísticas.</EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Organização"
        title="Estatísticas"
        description={`Dados do servidor ${selectedClient.appName}, separados pelo ID ${selectedClient.guildId}.`}
        action={
          eligibleClients.length > 1 ? (
            <Select
              value={selectedClient.id}
              onValueChange={(value) =>
                void navigate({ to: "/painel/estatisticas", search: { clientId: value } })
              }
            >
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue placeholder="Selecionar servidor" />
              </SelectTrigger>
              <SelectContent>
                {eligibleClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.appName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Recrutados"
          value={statistics.recruitmentsTotal.toLocaleString("pt-BR")}
          icon={UserPlus}
        />
        <MetricCard
          label="Vendas realizadas"
          value={statistics.salesTotal.toLocaleString("pt-BR")}
          icon={ShoppingBag}
        />
        <MetricCard
          label="Receita da organização"
          value={currency(statistics.organizationRevenue)}
          icon={Wallet}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <LeaderCard
          title="Produto mais vendido"
          icon={BarChart3}
          person={
            product
              ? {
                  discordId: product.productId,
                  name: product.name,
                  count: product.quantity,
                  revenue: product.revenue,
                }
              : undefined
          }
          emptyLabel="Nenhuma venda registrada ainda."
          value={(item) => `${item.count.toLocaleString("pt-BR")} unidades vendidas`}
        />
        <LeaderCard
          title="Maior recrutador"
          icon={UserPlus}
          person={recruiter}
          emptyLabel="Nenhum recrutamento registrado ainda."
          value={(item) => `${item.count.toLocaleString("pt-BR")} recrutamentos`}
        />
        <LeaderCard
          title="Maior vendedor"
          icon={Award}
          person={seller}
          emptyLabel="Nenhuma venda registrada ainda."
          value={(item) =>
            `${item.count.toLocaleString("pt-BR")} vendas · ${currency(item.revenue)}`
          }
        />
      </div>

      <div className="panel p-5">
        <p className="label-kicker">Atualização dos dados</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {statistics.updatedAt
            ? `Última atualização enviada pelos bots: ${new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(statistics.updatedAt))}.`
            : "Os bots ainda não enviaram eventos para este servidor. Assim que um recrutamento ou venda for registrado, os indicadores aparecerão aqui."}
        </p>
      </div>

      <div className="panel p-5">
        <p className="label-kicker">Limpar estatísticas</p>
        <p className="mt-2 text-sm text-muted-foreground">
          As limpezas afetam apenas o servidor selecionado e não removem suas configurações.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => setResetScope("recruitments")}
          >
            <RotateCcw className="size-4" /> Limpar registros
          </Button>
          <Button variant="secondary" className="gap-2" onClick={() => setResetScope("sales")}>
            <RotateCcw className="size-4" /> Limpar vendas
          </Button>
          <Button variant="destructive" className="gap-2" onClick={() => setResetScope("all")}>
            <RotateCcw className="size-4" /> Limpar tudo
          </Button>
        </div>
      </div>

      <AlertDialog open={Boolean(resetScope)} onOpenChange={(open) => !open && setResetScope(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resetScope ? resetDetails[resetScope].title : "Limpar estatísticas"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resetScope ? resetDetails[resetScope].description : ""}
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={confirmReset}
            >
              Confirmar limpeza
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="label-kicker">{label}</span>
        <Icon className="size-4 text-brand" />
      </div>
      <p className="mt-4 truncate text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
