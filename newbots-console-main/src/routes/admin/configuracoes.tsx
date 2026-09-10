import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import { ADMIN_DISCORD_ID } from "@/data/seed";
import { PageHeader } from "@/components/ui-kit/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações gerais — Admin NEXO NETWORK" },
      {
        name: "description",
        content: "Ajuste marca, expiração padrão e o Discord ID com acesso administrativo.",
      },
      { property: "og:title", content: "Configurações gerais — Admin NEXO NETWORK" },
      {
        property: "og:description",
        content: "Ajuste marca, expiração padrão e acesso administrativo.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { db, updateSettings, resetDatabase } = useData();
  const [form, setForm] = useState({ ...db.settings, adminDiscordId: ADMIN_DISCORD_ID });

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Configurações"
        title="Configurações gerais"
        description="Parâmetros globais da plataforma. Persistidos localmente até a conexão com o banco de dados."
      />

      <div className="panel space-y-5 px-6 py-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brand">Nome da marca</Label>
            <Input
              id="brand"
              value={form.brandName}
              onChange={(e) => setForm({ ...form, brandName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="days">Expiração padrão (dias)</Label>
            <Input
              id="days"
              value={String(form.defaultExpirationDays)}
              onChange={(e) =>
                setForm({
                  ...form,
                  defaultExpirationDays: Number(e.target.value.replace(/\D/g, "")),
                })
              }
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin">Discord ID do administrador</Label>
            <Input id="admin" value={ADMIN_DISCORD_ID} readOnly className="font-mono text-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support">URL de suporte</Label>
            <Input
              id="support"
              value={form.supportUrl}
              onChange={(e) => setForm({ ...form, supportUrl: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() => {
              updateSettings({ ...form, adminDiscordId: ADMIN_DISCORD_ID });
              toast.success("Configurações salvas com sucesso.");
            }}
          >
            Salvar configurações
          </Button>
        </div>
      </div>

      <div className="panel space-y-3 px-6 py-6">
        <h2 className="text-sm font-semibold">Dados do banco</h2>
        <p className="text-sm text-muted-foreground">
          Remove clientes, sistemas, licenças e configurações armazenados no MongoDB.
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            resetDatabase();
            toast.success("Dados restaurados.");
          }}
        >
          Limpar banco de dados
        </Button>
      </div>
    </div>
  );
}
