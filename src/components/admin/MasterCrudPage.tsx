import { useEffect, useMemo, useRef, useState, type WheelEvent } from "react";
import {
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  Plus,
  QrCode,
  RotateCcw,
  Search,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
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
type ScannerStatus = "idle" | "requesting" | "scanning" | "detected" | "unsupported" | "blocked";
type BarcodeDetectorResult = { rawValue: string };
type BarcodeDetectorInstance = {
  detect: (source: CanvasImageSource) => Promise<BarcodeDetectorResult[]>;
};
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanFrameRef = useRef<number | null>(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MasterRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>("idle");
  const [scannedCode, setScannedCode] = useState("");
  const [manualCode, setManualCode] = useState("");
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
  const qrValue = (scannedCode || manualCode).trim();

  useEffect(() => {
    if (!qrDialogOpen || masterKey !== "dispositivos") return;

    let active = true;

    const stopScanner = () => {
      if (scanFrameRef.current !== null) {
        window.cancelAnimationFrame(scanFrameRef.current);
        scanFrameRef.current = null;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };

    const startScanner = async () => {
      if (!navigator.mediaDevices?.getUserMedia || !window.BarcodeDetector) {
        setScannerStatus("unsupported");
        return;
      }

      setScannerStatus("requesting");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();

        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        setScannerStatus("scanning");

        const scan = async () => {
          if (!active || !videoRef.current) return;
          try {
            const [result] = await detector.detect(videoRef.current);
            if (result?.rawValue) {
              setScannedCode(result.rawValue);
              setScannerStatus("detected");
              stopScanner();
              return;
            }
          } catch {
            // Keep the camera running; a single decode miss should not interrupt scanning.
          }
          scanFrameRef.current = window.requestAnimationFrame(scan);
        };

        scanFrameRef.current = window.requestAnimationFrame(scan);
      } catch {
        if (active) setScannerStatus("blocked");
      }
    };

    startScanner();

    return () => {
      active = false;
      stopScanner();
    };
  }, [masterKey, qrDialogOpen]);

  const openCreate = () => {
    setEditing(null);
    setForm(createEmptyForm(config));
    setErrors({});
    setDialogOpen(true);
  };

  const openQrRegistration = () => {
    setScannerStatus("idle");
    setScannedCode("");
    setManualCode("");
    setQrDialogOpen(true);
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

  const openCreateFromQr = () => {
    if (!qrValue) return;

    setEditing(null);
    setForm({
      ...createEmptyForm(config),
      codigo: equipmentCodeFromQr(qrValue),
      fingerprint: qrValue,
    });
    setErrors({});
    setQrDialogOpen(false);
    setDialogOpen(true);
  };

  const headerActions = (
    <>
      {masterKey === "dispositivos" && (
        <Button
          size="sm"
          variant="outline"
          onClick={openQrRegistration}
          className="h-8 gap-1.5 border-[#5E6AD2]/50 bg-[#5E6AD2]/10 text-[#A8B1FF] hover:bg-[#5E6AD2]/15 hover:text-[#C7CDFF]"
        >
          <QrCode className="h-3.5 w-3.5" />
          Escanear QR
        </Button>
      )}
      <Button
        size="sm"
        onClick={openCreate}
        className="h-8 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
      >
        <Plus className="h-3.5 w-3.5" />
        Nuevo
      </Button>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        actions={headerActions}
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

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-2xl border-border/80 bg-[#0e0f11] p-0 shadow-2xl">
          <div className="px-6 pt-6 pb-5">
            <DialogHeader className="space-y-2">
              <DialogTitle className="flex items-center gap-2 text-[22px] font-semibold text-foreground">
                <QrCode className="h-5 w-5 text-[#A8B1FF]" />
                Escanear QR del equipo
              </DialogTitle>
              <DialogDescription className="max-w-xl text-[13.5px] leading-relaxed text-muted-foreground">
                Apunta la camara al codigo pegado en el equipo fisico para iniciar su alta en
                Dispositivos.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 rounded-lg border border-border/80 bg-background/40 p-5">
              <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md border border-border/80 bg-[#050607]">
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    className={cn(
                      "h-full w-full object-cover",
                      scannerStatus === "scanning" || scannerStatus === "detected"
                        ? "opacity-80"
                        : "opacity-0",
                    )}
                  />
                  <div className="pointer-events-none absolute inset-5 rounded-md border border-white/15">
                    <span className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-[#5E6AD2]" />
                    <span className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-[#5E6AD2]" />
                    <span className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-[#5E6AD2]" />
                    <span className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-[#5E6AD2]" />
                    {scannerStatus === "scanning" && (
                      <span className="absolute left-3 right-3 top-1/2 h-px bg-[#A8B1FF] shadow-[0_0_18px_rgba(94,106,210,0.85)]" />
                    )}
                  </div>
                  {scannerStatus !== "scanning" && scannerStatus !== "detected" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                      <Camera className="h-9 w-9 text-[#A8B1FF]" />
                      <div className="mt-3 text-[13px] font-medium text-foreground">
                        {scannerStatus === "requesting"
                          ? "Solicitando camara"
                          : scannerStatus === "blocked"
                            ? "Camara no disponible"
                            : scannerStatus === "unsupported"
                              ? "Escaner no soportado"
                              : "Preparando escaner"}
                      </div>
                      <div className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                        Usa el ingreso manual si el navegador no puede leer QR.
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-col justify-center">
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                    <Smartphone className="h-4 w-4 text-[#A8B1FF]" />
                    Leer etiqueta del equipo
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    Cuando el QR sea detectado, se abre el alta con el codigo y fingerprint
                    precargados.
                  </p>

                  <div className="mt-5">
                    <div className="mb-2 text-[12px] font-medium text-foreground">
                      Codigo detectado o ingreso manual:
                    </div>
                    <Input
                      value={scannedCode || manualCode}
                      onChange={(event) => {
                        setScannedCode("");
                        setManualCode(event.target.value);
                      }}
                      placeholder="Ej: EQ-PRENSA-04 o https://.../equipo/EQ-PRENSA-04"
                      className="h-10 border-border/80 bg-[#111214] font-mono text-[13px]"
                    />
                    {scannedCode && (
                      <div className="mt-2 flex items-center gap-1.5 text-[12px] text-[#A8B1FF]">
                        <Check className="h-3.5 w-3.5" />
                        QR leido correctamente
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["1", "Abrir escaner", "Tocar el boton en este panel."],
                ["2", "Ir al equipo", "Apuntar al QR de la etiqueta."],
                ["3", "Completar alta", "Confirmar tipo, estacion y nombre."],
              ].map(([number, title, description]) => (
                <div
                  key={number}
                  className="rounded-md border border-border/70 bg-card/60 p-3 text-[12.5px]"
                >
                  <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-md bg-[#5E6AD2] text-[12px] font-semibold text-white">
                    {number}
                  </div>
                  <div className="font-medium text-foreground">{title}</div>
                  <div className="mt-1 leading-relaxed text-muted-foreground">{description}</div>
                </div>
              ))}
            </div>

            <DialogFooter className="mt-6 items-center gap-3 sm:justify-between">
              <div className="text-[12px] text-muted-foreground">
                El alta queda pendiente hasta guardar el formulario de Dispositivos.
              </div>
              <Button
                type="button"
                onClick={openCreateFromQr}
                disabled={!qrValue}
                className="bg-[#5E6AD2] text-white hover:bg-[#6875E8]"
              >
                Registrar equipo
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function equipmentCodeFromQr(rawValue: string) {
  const raw = rawValue.trim();
  try {
    const url = new URL(raw);
    const fromQuery =
      url.searchParams.get("codigo") ??
      url.searchParams.get("equipo") ??
      url.searchParams.get("device") ??
      url.searchParams.get("code") ??
      url.searchParams.get("id");
    const fromPath = url.pathname.split("/").filter(Boolean).at(-1);
    return normalizeEquipmentCode(fromQuery ?? fromPath ?? raw);
  } catch {
    return normalizeEquipmentCode(raw);
  }
}

function normalizeEquipmentCode(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_.-]/g, "-")
    .toUpperCase()
    .slice(0, 48);
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
    const current = String(value ?? "");
    const placeholder = field.placeholder ?? `Seleccionar ${field.label.toLowerCase()}`;
    return (
      <Select value={current} onValueChange={(next) => onChange(next === SELECT_NONE ? "" : next)}>
        <SelectTrigger id={id} className="linear-form-select-trigger">
          <SelectValue placeholder={placeholder} />
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
