import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useData } from "@/data/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Client } from "@/data/types";
import { uid } from "@/lib/dates";
import { connectClientDiscordBot } from "@/services/auth/discordBot.functions";

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | undefined;
}) {
  const { db, createClient, updateClient, setClientSystems } = useData();
  const editing = Boolean(client);

  const existingSystemIds = useMemo(
    () =>
      client ? db.licenses.filter((l) => l.clientId === client.id).map((l) => l.systemId) : [],
    [db.licenses, client],
  );

  const [appName, setAppName] = useState(client?.appName ?? "");
  const [discordId, setDiscordId] = useState(client?.discordId ?? "");
  const [guildId, setGuildId] = useState(client?.guildId ?? "");
  const [botToken, setBotToken] = useState("");
  const [systemIds, setSystemIds] = useState<string[]>(existingSystemIds);
  const [expirationDays, setExpirationDays] = useState(String(db.settings.defaultExpirationDays));
  const [submitting, setSubmitting] = useState(false);
  const reset = () => {
    setAppName(client?.appName ?? "");
    setDiscordId(client?.discordId ?? "");
    setGuildId(client?.guildId ?? "");
    setBotToken("");
    setSystemIds(existingSystemIds);
    setExpirationDays(String(db.settings.defaultExpirationDays));
  };

  const submit = async () => {
    if (!appName.trim() || !discordId.trim() || !guildId.trim()) {
      toast.error("Informe o nome do app, o ID do cliente e o ID do servidor.");
      return;
    }
    const normalizedGuildId = guildId.trim();
    const clientForGuild = db.clients.find(
      (item) => item.guildId === normalizedGuildId && item.id !== client?.id,
    );
    if (editing && clientForGuild) {
      toast.error("Este ID de servidor já está vinculado a outro cliente.");
      return;
    }
    if (!editing && clientForGuild && clientForGuild.discordId !== discordId.trim()) {
      toast.error("Este ID de servidor já está cadastrado para outro cliente.");
      return;
    }
    const days = Number(expirationDays) || db.settings.defaultExpirationDays;
    const targetClientId = client?.id ?? clientForGuild?.id ?? uid("cli");
    const normalizedToken = botToken.trim();
    const guildChanged = Boolean(editing && client && normalizedGuildId !== client.guildId);
    if ((!editing && !clientForGuild && !normalizedToken) || (guildChanged && !normalizedToken)) {
      toast.error("Informe o token do bot para conectar este servidor.");
      return;
    }

    setSubmitting(true);
    try {
      if (normalizedToken) {
        await connectClientDiscordBot({
          data: {
            clientId: targetClientId,
            guildId: normalizedGuildId,
            token: normalizedToken,
          },
        });
      }

      if (editing && client) {
        updateClient(client.id, {
          appName: appName.trim(),
          discordId: discordId.trim(),
          guildId: normalizedGuildId,
        });
        setClientSystems(client.id, systemIds, days);
        toast.success("Cliente atualizado.");
      } else if (clientForGuild) {
        const currentSystemIds = db.licenses
          .filter((license) => license.clientId === clientForGuild.id)
          .map((license) => license.systemId);
        const nextSystemIds = [...new Set([...currentSystemIds, ...systemIds])];
        setClientSystems(clientForGuild.id, nextSystemIds, days);
        toast.success("Sistema(s) adicionado(s) ao cliente existente.");
      } else {
        createClient({
          id: targetClientId,
          appName: appName.trim(),
          discordId: discordId.trim(),
          guildId: normalizedGuildId,
          systemIds,
          expirationDays: days,
        });
        toast.success("Cliente criado com sucesso.");
      }
      onOpenChange(false);
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o cliente.");
    } finally {
      setSubmitting(false);
    }
  };

  const expiresPreview = new Date(
    Date.now() + (Number(expirationDays) || 0) * 86_400_000,
  ).toLocaleDateString("pt-BR");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) reset();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            Defina o app, o Discord ID, o servidor e os sistemas disponíveis no bot da NEXO NETWORK.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="appName">Nome do App</Label>
            <Input
              id="appName"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="New Era City"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discordId">ID do Cliente (Discord)</Label>
            <Input
              id="discordId"
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value.replace(/\D/g, ""))}
              placeholder="1063194868677095454"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guildId">ID do Servidor (Discord)</Label>
            <Input
              id="guildId"
              value={guildId}
              onChange={(e) => setGuildId(e.target.value.replace(/\D/g, ""))}
              placeholder="292929292929292929"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              O token informado abaixo precisa pertencer a um bot instalado neste servidor.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="botToken">
              Token do Bot{editing ? " (opcional para manter o atual)" : ""}
            </Label>
            <Input
              id="botToken"
              type="password"
              autoComplete="new-password"
              value={botToken}
              onChange={(event) => setBotToken(event.target.value)}
              placeholder={
                editing ? "Deixe vazio para manter o token atual" : "Cole o token do bot"
              }
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              O token é validado pelo Discord e armazenado criptografado. Ele permite carregar os
              canais, cargos e categorias do servidor.
            </p>
          </div>

          <div className="space-y-3">
            <Label>Sistemas vinculados</Label>
            <div className="space-y-1 rounded-lg border border-border bg-surface-2 p-3">
              {db.systems.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">
                  Nenhum sistema cadastrado ainda.
                </p>
              ) : (
                db.systems.map((system) => (
                  <label
                    key={system.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/60"
                  >
                    <Checkbox
                      checked={systemIds.includes(system.id)}
                      onCheckedChange={(checked) =>
                        setSystemIds((prev) =>
                          checked ? [...prev, system.id] : prev.filter((id) => id !== system.id),
                        )
                      }
                    />
                    <span className="flex-1 text-sm">{system.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {system.fields.length} campos
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiration">Expiração (dias)</Label>
            <Input
              id="expiration"
              value={expirationDays}
              onChange={(e) => setExpirationDays(e.target.value.replace(/\D/g, ""))}
              className="font-mono text-sm"
            />
            <p className="font-mono text-[11px] text-muted-foreground">
              Novos vínculos expiram em {expiresPreview}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" disabled={submitting} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={submitting} onClick={() => void submit()}>
            {submitting ? "Salvando..." : editing ? "Salvar alterações" : "Criar cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
