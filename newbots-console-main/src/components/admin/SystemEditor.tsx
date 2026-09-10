import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FIELD_TYPE_LABELS, type FieldType, type SystemField } from "@/data/types";
import { slugify, uid } from "@/lib/dates";

export interface SystemDraft {
  name: string;
  description: string;
  fields: SystemField[];
}

export function newField(): SystemField {
  return { id: uid("f"), title: "", label: "", key: "", type: "text" };
}

export function SystemEditor({
  draft,
  onChange,
  onSubmit,
  submitLabel,
}: {
  draft: SystemDraft;
  onChange: (draft: SystemDraft) => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  const [keyTouched, setKeyTouched] = useState<Record<string, boolean>>({});

  const updateField = (id: string, patch: Partial<SystemField>) =>
    onChange({
      ...draft,
      fields: draft.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });

  return (
    <div className="space-y-6">
      <div className="panel space-y-5 px-6 py-6">
        <div className="space-y-2">
          <Label htmlFor="systemName">Nome do sistema</Label>
          <Input
            id="systemName"
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            placeholder="Sistema de Ticket"
            className="h-12"
          />
          <p className="font-mono text-[11px] text-muted-foreground">
            id: {slugify(draft.name) || "sistema_..."}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="systemDescription">Descrição (opcional)</Label>
          <Textarea
            id="systemDescription"
            value={draft.description}
            onChange={(e) => onChange({ ...draft, description: e.target.value })}
            placeholder="Atendimento com categorias, logs e cargos de suporte."
            rows={2}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="label-kicker">Campos do sistema</h2>
          <span className="font-mono text-[11px] text-muted-foreground">
            {draft.fields.length} campos
          </span>
        </div>

        {draft.fields.map((field, index) => (
          <div key={field.id} className="panel px-6 py-5">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <GripVertical className="size-4 text-muted-foreground/60" />
                <span className="label-kicker">Campo {index + 1}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-danger"
                onClick={() =>
                  onChange({ ...draft, fields: draft.fields.filter((f) => f.id !== field.id) })
                }
              >
                <Trash2 className="size-3.5" /> Remover campo
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${field.id}-title`}>Título</Label>
                <Input
                  id={`${field.id}-title`}
                  value={field.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    updateField(field.id, {
                      title,
                      ...(keyTouched[field.id] ? {} : { key: slugify(title) }),
                    });
                  }}
                  placeholder="Canal de Logs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${field.id}-key`}>Chave (key)</Label>
                <Input
                  id={`${field.id}-key`}
                  value={field.key}
                  onChange={(e) => {
                    setKeyTouched((prev) => ({ ...prev, [field.id]: true }));
                    updateField(field.id, { key: slugify(e.target.value) });
                  }}
                  placeholder="canal_logs"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`${field.id}-label`}>Label / descrição</Label>
                <Input
                  id={`${field.id}-label`}
                  value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                  placeholder="ID do canal onde serão enviados os logs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${field.id}-type`}>Tipo</Label>
                <Select
                  value={field.type}
                  onValueChange={(value) => updateField(field.id, { type: value as FieldType })}
                >
                  <SelectTrigger id={`${field.id}-type`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {field.type === "select" ? (
                <div className="space-y-2">
                  <Label htmlFor={`${field.id}-options`}>Opções (separadas por vírgula)</Label>
                  <Input
                    id={`${field.id}-options`}
                    value={(field.options ?? []).join(", ")}
                    onChange={(e) =>
                      updateField(field.id, {
                        options: e.target.value
                          .split(",")
                          .map((o) => o.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Baixo, Médio, Alto"
                  />
                </div>
              ) : null}
            </div>
          </div>
        ))}

        <Button
          variant="secondary"
          className="w-full gap-2 border border-dashed border-border bg-transparent hover:bg-accent/60"
          onClick={() => onChange({ ...draft, fields: [...draft.fields, newField()] })}
        >
          <Plus className="size-4" /> Adicionar campo
        </Button>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
}
