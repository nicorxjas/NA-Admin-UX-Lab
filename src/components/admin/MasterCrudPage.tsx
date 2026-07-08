import { useMemo, useState, type WheelEvent } from "react";
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/admin/PageHeader";
import { cn } from "@/lib/utils";
import { useMasterData } from "@/lib/master-store-context";
import {
  masterConfigs,
  optionLabel,
  type MasterConfig,
  type MasterField,
  type MasterKey,
  type MasterRecord,
  type PrimitiveValue,
} from "@/lib/mock-data";

const SELECT_NONE = "__none__";
const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

type FormState = Record<string, string | boolean>;

function fieldByKey(config: MasterConfig, key: string) {
  return config.fields.find((field) => field.key === key);
}

function formValue(field: MasterField, value: PrimitiveValue): string | boolean {
  if (field.type === "boolean") return Boolean(value);
  if (value === null || value === undefined) return "";
  return String(value);
}

function createEmptyForm(config: MasterConfig): FormState {
  return Object.fromEntries(
    config.fields.map((field) => [field.key, field.type === "boolean" ? false : ""]),
  );
}

function createEditForm(config: MasterConfig, record: MasterRecord): FormState {
  return Object.fromEntries(
    config.fields.map((field) => [field.key, formValue(field, record[field.key])]),
  );
}

function parseForm(config: MasterConfig, form: FormState) {
  return Object.fromEntries(
    config.fields.map((field) => {
      const value = form[field.key];
      if (field.type === "boolean") return [field.key, Boolean(value)];
      if (field.type === "number") {
        const raw = String(value ?? "").trim();
        return [field.key, raw ? Number(raw) : null];
      }
      if (field.type === "select") {
        const raw = String(value ?? "").trim();
        return [field.key, raw && raw !== SELECT_NONE ? raw : null];
      }
      const raw = String(value ?? "").trim();
      return [field.key, raw ? raw : null];
    }),
  ) as Record<string, PrimitiveValue>;
}

function valueIsEmpty(field: MasterField, form: FormState) {
  if (field.type === "boolean") return false;
  const value = String(form[field.key] ?? "").trim();
  return !value || value === SELECT_NONE;
}

function validateForm({
  config,
  records,
  form,
  editingId,
}: {
  config: MasterConfig;
  records: MasterRecord[];
  form: FormState;
  editingId?: string;
}) {
  const errors: Record<string, string> = {};
  for (const field of config.fields) {
    if (field.required && valueIsEmpty(field, form)) {
      errors[field.key] = "Campo requerido";
      continue;
    }
    if (!field.unique || valueIsEmpty(field, form)) continue;
    const current = String(form[field.key] ?? "")
      .trim()
      .toLowerCase();
    const duplicated = records.some((record) => {
      if (record.id === editingId) return false;
      const candidate = record[field.key];
      if (candidate === null || candidate === undefined || candidate === "") return false;
      return String(candidate).trim().toLowerCase() === current;
    });
    if (duplicated) errors[field.key] = "Ya existe un registro con este valor";
  }
  return errors;
}

