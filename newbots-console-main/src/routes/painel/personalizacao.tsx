import { createFileRoute } from "@tanstack/react-router";
import { Bot, Check, Image as ImageIcon, Palette, Plus, Save, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth/session";
import { EmptyState, PageHeader } from "@/components/ui-kit/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  BotCustomization,
  BotPresenceStatus,
} from "@/services/personalization/personalization.types";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/gif", "image/jpeg", "image/png", "image/webp"]);
const PRESENCE_OPTIONS: Array<{
  value: BotPresenceStatus;
  label: string;
  color: string;
}> = [
  { value: "online", label: "Online", color: "bg-success" },
  { value: "idle", label: "Ausente", color: "bg-warning" },
  { value: "dnd", label: "Não perturbe", color: "bg-danger" },
  { value: "invisible", label: "Invisível", color: "bg-muted-foreground" },
];

type SaveResponse = {
  ok: boolean;
  error?: string | undefined;
  customization?: BotCustomization | undefined;
};

export const Route = createFileRoute("/painel/personalizacao")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    clientId: typeof search["clientId"] === "string" ? search["clientId"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Personalização do bot — NEXO NETWORK" },
      {
        name: "description",
        content: "Solicite nome, identidade visual e status para sua aplicação Discord.",
      },
    ],
  }),
  component: BotPersonalization,
});

