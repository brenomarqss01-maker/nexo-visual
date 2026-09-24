import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-kit/primitives";
import { useData } from "@/data/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/painel/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte — NEXO NETWORK" },
      {
        name: "description",
        content:
          "Fale com a equipe NEXO NETWORK para dúvidas sobre licenças e configuração de bots.",
      },
      { property: "og:title", content: "Suporte — NEXO NETWORK" },
      {
        property: "og:description",
        content: "Fale com a equipe NEXO NETWORK sobre licenças e configuração de bots.",
      },
    ],
  }),
  component: Support,
});

function Support() {
  const { db } = useData();
  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Suporte"
        title="Precisa de ajuda?"
        description="Nossa equipe responde direto no Discord. Tenha em mãos o ID do seu servidor e o nome do sistema."
      />
      <div className="panel nexo-support-card px-6 py-8">
        <p className="text-sm text-muted-foreground">
          Atendimento humano, sem robô intermediando. Resposta média em poucos minutos durante o
          horário comercial.
        </p>
        <Button asChild className="mt-6">
          <a href={db.settings.supportUrl} target="_blank" rel="noreferrer">
            Abrir Discord
          </a>
        </Button>
      </div>
    </div>
  );
}
