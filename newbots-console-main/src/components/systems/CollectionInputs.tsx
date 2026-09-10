import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DISCORD_MENU_LIMIT = 25;

type Product = { id: string; nome: string; preco: number };
type Sigla = { label: string; value: string; cargoId: string };

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

export function SiglasInput({
  value,
  disabled,
  onChange,
}: {
  value: string | number | boolean | undefined;
  disabled: boolean;
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
    if (!normalizedLabel || !normalizedSigla || !/^\d{17,20}$/.test(normalizedRoleId)) {
      setError("Informe patente, sigla e um ID de cargo Discord válido.");
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
        <Input
          value={roleId}
          disabled={disabled || parsed.invalid}
          onChange={(event) => setRoleId(event.target.value.replace(/\D/g, ""))}
          placeholder="ID do cargo Discord"
          inputMode="numeric"
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
      {parsed.invalid ? (
        <Warning>
          As patentes salvas estão em formato inválido. Corrija o dado antes de editar.
        </Warning>
      ) : null}
      {error ? <Warning>{error}</Warning> : null}
      {parsed.items.length > 0 ? (
        <div className="divide-y divide-border rounded-md border border-border">
          {parsed.items.map((item) => (
            <div key={item.value} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{item.label}</p>
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  {item.value} · {item.cargoId}
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
          ))}
        </div>
      ) : null}
    </div>
  );
}
