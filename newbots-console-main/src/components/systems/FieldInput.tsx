import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConfigValue, SystemField } from "@/data/types";

export interface DiscordResourceOption {
  id: string;
  label: string;
}

const PLACEHOLDERS: Record<SystemField["type"], string> = {
  text: "Digite o valor...",
  number: "0",
  discord_id: "123456789012345678",
  discord_channel: "123456789012345678",
  discord_role: "123456789012345678",
  discord_role_multi: "",
  discord_category: "123456789012345678",
  boolean: "",
  select: "",
  textarea: "Digite o texto...",
};

/**
 * Renderiza dinamicamente o input de um campo criado pelo administrador.
 * O valor é sempre indexado pela `key` do campo.
 */
export function FieldInput({
  field,
  value,
  disabled = false,
  discordOptions,
  discordLoading = false,
  discordError,
  onChange,
}: {
  field: SystemField;
  value: ConfigValue | undefined;
  disabled?: boolean | undefined;
  discordOptions?: DiscordResourceOption[] | undefined;
  discordLoading?: boolean | undefined;
  discordError?: string | undefined;
  onChange: (value: ConfigValue) => void;
}) {
  if (field.type === "boolean") {
    return (
      <div className="flex items-center gap-3">
        <Switch
          checked={Boolean(value)}
          disabled={disabled}
          onCheckedChange={(checked) => onChange(checked)}
        />
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {value ? "Ativado" : "Desativado"}
        </span>
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <Select
        value={value ? String(value) : ""}
        disabled={disabled}
        onValueChange={(next) => onChange(next)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione uma opção" />
        </SelectTrigger>
        <SelectContent>
          {(field.options ?? []).map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const discordResource =
    field.type === "discord_channel" ||
    field.type === "discord_category" ||
    field.type === "discord_role";

  if (discordResource) {
    const selectedValue = value ? String(value) : "";
    const options = [...(discordOptions ?? [])];
    if (selectedValue && !options.some((option) => option.id === selectedValue)) {
      options.unshift({ id: selectedValue, label: `ID salvo: ${selectedValue}` });
    }

    if (options.length > 0 || discordLoading) {
      return (
        <div className="space-y-2">
          <Select
            value={selectedValue}
            disabled={disabled || discordLoading}
            onValueChange={(next) => onChange(next)}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  discordLoading ? "Carregando dados do Discord..." : "Selecione no servidor"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {discordError ? <p className="text-xs text-danger">{discordError}</p> : null}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Input
          value={selectedValue}
          disabled={disabled}
          inputMode="numeric"
          placeholder={PLACEHOLDERS[field.type]}
          className="font-mono text-sm"
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
        />
        <p className={discordError ? "text-xs text-danger" : "text-xs text-muted-foreground"}>
          {discordError ?? "Conecte o bot do cliente para carregar as opções do servidor."}
        </p>
      </div>
    );
  }

  if (field.type === "textarea" || (field.type === "text" && field.key.includes("mensagem"))) {
    return (
      <Textarea
        value={value ? String(value) : ""}
        disabled={disabled}
        placeholder={PLACEHOLDERS[field.type]}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    );
  }

  const numeric = field.type === "number";
  const mono = field.type !== "text";

  return (
    <Input
      value={value === undefined ? "" : String(value)}
      disabled={disabled}
      inputMode={numeric ? "numeric" : undefined}
      placeholder={PLACEHOLDERS[field.type]}
      className={mono ? "font-mono text-sm" : undefined}
      onChange={(e) => onChange(numeric ? e.target.value.replace(/\D/g, "") : e.target.value)}
    />
  );
}
