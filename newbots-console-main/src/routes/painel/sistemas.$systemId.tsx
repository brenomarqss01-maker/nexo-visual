import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth/session";
import { useData } from "@/data/store";
import { FieldInput, type DiscordResourceOption } from "@/components/systems/FieldInput";
import {
  CoursesInput,
  MultiRoleInput,
  ProductsInput,
  ReportsInput,
  SiglasInput,
} from "@/components/systems/CollectionInputs";
import { EmptyState, StatusBadge } from "@/components/ui-kit/primitives";
import { Button } from "@/components/ui/button";
import { expirationLabel, formatDate, isExpired } from "@/lib/dates";
import type { ConfigValue } from "@/data/types";
import { getClientDiscordResources } from "@/services/auth/discordBot.functions";

interface DiscordResources {
  channels: Array<{ id: string; name: string; type: number }>;
  categories: Array<{ id: string; name: string }>;
  roles: Array<{ id: string; name: string }>;
}

export const Route = createFileRoute("/painel/sistemas/$systemId")({
  validateSearch: (search: Record<string, unknown>) => ({
    clientId: typeof search["clientId"] === "string" ? search["clientId"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Configurar sistema — NEXO NETWORK" },
      {
        name: "description",
        content: "Preencha os IDs e configurações do seu sistema de bot Discord na NEXO NETWORK.",
      },
      { property: "og:title", content: "Configurar sistema — NEXO NETWORK" },
      {
        property: "og:description",
        content: "Preencha os IDs e configurações do seu sistema de bot Discord.",
      },
    ],
  }),
  component: ConfigureSystem,
});