export function MasterCrudPage({ masterKey }: { masterKey: MasterKey }) {
  const config = masterConfigs[masterKey];
  const { masters, createRecord, updateRecord, setRecordActive } = useMasterData();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MasterRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => createEmptyForm(config));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const records = masters[masterKey];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    const keys = Array.from(
      new Set([...config.searchKeys, ...config.columns.map((column) => column.key)]),
    );
    return records.filter((record) =>
      keys.some((key) => {
        const field = fieldByKey(config, key);
        const display = String(formatValue(record[key], field, masters, "text"));
        return display.toLowerCase().includes(needle);
      }),
    );
  }, [config, masters, query, records]);

  const activeCount = records.filter((record) => record.activo).length;

  const openCreate = () => {
    setEditing(null);
    setForm(createEmptyForm(config));
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (record: MasterRecord) => {
    setEditing(record);
    setForm(createEditForm(config, record));
    setErrors({});
    setDialogOpen(true);
  };

  const setField = (field: MasterField, value: string | boolean) => {
    setForm((current) => ({ ...current, [field.key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field.key];
      return next;
    });
  };

  const save = () => {
    const nextErrors = validateForm({ config, records, form, editingId: editing?.id });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const values = parseForm(config, form);
    if (editing) {
      updateRecord(masterKey, editing.id, values);
    } else {
      createRecord(masterKey, values);
    }
    setDialogOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        actions={
          <Button
            size="sm"
            onClick={openCreate}
            className="h-8 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo
          </Button>
        }
      />

      <div className="px-8 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar..."
              className="h-8 bg-card pl-8 text-[13px] border-border/70"
            />
          </div>
          <div className="ml-auto flex items-center gap-2 text-[12px] text-muted-foreground">
            <span>
              {filtered.length} de {records.length}
            </span>
            <span className="rounded-md bg-success/10 px-2 py-1 text-success">
              {activeCount} activos
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border/70 bg-background/40">
                  {config.columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
                        column.className,
                      )}
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="w-28 px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Estado
                  </th>
                  <th className="w-32 px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={config.columns.length + 2}
                      className="px-4 py-12 text-center text-[13px] text-muted-foreground"
                    >
                      Sin registros para la busqueda actual.
                    </td>
                  </tr>
                ) : (
                  filtered.map((record) => (
                    <tr
                      key={record.id}
                      className={cn(
                        "border-b border-border/50 last:border-0 transition-colors hover:bg-accent/40",
                        !record.activo && "text-muted-foreground",
                      )}
                    >
                      {config.columns.map((column) => {
                        const field = fieldByKey(config, column.key);
                        return (
                          <td
                            key={column.key}
                            className={cn(
                              "px-4 py-2.5 text-foreground/90",
                              column.mono && "font-mono text-[12.5px]",
                              column.className,
                              !record.activo && "text-muted-foreground",
                            )}
                          >
                            {formatValue(record[column.key], field, masters, "node")}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-border/70 text-[11px]",
                            record.activo
                              ? "bg-success/10 text-success"
                              : "bg-muted/40 text-muted-foreground",
                          )}
                        >
                          {record.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Editar"
                            onClick={() => openEdit(record)}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={record.activo ? "Desactivar" : "Reactivar"}
                            onClick={() => setRecordActive(masterKey, record.id, !record.activo)}
                          >
                            {record.activo ? (
                              <Trash2 className="h-3.5 w-3.5" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Editar ${config.title}` : `Nuevo ${config.title}`}
            </DialogTitle>
            <DialogDescription>
              Los campos de sistema se completan automaticamente; la baja operativa usa estado
              inactivo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            {config.fields.map((field) => (
              <div key={field.key} className={cn(field.type === "textarea" && "sm:col-span-2")}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <Label htmlFor={`${config.key}-${field.key}`} className="text-[12.5px]">
                    {field.label}
                  </Label>
                  {field.required && (
                    <span className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                      requerido
                    </span>
                  )}
                </div>
                <FieldInput
                  field={field}
                  config={config}
                  value={form[field.key]}
                  masters={masters}
                  onChange={(value) => setField(field, value)}
                />
                {errors[field.key] && (
                  <p className="mt-1.5 text-[11.5px] text-destructive">{errors[field.key]}</p>
                )}
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={save}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FieldInput({
  field,
  config,
  value,
  masters,
  onChange,
}: {
  field: MasterField;
  config: MasterConfig;
  value: string | boolean;
  masters: Record<MasterKey, MasterRecord[]>;
  onChange: (value: string | boolean) => void;
}) {
  const id = `${config.key}-${field.key}`;

  if (field.type === "boolean") {
    const checked = value === true;
    return (
      <div className="linear-form-switch-field">
        <Switch id={id} checked={checked} onCheckedChange={onChange} />
        <span className="linear-form-switch-label">{checked ? "Activo" : "No"}</span>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <Textarea
        id={id}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        className="linear-form-textarea"
      />
    );
  }

  if (field.type === "select") {
    const options = resolveOptions(field, masters);
    const current = String(value ?? "") || (field.required ? "" : SELECT_NONE);
    return (
      <Select value={current} onValueChange={(next) => onChange(next)}>
        <SelectTrigger id={id} className="linear-form-select-trigger">
          <SelectValue placeholder="Seleccionar" />
        </SelectTrigger>
        <SelectContent>
          {!field.required && <SelectItem value={SELECT_NONE}>Sin asignar</SelectItem>}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "number") {
    return (
      <NumberInput
        id={id}
        value={String(value ?? "")}
        placeholder={field.placeholder}
        onChange={(next) => onChange(next)}
      />
    );
  }

  if (field.type === "time") {
    return (
      <TimeInput
        id={id}
        value={String(value ?? "")}
        placeholder={field.placeholder}
        onChange={(next) => onChange(next)}
      />
    );
  }

  if (field.type === "date") {
    return (
      <DateInput
        id={id}
        value={String(value ?? "")}
        placeholder={field.placeholder}
        onChange={(next) => onChange(next)}
      />
    );
  }

  return (
    <Input
      id={id}
      type={field.type}
      value={String(value ?? "")}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.placeholder}
      className="linear-form-input"
    />
  );
}

function NumberInput({
  id,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const step = (direction: 1 | -1) => {
    const current = Number.parseFloat(value);
    onChange(String((Number.isFinite(current) ? current : 0) + direction));
  };

  return (
    <div className="linear-number-field">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="linear-number-input"
      />
      <div className="linear-number-stepper">
        <button
          type="button"
          className="linear-number-step"
          onClick={() => step(1)}
          aria-label="Incrementar valor"
        >
          <ChevronUp className="linear-number-step-icon" />
        </button>
        <button
          type="button"
          className="linear-number-step linear-number-step-secondary"
          onClick={() => step(-1)}
          aria-label="Disminuir valor"
        >
          <ChevronDown className="linear-number-step-icon" />
        </button>
      </div>
    </div>
  );
}

function TimeInput({
  id,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const [hour = "", minute = ""] = value.split(":");

  const setPart = (part: "hour" | "minute", next: string) => {
    const nextHour = part === "hour" ? next : hour || "00";
    const nextMinute = part === "minute" ? next : minute || "00";
    onChange(`${nextHour}:${nextMinute}`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button id={id} type="button" className="linear-field-trigger">
          <span
            className={cn(
              "linear-field-mono",
              value ? "linear-field-value" : "linear-field-value-muted",
            )}
          >
            {value || placeholder || "--:--"}
          </span>
          <Clock className="linear-field-icon" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="linear-time-popover">
        <div className="linear-picker-header">
          <span className="linear-picker-title">Hora</span>
          {value && (
            <button
              type="button"
              className="linear-picker-clear"
              onClick={() => onChange("")}
              aria-label="Limpiar hora"
            >
              <X className="linear-picker-clear-icon" />
            </button>
          )}
        </div>
        <div className="linear-time-grid">
          <TimeColumn
            label="HH"
            options={HOURS}
            value={hour}
            onSelect={(next) => setPart("hour", next)}
          />
          <TimeColumn
            label="MM"
            options={MINUTES}
            value={minute}
            onSelect={(next) => setPart("minute", next)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TimeColumn({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <div className="linear-time-column-label">{label}</div>
      <div className="linear-time-column-scroll" onWheel={scrollTimeColumn}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={cn("linear-time-option", value === option && "linear-time-option-active")}
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function scrollTimeColumn(event: WheelEvent<HTMLDivElement>) {
  event.currentTarget.scrollTop += event.deltaY;
  event.preventDefault();
  event.stopPropagation();
}

function DateInput({
  id,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const selected = parseDateValue(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button id={id} type="button" className="linear-field-trigger">
          <span className={value ? "linear-field-value" : "linear-field-value-muted"}>
            {value || placeholder || "Seleccionar fecha"}
          </span>
          <CalendarIcon className="linear-field-icon" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="linear-date-popover">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => onChange(date ? formatDateValue(date) : "")}
          className="linear-calendar-surface"
        />
        {value && (
          <div className="linear-date-actions">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="linear-date-clear-button"
              onClick={() => onChange("")}
            >
              <X className="linear-picker-clear-icon" />
              Limpiar fecha
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function parseDateValue(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveOptions(field: MasterField, masters: Record<MasterKey, MasterRecord[]>) {
  if (field.options) return field.options;
  if (!field.reference) return [];
  const { masterKey, valueKey = "id", labelKeys, includeInactive } = field.reference;
  return masters[masterKey]
    .filter((record) => includeInactive || record.activo)
    .map((record) => ({
      value: String(record[valueKey] ?? record.id),
      label: optionLabel(record, labelKeys),
    }));
}

function formatValue(
  value: PrimitiveValue,
  field: MasterField | undefined,
  masters: Record<MasterKey, MasterRecord[]>,
  mode: "text" | "node",
) {
  if (value === null || value === undefined || value === "") return mode === "text" ? "" : "—";

  if (field?.type === "boolean" || typeof value === "boolean") {
    const label = value ? "Si" : "No";
    if (mode === "text") return label;
    return (
      <Badge variant="outline" className="border-border/70 bg-background/50 text-[11px]">
        {label}
      </Badge>
    );
  }

  if (field?.reference) {
    const { masterKey, valueKey = "id", labelKeys } = field.reference;
    const target = masters[masterKey].find(
      (record) => String(record[valueKey] ?? record.id) === String(value),
    );
    return target ? optionLabel(target, labelKeys) : String(value);
  }

  return String(value);
}