function useImagePreview(file: File | undefined, fallback?: string): string | undefined {
  const [preview, setPreview] = useState<string | undefined>(fallback);
  useEffect(() => {
    if (!file) {
      setPreview(fallback);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, fallback]);
  return preview;
}

function BotPersonalization() {
  const { applications, selectedClientId, refreshApplications } = useAuth();
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const [requestedName, setRequestedName] = useState("");
  const [accentColor, setAccentColor] = useState("#4f7fd6");
  const [presenceStatus, setPresenceStatus] = useState<BotPresenceStatus>("online");
  const [statusMessages, setStatusMessages] = useState([""]);
  const [avatarFile, setAvatarFile] = useState<File>();
  const [bannerFile, setBannerFile] = useState<File>();
  const [saving, setSaving] = useState(false);

  const selectedApplication = applications.find(
    (application) => application.clientId === selectedClientId,
  );
  const savedCustomization = selectedApplication?.customization;

  useEffect(() => {
    if (!selectedApplication) return;
    setRequestedName(savedCustomization?.requestedName ?? selectedApplication.botName);
    setAccentColor(savedCustomization?.accentColor ?? "#4f7fd6");
    setPresenceStatus(savedCustomization?.presenceStatus ?? "online");
    setStatusMessages(
      savedCustomization?.statusMessages.length ? savedCustomization.statusMessages : [""],
    );
    setAvatarFile(undefined);
    setBannerFile(undefined);
    if (avatarInput.current) avatarInput.current.value = "";
    if (bannerInput.current) bannerInput.current.value = "";
  }, [selectedApplication, savedCustomization]);

  const avatarPreview = useImagePreview(avatarFile, savedCustomization?.avatarUrl);
  const bannerPreview = useImagePreview(bannerFile, savedCustomization?.bannerUrl);
  const selectedPresence =
    PRESENCE_OPTIONS.find((item) => item.value === presenceStatus) ?? PRESENCE_OPTIONS[0]!;
  const cleanStatuses = useMemo(
    () => statusMessages.map((status) => status.trim()).filter(Boolean),
    [statusMessages],
  );

  const selectImage = (
    file: File | undefined,
    setter: (value: File | undefined) => void,
    input: HTMLInputElement,
  ) => {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      toast.error("Use uma imagem PNG, JPG, WEBP ou GIF.");
      input.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("A imagem deve ter no máximo 2 MB.");
      input.value = "";
      return;
    }
    setter(file);
  };

  const save = async () => {
    if (!selectedApplication) return;
    if (requestedName.trim().length < 2) {
      toast.error("Informe o nome desejado para o bot.");
      return;
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(accentColor)) {
      toast.error("Informe uma cor hexadecimal válida.");
      return;
    }
    if (cleanStatuses.length === 0) {
      toast.error("Adicione pelo menos uma mensagem de status.");
      return;
    }
    if (!avatarPreview || !bannerPreview) {
      toast.error("Envie a foto de perfil e o banner do bot.");
      return;
    }

    const form = new FormData();
    form.append("clientId", selectedApplication.clientId);
    form.append("requestedName", requestedName.trim());
    form.append("accentColor", accentColor.toUpperCase());
    form.append("presenceStatus", presenceStatus);
    form.append("statusMessages", JSON.stringify(cleanStatuses));
    if (avatarFile) form.append("avatar", avatarFile);
    if (bannerFile) form.append("banner", bannerFile);

    setSaving(true);
    try {
      const response = await fetch("/api/personalization", { method: "POST", body: form });
      const result = (await response.json()) as SaveResponse;
      if (!response.ok || !result.ok || !result.customization) {
        throw new Error(result.error || "Não foi possível salvar a personalização.");
      }
      await refreshApplications();
      setAvatarFile(undefined);
      setBannerFile(undefined);
      toast.success("Solicitação salva e enviada para a equipe NEXO.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar a personalização.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!selectedApplication) {
    return (
      <div className="space-y-8">
        <PageHeader
          kicker="Sua aplicação"
          title="Personalização"
          description="A personalização é liberada depois que uma aplicação com bot Discord for vinculada à sua conta."
        />
        <div className="panel">
          <EmptyState>Nenhuma aplicação foi selecionada.</EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Sua aplicação"
        title="Personalização"
        description="Defina a identidade visual e os status do seu bot. A equipe NEXO receberá sua solicitação no Discord."
        action={
          <Button className="gap-2" disabled={saving} onClick={() => void save()}>
            {saving ? (
              <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
            ) : (
              <Save className="size-4" />
            )}
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        }
      />

      <section className="panel overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[minmax(320px,0.88fr)_1.12fr]">
          <div className="border-b border-border p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <p className="label-kicker mb-4">Prévia da aplicação</p>
            <div className="overflow-hidden rounded-xl border border-border bg-background shadow-2xl shadow-black/30">
              <div className="relative aspect-[3/1] overflow-hidden bg-surface-2">
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Prévia do banner"
                    className="size-full object-cover"
                  />
                ) : (
                  <div
                    className="size-full opacity-70"
                    style={{
                      background: `radial-gradient(circle at 25% 30%, ${accentColor} 0, transparent 45%), linear-gradient(135deg, #111 0%, ${accentColor}55 100%)`,
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
              <div className="relative px-5 pb-5 pt-12">
                <div
                  className="absolute -top-10 left-5 flex size-20 items-center justify-center overflow-hidden rounded-full border-[5px] border-background bg-surface-2"
                  style={{ boxShadow: `0 0 0 2px ${accentColor}55` }}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Prévia do perfil"
                      className="size-full object-cover"
                    />
                  ) : (
                    <Bot className="size-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-lg font-bold">{requestedName || "Nome do bot"}</h2>
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[8px] font-bold text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    APP
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {selectedApplication.appName} · {accentColor.toUpperCase()}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn("size-2 rounded-full", selectedPresence.color)} />
                  <span>{cleanStatuses[0] || "Adicione uma mensagem de status"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-7">
            <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
              <div className="space-y-2">
                <Label htmlFor="bot-name">Nome desejado</Label>
                <Input
                  id="bot-name"
                  value={requestedName}
                  maxLength={32}
                  onChange={(event) => setRequestedName(event.target.value)}
                  placeholder="Nome do seu bot"
                  className="h-11"
                />
                <p className="font-mono text-[10px] text-muted-foreground">
                  {requestedName.length}/32 caracteres
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent-color">Cor principal</Label>
                <div className="flex h-11 items-center gap-2 rounded-md border border-input bg-background px-2">
                  <input
                    id="accent-color"
                    type="color"
                    value={accentColor}
                    onChange={(event) => setAccentColor(event.target.value)}
                    className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <Input
                    value={accentColor.toUpperCase()}
                    maxLength={7}
                    onChange={(event) => setAccentColor(event.target.value)}
                    className="h-auto border-0 bg-transparent p-0 font-mono text-xs shadow-none focus-visible:ring-0"
                    aria-label="Cor hexadecimal"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ImageUploadCard
                title="Foto de perfil"
                description="Imagem quadrada · PNG, JPG, WEBP ou GIF · até 2 MB"
                preview={avatarPreview}
                inputRef={avatarInput}
                onSelect={(file, input) => selectImage(file, setAvatarFile, input)}
              />
              <ImageUploadCard
                title="Banner"
                description="Recomendado 3:1 · PNG, JPG, WEBP ou GIF · até 2 MB"
                preview={bannerPreview}
                wide
                inputRef={bannerInput}
                onSelect={(file, input) => selectImage(file, setBannerFile, input)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="panel p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg border border-brand/20 bg-brand/10 p-2 text-brand">
            <Palette className="size-4" />
          </span>
          <div>
            <h2 className="font-semibold">Status do bot</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              A configuração fica vinculada ao servidor {selectedApplication.guildId} e não se
              mistura com outros clientes.
            </p>
          </div>
        </div>

        <div className="mt-6 max-w-xs space-y-2">
          <Label>Status de presença</Label>
          <Select
            value={presenceStatus}
            onValueChange={(value) => setPresenceStatus(value as BotPresenceStatus)}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESENCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", option.color)} />
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="my-7 h-px bg-border" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">Lista de status</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Adicione até 8 mensagens para o bot exibir em rotação.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2"
            disabled={statusMessages.length >= 8}
            onClick={() => setStatusMessages((current) => [...current, ""])}
          >
            <Plus className="size-3.5" /> Adicionar status
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {statusMessages.map((status, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background font-mono text-[10px] text-muted-foreground">
                {index + 1}
              </span>
              <Input
                value={status}
                maxLength={128}
                onChange={(event) =>
                  setStatusMessages((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? event.target.value : item,
                    ),
                  )
                }
                placeholder="Ex.: Gerenciando sua organização"
                className="h-11"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`Remover status ${index + 1}`}
                disabled={statusMessages.length === 1}
                onClick={() =>
                  setStatusMessages((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        {savedCustomization ? (
          <div className="mt-6 flex items-center gap-2 border-t border-border pt-5 font-mono text-[10px] text-muted-foreground">
            <Check className="size-3.5 text-success" /> Última solicitação salva em{" "}
            {new Date(savedCustomization.updatedAt).toLocaleString("pt-BR")}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ImageUploadCard({
  title,
  description,
  preview,
  wide = false,
  inputRef,
  onSelect,
}: {
  title: string;
  description: string;
  preview?: string | undefined;
  wide?: boolean | undefined;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (file: File | undefined, input: HTMLInputElement) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="size-4 text-brand" />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <div
        className={cn(
          "mt-3 flex overflow-hidden rounded-lg border border-dashed border-border bg-surface-2",
          wide
            ? "aspect-[3/1] items-center justify-center"
            : "aspect-square max-h-36 items-center justify-center",
        )}
      >
        {preview ? (
          <img src={preview} alt={`Prévia: ${title}`} className="size-full object-cover" />
        ) : (
          <Upload className="size-6 text-muted-foreground" />
        )}
      </div>
      <p className="mt-3 min-h-8 text-[11px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".gif,.jpg,.jpeg,.png,.webp,image/gif,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => onSelect(event.target.files?.[0], event.currentTarget)}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-3 w-full gap-2"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-3.5" /> {preview ? "Trocar imagem" : "Enviar imagem"}
      </Button>
    </div>
  );
}