function ConfigureSystem() {
  const { systemId } = useParams({ from: "/painel/sistemas/$systemId" });
  const { clientId } = Route.useSearch();
  const { db, saveConfig } = useData();
  const { clients } = useAuth();
  const client =
    clients.find((item) => item.id === clientId) ?? (clients.length === 1 ? clients[0] : null);

  const system = db.systems.find((s) => s.id === systemId);
  const license = db.licenses.find((l) => l.clientId === client?.id && l.systemId === systemId);
  const stored = useMemo(
    () =>
      db.configs.find((c) => c.guildId === client?.guildId && c.systemId === systemId)?.values ??
      {},
    [db.configs, client?.guildId, systemId],
  );

  const [values, setValues] = useState<Record<string, ConfigValue>>(stored);
  const [dirty, setDirty] = useState(false);
  const [discordResources, setDiscordResources] = useState<DiscordResources | null>(null);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [discordError, setDiscordError] = useState<string>();

  useEffect(() => {
    setValues(stored);
    setDirty(false);
  }, [stored]);

  useEffect(() => {
    const usesDiscordResources = system?.fields.some(
      (field) =>
        field.type === "discord_channel" ||
        field.type === "discord_category" ||
        field.type === "discord_role" ||
        field.type === "discord_role_multi",
    );
    if (!client || !usesDiscordResources) {
      setDiscordResources(null);
      setDiscordError(undefined);
      return;
    }

    let active = true;
    setDiscordLoading(true);
    setDiscordError(undefined);
    void getClientDiscordResources({
      data: { clientId: client.id, guildId: client.guildId },
    })
      .then((resources) => {
        if (active) setDiscordResources(resources);
      })
      .catch((error) => {
        if (!active) return;
        setDiscordResources(null);
        setDiscordError(
          error instanceof Error ? error.message : "Não foi possível carregar os dados do Discord.",
        );
      })
      .finally(() => {
        if (active) setDiscordLoading(false);
      });

    return () => {
      active = false;
    };
  }, [client, system]);

  const discordOptionsFor = (fieldType: string): DiscordResourceOption[] | undefined => {
    if (!discordResources) return undefined;
    if (fieldType === "discord_role" || fieldType === "discord_role_multi") {
      return discordResources.roles.map((role) => ({ id: role.id, label: `@${role.name}` }));
    }
    if (fieldType === "discord_category") {
      return discordResources.categories.map((category) => ({
        id: category.id,
        label: category.name,
      }));
    }
    if (fieldType === "discord_channel") {
      return discordResources.channels.map((channel) => ({
        id: channel.id,
        label:
          channel.type === 2 || channel.type === 13
            ? `🔊 ${channel.name}`
            : channel.type === 15
              ? `💬 ${channel.name}`
              : `# ${channel.name}`,
      }));
    }
    return undefined;
  };

  const expired = license ? isExpired(license.expiresAt) : true;

  if (!system || !license || !client) {
    return (
      <div className="panel">
        <EmptyState>
          Você não possui acesso a este sistema.
          <Link to="/painel" className="ml-1 underline">
            Voltar
          </Link>
        </EmptyState>
      </div>
    );
  }

  const handleSave = () => {
    saveConfig(client.id, system.id, values);
    setDirty(false);
    toast.success("Configurações salvas com sucesso.");
  };

  return (
    <div className="space-y-8">
      <div className="nexo-config-header">
        <Link
          to="/painel"
          className="nexo-config-back inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Voltar
        </Link>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{system.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {expired
                ? "Licença expirada — as configurações estão em modo leitura."
                : "Configure seu sistema abaixo."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge expired={expired} />
            <span className="font-mono text-[11px] text-muted-foreground">
              {formatDate(license.expiresAt)} · {expirationLabel(license.expiresAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="panel nexo-config-panel divide-y divide-border">
        {system.fields.length === 0 ? (
          <EmptyState>Este sistema ainda não possui campos configuráveis.</EmptyState>
        ) : (
          system.fields.map((field) => (
            <div
              key={field.id}
              className="nexo-config-row grid gap-3 px-6 py-5 md:grid-cols-[1fr_1.1fr] md:gap-8"
            >
              <div>
                <p className="text-sm font-medium">
                  {field.title}
                  {field.required ? <span className="ml-1 text-danger">*</span> : null}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{field.label}</p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  {field.key}
                </p>
              </div>
              <div className="md:pt-1">
                {field.key === "produtos_json" ? (
                  <ProductsInput
                    value={values[field.key]}
                    disabled={expired}
                    onChange={(value) => {
                      setValues((prev) => ({ ...prev, [field.key]: value }));
                      setDirty(true);
                    }}
                  />
                ) : field.key === "siglas_json" ? (
                  <SiglasInput
                    value={values[field.key]}
                    disabled={expired}
                    discordOptions={discordOptionsFor("discord_role")}
                    discordLoading={discordLoading}
                    discordError={discordError}
                    onChange={(value) => {
                      setValues((prev) => ({ ...prev, [field.key]: value }));
                      setDirty(true);
                    }}
                  />
                ) : field.key === "cursos_json" ? (
                  <CoursesInput
                    value={values[field.key]}
                    disabled={expired}
                    discordOptions={discordOptionsFor("discord_role")}
                    discordLoading={discordLoading}
                    discordError={discordError}
                    onChange={(value) => {
                      setValues((prev) => ({ ...prev, [field.key]: value }));
                      setDirty(true);
                    }}
                  />
                ) : field.key === "relatorios_json" ? (
                  <ReportsInput
                    value={values[field.key]}
                    disabled={expired}
                    onChange={(value) => {
                      setValues((prev) => ({ ...prev, [field.key]: value }));
                      setDirty(true);
                    }}
                  />
                ) : field.type === "discord_role_multi" ? (
                  <MultiRoleInput
                    value={values[field.key]}
                    disabled={expired}
                    maxSelections={field.maxSelections ?? 12}
                    discordOptions={discordOptionsFor(field.type)}
                    discordLoading={discordLoading}
                    discordError={discordError}
                    onChange={(value) => {
                      setValues((prev) => ({ ...prev, [field.key]: value }));
                      setDirty(true);
                    }}
                  />
                ) : (
                  <FieldInput
                    field={field}
                    value={values[field.key]}
                    disabled={expired}
                    discordOptions={discordOptionsFor(field.type)}
                    discordLoading={discordLoading}
                    discordError={discordError}
                    onChange={(value) => {
                      setValues((prev) => ({ ...prev, [field.key]: value }));
                      setDirty(true);
                    }}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="nexo-config-actions flex items-center justify-end gap-3">
        {dirty ? (
          <span className="font-mono text-[11px] text-warning">Alterações não salvas</span>
        ) : null}
        <Button
          onClick={handleSave}
          disabled={expired || system.fields.length === 0}
          className="gap-2"
        >
          <Save className="size-4" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
