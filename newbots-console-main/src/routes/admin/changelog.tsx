import { createFileRoute } from "@tanstack/react-router";
import {
  Bold,
  Braces,
  ChevronRight,
  Code2,
  Italic,
  Link2,
  List,
  LoaderCircle,
  Megaphone,
  MessageSquareText,
  Quote,
  ShieldCheck,
  Strikethrough,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui-kit/primitives";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/data/store";
import {
  getAdminChangelogChannels,
  publishAdminChangelog,
} from "@/services/auth/changelog.functions";

export const Route = createFileRoute("/admin/changelog")({
  head: () => ({
    meta: [
      { title: "Changelog — Admin NEXO NETWORK" },
      {
        name: "description",
        content: "Publique changelogs nos canais Discord das aplicações NEXO NETWORK.",
      },
    ],
  }),
  component: ChangelogPage,
});

interface ChangelogChannel {
  id: string;
  name: string;
  type: number;
  parentId?: string | undefined;
  categoryName?: string | undefined;
}

type FormatAction = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  before: string;
  after: string;
  placeholder: string;
};

const FORMAT_ACTIONS: FormatAction[] = [
  { label: "Negrito", icon: Bold, before: "**", after: "**", placeholder: "texto" },
  { label: "Itálico", icon: Italic, before: "*", after: "*", placeholder: "texto" },
  {
    label: "Tachado",
    icon: Strikethrough,
    before: "~~",
    after: "~~",
    placeholder: "texto",
  },
  { label: "Código", icon: Code2, before: "`", after: "`", placeholder: "código" },
  {
    label: "Bloco de código",
    icon: Braces,
    before: "```\n",
    after: "\n```",
    placeholder: "código",
  },
  { label: "Citação", icon: Quote, before: "> ", after: "", placeholder: "texto" },
  { label: "Lista", icon: List, before: "- ", after: "", placeholder: "item" },
  {
    label: "Link",
    icon: Link2,
    before: "[",
    after: "](https://exemplo.com)",
    placeholder: "texto do link",
  },
];

