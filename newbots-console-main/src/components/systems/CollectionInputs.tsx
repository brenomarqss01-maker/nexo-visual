import { ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DiscordResourceOption } from "@/components/systems/FieldInput";

const DISCORD_MENU_LIMIT = 25;

type Product = { id: string; nome: string; preco: number };
type Sigla = { label: string; value: string; cargoId: string };
type Course = { id: string; nome: string; cargoId: string };
type Report = { id: string; nome: string };

function parseList<T>(value: string | number | boolean | undefined): {
  items: T[];
  invalid: boolean;
} {
  if (!value) return { items: [], invalid: false };
  try {
    const parsed: unknown = JSON.parse(String(value));
    return { items: Array.isArray(parsed) ? (parsed as T[]) : [], invalid: !Array.isArray(parsed) };
  } catch {
    return { items: [], invalid: true };
  }
}

function Warning({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-xs text-danger">{children}</p>;
}

function RoleSelect({
  value,
  disabled,
  discordOptions,
  discordLoading,
  placeholder,
  onChange,
}: {
  value: string;
  disabled: boolean;
  discordOptions?: DiscordResourceOption[] | undefined;
  discordLoading?: boolean | undefined;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const options = [...(discordOptions ?? [])];
  if (value && !options.some((option) => option.id === value)) {
    options.unshift({ id: value, label: `Cargo salvo: ${value}` });
  }

  return (
    <Select
      value={value}
      disabled={disabled || discordLoading || options.length === 0}
      onValueChange={onChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={discordLoading ? "Carregando cargos do Discord..." : placeholder}
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
  );
}

function DiscordResourceNotice({
  discordError,
  hasOptions,
}: {
  discordError?: string | undefined;
  hasOptions: boolean;
}) {
  if (discordError) return <Warning>{discordError}</Warning>;
  if (!hasOptions) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        Conecte o bot do cliente para carregar os cargos deste servidor.
      </p>
    );
  }
  return null;
}

export function ProductsInput({
  value,
  disabled,
  onChange,
}: {
  value: string | number | boolean | undefined;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const parsed = useMemo(() => parseList<Product>(value), [value]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addProduct = () => {
    const normalizedName = name.trim();
    const normalizedPrice = Number(price);
    if (!normalizedName || !Number.isSafeInteger(normalizedPrice) || normalizedPrice <= 0) {
      setError("Informe um produto e um valor inteiro maior que zero.");
      return;
    }
    if (normalizedName.length > 100) {
      setError("O nome do produto pode ter no máximo 100 caracteres.");
      return;
    }
    if (parsed.items.length >= DISCORD_MENU_LIMIT) {
      setError(`O Discord permite no máximo ${DISCORD_MENU_LIMIT} produtos no menu.`);
      return;
    }
    if (
      parsed.items.some((item) => item.nome.trim().toLowerCase() === normalizedName.toLowerCase())
    ) {
      setError("Esse produto já está cadastrado.");
      return;
    }

    onChange(
      JSON.stringify([
        ...parsed.items,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          nome: normalizedName,
          preco: normalizedPrice,
        },
      ]),
    );
    setName("");
    setPrice("");
    setError(null);
  };

  const removeProduct = (id: string) => {
    onChange(JSON.stringify(parsed.items.filter((item) => item.id !== id)));
    setError(null);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
        <Input
          value={name}
          disabled={disabled || parsed.invalid}
          onChange={(event) => setName(event.target.value)}
          placeholder="Produto"
          maxLength={100}
        />
        <Input
          value={price}
          disabled={disabled || parsed.invalid}
          onChange={(event) => setPrice(event.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          placeholder="Valor"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || parsed.invalid}
          onClick={addProduct}
        >
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">
        {parsed.items.length}/{DISCORD_MENU_LIMIT} produtos. Nome e valor são limpos após adicionar.
      </p>
      {parsed.invalid ? (
        <Warning>
          Os produtos salvos estão em formato inválido. Corrija o dado antes de editar.
        </Warning>
      ) : null}
      {error ? <Warning>{error}</Warning> : null}
      {parsed.items.length > 0 ? (
        <div className="divide-y divide-border rounded-md border border-border">
          {parsed.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm">{item.nome}</span>
              <span className="font-mono text-xs text-muted-foreground">
                R$ {Number(item.preco).toLocaleString("pt-BR")}
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={disabled}
                aria-label={`Remover ${item.nome}`}
                onClick={() => removeProduct(item.id)}
              >
                <Trash2 className="size-4 text-danger" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CoursesInput({
  value,
  disabled,
  discordOptions,
  discordLoading,
  discordError,
  onChange,
}: {
  value: string | number | boolean | undefined;
  disabled: boolean;
  discordOptions?: DiscordResourceOption[] | undefined;
  discordLoading?: boolean | undefined;
  discordError?: string | undefined;
  onChange: (value: string) => void;
}) {
  const limit = 7;
  const parsed = useMemo(() => parseList<Course>(value), [value]);
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addCourse = () => {
    const normalizedName = name.trim();
    if (!normalizedName || !roleId) {
      setError("Informe o nome do curso e selecione o cargo correspondente.");
      return;
    }
    if (normalizedName.length > 100) {
      setError("O nome do curso pode ter no máximo 100 caracteres.");
      return;
    }
    if (parsed.items.length >= limit) {
      setError(`Cadastre no máximo ${limit} cursos.`);
      return;
    }
    if (
      parsed.items.some((item) => item.nome.trim().toLowerCase() === normalizedName.toLowerCase())
    ) {
      setError("Esse curso já está cadastrado.");
      return;
    }

    onChange(
      JSON.stringify([
        ...parsed.items,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          nome: normalizedName,
          cargoId: roleId,
        },
      ]),
    );
    setName("");
    setRoleId("");
    setError(null);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Input
          value={name}
          disabled={disabled || parsed.invalid}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome do curso"
          maxLength={100}
        />
        <RoleSelect
          value={roleId}
          disabled={disabled || parsed.invalid}
          discordOptions={discordOptions}
          discordLoading={discordLoading}
          placeholder="Cargo do curso"
          onChange={setRoleId}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || parsed.invalid || parsed.items.length >= limit}
          onClick={addCourse}
        >
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">
        {parsed.items.length}/{limit} cursos cadastrados.
      </p>
      <DiscordResourceNotice
        discordError={discordError}
        hasOptions={Boolean(discordOptions?.length)}
      />
      {parsed.invalid ? <Warning>Os cursos salvos estão em formato inválido.</Warning> : null}
      {error ? <Warning>{error}</Warning> : null}
      {parsed.items.length > 0 ? (
        <div className="divide-y divide-border rounded-md border border-border">
          {parsed.items.map((item) => {
            const role =
              discordOptions?.find((option) => option.id === item.cargoId)?.label ?? item.cargoId;
            return (
              <div key={item.id} className="flex items-center gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{item.nome}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">{role}</p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={disabled}
                  aria-label={`Remover ${item.nome}`}
                  onClick={() => {
                    onChange(
                      JSON.stringify(parsed.items.filter((course) => course.id !== item.id)),
                    );
                    setError(null);
                  }}
                >
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function ReportsInput({
  value,
  disabled,
  onChange,
}: {
  value: string | number | boolean | undefined;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const limit = 7;
  const parsed = useMemo(() => parseList<Report>(value), [value]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addReport = () => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError("Informe o nome do relatório.");
      return;
    }
    if (normalizedName.length > 100) {
      setError("O nome do relatório pode ter no máximo 100 caracteres.");
      return;
    }
    if (parsed.items.length >= limit) {
      setError(`Cadastre no máximo ${limit} relatórios.`);
      return;
    }
    if (
      parsed.items.some((item) => item.nome.trim().toLowerCase() === normalizedName.toLowerCase())
    ) {
      setError("Esse relatório já está cadastrado.");
      return;
    }

    onChange(
      JSON.stringify([
        ...parsed.items,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, nome: normalizedName },
      ]),
    );
    setName("");
    setError(null);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          value={name}
          disabled={disabled || parsed.invalid}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Relatório de Oficiais"
          maxLength={100}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addReport();
            }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || parsed.invalid || parsed.items.length >= limit}
          onClick={addReport}
        >
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">
        {parsed.items.length}/{limit} relatórios cadastrados.
      </p>
      {parsed.invalid ? <Warning>Os relatórios salvos estão em formato inválido.</Warning> : null}
      {error ? <Warning>{error}</Warning> : null}
      {parsed.items.length > 0 ? (
        <div className="divide-y divide-border rounded-md border border-border">
          {parsed.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm">{item.nome}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={disabled}
                aria-label={`Remover ${item.nome}`}
                onClick={() => {
                  onChange(JSON.stringify(parsed.items.filter((report) => report.id !== item.id)));
                  setError(null);
                }}
              >
                <Trash2 className="size-4 text-danger" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function MultiRoleInput({
  value,
  disabled,
  maxSelections = 12,
  discordOptions,
  discordLoading,
  discordError,
  onChange,
}: {
  value: string | number | boolean | undefined;
  disabled: boolean;
  maxSelections?: number | undefined;
  discordOptions?: DiscordResourceOption[] | undefined;
  discordLoading?: boolean | undefined;
  discordError?: string | undefined;
  onChange: (value: string) => void;
}) {
  const parsed = useMemo(() => parseList<unknown>(value), [value]);
  const selectedIds = useMemo(
    () =>
      parsed.items
        .map((item) =>
          typeof item === "string"
            ? item
            : item && typeof item === "object" && "id" in item
              ? String(item.id)
              : "",
        )
        .filter(Boolean)
        .slice(0, maxSelections),
    [parsed.items, maxSelections],
  );
  const options = [...(discordOptions ?? [])];
  for (const id of selectedIds) {
    if (!options.some((option) => option.id === id)) {
      options.unshift({ id, label: `Cargo salvo: ${id}` });
    }
  }

  const toggle = (roleId: string, checked: boolean) => {
    const next = checked
      ? [...selectedIds, roleId].slice(0, maxSelections)
      : selectedIds.filter((id) => id !== roleId);
    onChange(JSON.stringify([...new Set(next)]));
  };

  return (
    <div className="space-y-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || discordLoading || parsed.invalid}
            className="w-full justify-between"
          >
            <span>
              {discordLoading
                ? "Carregando cargos do Discord..."
                : `Selecionar cargos (${selectedIds.length}/${maxSelections})`}
            </span>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-2">
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {options.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">
                Nenhum cargo disponível neste servidor.
              </p>
            ) : (
              options.map((option) => {
                const checked = selectedIds.includes(option.id);
                const limitReached = selectedIds.length >= maxSelections && !checked;
                return (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent/60"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled || limitReached}
                      onCheckedChange={(next) => toggle(option.id, next === true)}
                    />
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  </label>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      <p className="font-mono text-[10px] text-muted-foreground">
        {selectedIds.length}/{maxSelections} cargos selecionados.
      </p>
      <DiscordResourceNotice
        discordError={discordError}
        hasOptions={Boolean(discordOptions?.length)}
      />
      {parsed.invalid ? <Warning>Os cargos salvos estão em formato inválido.</Warning> : null}

      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const label = options.find((option) => option.id === id)?.label ?? id;
            return (
              <span
                key={id}
                className="inline-flex max-w-full items-center gap-2 rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs"
              >
                <span className="truncate">{label}</span>
                <button
                  type="button"
                  disabled={disabled}
                  className="text-muted-foreground transition-colors hover:text-danger disabled:opacity-50"
                  aria-label={`Remover ${label}`}
                  onClick={() => toggle(id, false)}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function SiglasInput({
  value,
  disabled,
  discordOptions,
  discordLoading,
  discordError,
  onChange,
}: {
  value: string | number | boolean | undefined;
  disabled: boolean;
  discordOptions?: DiscordResourceOption[] | undefined;
  discordLoading?: boolean | undefined;
  discordError?: string | undefined;
  onChange: (value: string) => void;
}) {
  const parsed = useMemo(() => parseList<Sigla>(value), [value]);
  const [label, setLabel] = useState("");
  const [sigla, setSigla] = useState("");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addSigla = () => {
    const normalizedLabel = label.trim();
    const normalizedSigla = sigla.trim().toUpperCase();
    const normalizedRoleId = roleId.trim();
    if (!normalizedLabel || !normalizedSigla || !/^\d{15,22}$/.test(normalizedRoleId)) {
      setError("Informe a patente, a sigla e selecione um cargo Discord.");
      return;
    }
    if (normalizedLabel.length > 100 || normalizedSigla.length > 100) {
      setError("Patente e sigla podem ter no máximo 100 caracteres.");
      return;
    }
    if (parsed.items.length >= DISCORD_MENU_LIMIT) {
      setError(`O Discord permite no máximo ${DISCORD_MENU_LIMIT} patentes no menu.`);
      return;
    }
    if (
      parsed.items.some((item) => item.value.trim().toLowerCase() === normalizedSigla.toLowerCase())
    ) {
      setError("Essa sigla já está cadastrada.");
      return;
    }

    onChange(
      JSON.stringify([
        ...parsed.items,
        { label: normalizedLabel, value: normalizedSigla, cargoId: normalizedRoleId },
      ]),
    );
    setLabel("");
    setSigla("");
    setRoleId("");
    setError(null);
  };

  const removeSigla = (siglaValue: string) => {
    onChange(JSON.stringify(parsed.items.filter((item) => item.value !== siglaValue)));
    setError(null);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={label}
          disabled={disabled || parsed.invalid}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Patente"
          maxLength={100}
        />
        <Input
          value={sigla}
          disabled={disabled || parsed.invalid}
          onChange={(event) => setSigla(event.target.value)}
          placeholder="Sigla"
          maxLength={100}
        />
        <RoleSelect
          value={roleId}
          disabled={disabled || parsed.invalid}
          discordOptions={discordOptions}
          discordLoading={discordLoading}
          placeholder="Cargo da patente"
          onChange={setRoleId}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || parsed.invalid}
          onClick={addSigla}
        >
          <Plus className="size-4" /> Adicionar patente
        </Button>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">
        {parsed.items.length}/{DISCORD_MENU_LIMIT} patentes. Os três campos são limpos após
        adicionar.
      </p>
      <DiscordResourceNotice
        discordError={discordError}
        hasOptions={Boolean(discordOptions?.length)}
      />
      {parsed.invalid ? (
        <Warning>
          As patentes salvas estão em formato inválido. Corrija o dado antes de editar.
        </Warning>
      ) : null}
      {error ? <Warning>{error}</Warning> : null}
      {parsed.items.length > 0 ? (
        <div className="divide-y divide-border rounded-md border border-border">
          {parsed.items.map((item) => {
            const role =
              discordOptions?.find((option) => option.id === item.cargoId)?.label ?? item.cargoId;
            return (
              <div key={item.value} className="flex items-center gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{item.label}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">
                    {item.value} · {role}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={disabled}
                  aria-label={`Remover ${item.label}`}
                  onClick={() => removeSigla(item.value)}
                >
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