function ChangelogPage() {
  const { db, ready, databaseError, log } = useData();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [clientId, setClientId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [channels, setChannels] = useState<ChangelogChannel[]>([]);
  const [botName, setBotName] = useState("");
  const [guildName, setGuildName] = useState("");
  const [content, setContent] = useState("");
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [channelError, setChannelError] = useState("");
  const [publishing, setPublishing] = useState(false);

  const selectedClient = useMemo(
    () => db.clients.find((client) => client.id === clientId),
    [clientId, db.clients],
  );
  const selectedChannel = channels.find((channel) => channel.id === channelId);

  useEffect(() => {
    if (!clientId) return;
    if (!db.clients.some((client) => client.id === clientId)) setClientId("");
  }, [clientId, db.clients]);

  useEffect(() => {
    let current = true;
    setChannelId("");
    setChannels([]);
    setBotName("");
    setGuildName("");
    setChannelError("");
    if (!selectedClient) return () => undefined;

    setLoadingChannels(true);
    void getAdminChangelogChannels({
      data: { clientId: selectedClient.id, guildId: selectedClient.guildId },
    })
      .then((result) => {
        if (!current) return;
        setChannels(result.channels);
        setBotName(result.botName);
        setGuildName(result.guildName || selectedClient.appName);
        if (result.channels.length === 0) {
          setChannelError("Nenhum canal de texto ou anúncios foi encontrado neste servidor.");
        }
      })
      .catch((error) => {
        if (!current) return;
        setChannelError(
          error instanceof Error ? error.message : "Não foi possível carregar os canais.",
        );
      })
      .finally(() => {
        if (current) setLoadingChannels(false);
      });

    return () => {
      current = false;
    };
  }, [selectedClient]);

  const applyFormat = ({ before, after, placeholder }: FormatAction) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? content.length;
    const selection = content.slice(start, end) || placeholder;
    const next = `${content.slice(0, start)}${before}${selection}${after}${content.slice(end)}`;
    if (next.length > 2_000) {
      toast.error("Essa formatação ultrapassaria o limite de 2.000 caracteres.");
      return;
    }
    setContent(next);
    requestAnimationFrame(() => {
      textarea?.focus();
      const selectionStart = start + before.length;
      textarea?.setSelectionRange(selectionStart, selectionStart + selection.length);
    });
  };

  const publish = async () => {
    if (!selectedClient) {
      toast.error("Selecione uma aplicação.");
      return;
    }
    if (!channelId) {
      toast.error("Selecione o canal do anúncio.");
      return;
    }
    if (!content.trim()) {
      toast.error("Escreva o changelog antes de publicar.");
      return;
    }

    setPublishing(true);
    try {
      const result = await publishAdminChangelog({
        data: {
          clientId: selectedClient.id,
          guildId: selectedClient.guildId,
          channelId,
          content,
        },
      });
      log(
        "Administrador",
        "Changelog publicado",
        `${selectedClient.appName} · #${result.channelName} · ${result.messageId}`,
      );
      toast.success(`Changelog publicado em #${result.channelName}.`);
      setContent("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível publicar o changelog.",
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Comunicação"
        title="Changelog"
        description="Escolha uma aplicação, selecione o canal do Discord e publique a atualização usando Markdown."
      />

      {databaseError ? (
        <div className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {databaseError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="panel overflow-hidden">
          <div className="flex items-start gap-3 border-b border-border px-6 py-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-brand/25 bg-brand/10 text-brand">
              <Megaphone className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Novo anúncio</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                A mensagem será enviada pelo bot conectado à aplicação selecionada.
              </p>
            </div>
          </div>

          <div className="space-y-6 px-6 py-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="changelog-application">Aplicação</Label>
                <Select value={clientId} onValueChange={setClientId} disabled={!ready}>
                  <SelectTrigger id="changelog-application" className="h-11">
                    <SelectValue
                      placeholder={ready ? "Selecione uma aplicação" : "Carregando aplicações..."}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {db.clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.appName} · {client.guildId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="changelog-channel">Canal do Discord</Label>
                <Select
                  value={channelId}
                  onValueChange={setChannelId}
                  disabled={!selectedClient || loadingChannels || channels.length === 0}
                >
                  <SelectTrigger id="changelog-channel" className="h-11">
                    <SelectValue
                      placeholder={
                        loadingChannels
                          ? "Carregando canais..."
                          : selectedClient
                            ? "Selecione um canal"
                            : "Escolha a aplicação primeiro"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.categoryName ? `${channel.categoryName} / ` : ""}#{channel.name}
                        {channel.type === 5 ? " · anúncios" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {channelError ? (
              <p className="rounded-lg border border-danger/20 bg-danger/8 px-3 py-2 text-xs text-danger">
                {channelError}
              </p>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-end justify-between gap-4">
                <Label htmlFor="changelog-content">Conteúdo do changelog</Label>
                <span
                  className={`font-mono text-[11px] ${content.length > 1_900 ? "text-danger" : "text-muted-foreground"}`}
                >
                  {content.length}/2000
                </span>
              </div>

              <div className="flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-border bg-surface-2 p-2">
                {FORMAT_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.label}
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      title={action.label}
                      aria-label={action.label}
                      onClick={() => applyFormat(action)}
                    >
                      <Icon className="size-4" />
                    </Button>
                  );
                })}
              </div>
              <Textarea
                ref={textareaRef}
                id="changelog-content"
                value={content}
                maxLength={2_000}
                onChange={(event) => setContent(event.target.value)}
                placeholder={
                  "# Nova atualização\n\n**Novidades**\n- Novo sistema disponível\n- Melhorias de desempenho\n- Correções gerais"
                }
                className="min-h-[300px] resize-y rounded-t-none font-mono text-sm leading-6"
              />
              <p className="text-xs text-muted-foreground">
                Títulos, negrito, itálico, links, listas, citações, spoilers e blocos de código
                serão interpretados pelo Discord.
              </p>
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-success" />
                Menções automáticas estão desativadas para evitar notificações acidentais.
              </div>
              <Button
                className="gap-2 sm:min-w-44"
                disabled={publishing || !selectedClient || !channelId || !content.trim()}
                onClick={() => void publish()}
              >
                {publishing ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Megaphone className="size-4" />
                )}
                {publishing ? "Publicando..." : "Publicar changelog"}
              </Button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="panel overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <span className="label-kicker">Destino</span>
            </div>
            <div className="space-y-4 px-5 py-5">
              <DestinationRow
                label="Aplicação"
                value={selectedClient?.appName || "Não selecionada"}
              />
              <DestinationRow
                label="Servidor"
                value={guildName || selectedClient?.guildId || "—"}
              />
              <DestinationRow label="Bot responsável" value={botName || "—"} />
              <DestinationRow
                label="Canal"
                value={
                  selectedChannel
                    ? `${selectedChannel.categoryName ? `${selectedChannel.categoryName} / ` : ""}#${selectedChannel.name}`
                    : "—"
                }
              />
            </div>
          </div>

          <div className="panel px-5 py-5">
            <div className="flex items-center gap-2">
              <MessageSquareText className="size-4 text-brand" />
              <h2 className="text-sm font-semibold">Como será enviado</h2>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              O site valida a aplicação e o servidor novamente no momento do envio. Depois, o bot
              publica exatamente o conteúdo escrito no editor para o Discord renderizar o Markdown.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DestinationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <ChevronRight className="size-3.5 shrink-0 text-brand" />
      <div className="min-w-0">
        <p className="label-kicker">{label}</p>
        <p className="mt-1 truncate text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}
