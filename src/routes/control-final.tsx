import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  CheckCircle2,
  Clock,
  FileSearch,
  History,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from "react";

import { Button } from "@/components/ui/button";
import { RfidScanModal } from "@/components/hmi/RfidScanModal";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/control-final")({
  component: FinalControlRoute,
});

type FinalControlStatus = "accepted" | "rejected";
type ThemeMode = "dark" | "light";

type FinalControlTire = {
  id: string;
  code: string;
  number: string;
  model: string;
  vulcanizedAt: string;
};

type ShiftRecord = {
  id: string;
  tireCode: string;
  tireNumber: string;
  model: string;
  vulcanizedAt: string;
  inspectedAt: string;
  status: FinalControlStatus;
  observation: string;
  rejectionReasons: string[];
};

const finalControlTires: FinalControlTire[] = [
  {
    id: "tire-014",
    code: "NEU-260805-014",
    number: "014",
    model: "205/55 R16 Carrera Urbana",
    vulcanizedAt: "2026-08-05T06:42:00",
  },
  {
    id: "tire-015",
    code: "NEU-260805-015",
    number: "015",
    model: "195/65 R15 Carrera Plus",
    vulcanizedAt: "2026-08-05T07:18:00",
  },
  {
    id: "tire-016",
    code: "NEU-260805-016",
    number: "016",
    model: "215/60 R16 Ruta Reforzada",
    vulcanizedAt: "2026-08-05T07:46:00",
  },
  {
    id: "tire-017",
    code: "NEU-260805-017",
    number: "017",
    model: "225/45 R17 Sport",
    vulcanizedAt: "2026-08-05T08:21:00",
  },
];

const initialShiftHistory: ShiftRecord[] = [
  {
    id: "shift-012",
    tireCode: "NEU-260805-012",
    tireNumber: "012",
    model: "205/55 R16 Carrera Urbana",
    vulcanizedAt: "2026-08-05T06:05:00",
    inspectedAt: "2026-08-05T08:48:00",
    status: "accepted",
    observation: "Control visual sin observaciones.",
    rejectionReasons: [],
  },
  {
    id: "shift-013",
    tireCode: "NEU-260805-013",
    tireNumber: "013",
    model: "195/65 R15 Carrera Plus",
    vulcanizedAt: "2026-08-05T06:24:00",
    inspectedAt: "2026-08-05T08:56:00",
    status: "rejected",
    observation: "Motivos frecuentes: Marcado ilegible",
    rejectionReasons: ["Marcado ilegible"],
  },
];

const frequentRejectionReasons = [
  "Banda descentrada",
  "Corte lateral",
  "Burbuja o ampolla",
  "Falta de material",
  "Marcado ilegible",
  "Despegue visible",
  "Medida fuera de especificacion",
  "Terminacion irregular",
];

const THEME_STORAGE_KEY = "na-carrera-control-final-theme";

function getStoredTheme() {
  if (typeof window === "undefined") return undefined;

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "light" || storedTheme === "dark" ? storedTheme : undefined;
}

function FinalControlRoute() {
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [scanQuery, setScanQuery] = useState("");
  const [lastScanAttempt, setLastScanAttempt] = useState("");
  const [currentTire, setCurrentTire] = useState<FinalControlTire | undefined>();
  const [authorizedOperator, setAuthorizedOperator] = useState<string | undefined>();
  const [observation, setObservation] = useState("");
  const [shiftHistory, setShiftHistory] = useState<ShiftRecord[]>(initialShiftHistory);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedRejectionReasons, setSelectedRejectionReasons] = useState<string[]>([]);

  const currentRecord = useMemo(
    () => shiftHistory.find((record) => record.tireCode === currentTire?.code),
    [currentTire, shiftHistory],
  );
  const totals = useMemo(() => getShiftTotals(shiftHistory), [shiftHistory]);
  const isAwaitingFinalAuth = !authorizedOperator;

  useEffect(() => {
    setTheme(getStoredTheme() ?? "dark");
    setIsThemeReady(true);
  }, []);

  useEffect(() => {
    if (!isThemeReady) return;

    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [isThemeReady, theme]);

  const scanTire = (value?: string) => {
    const nextQuery = normalizeScanCode(value ?? scanQuery);
    if (!nextQuery) return;

    const foundTire = findTireByCode(nextQuery);
    setScanQuery(nextQuery);
    setLastScanAttempt(nextQuery);
    setCurrentTire(foundTire);

    if (!foundTire) {
      setObservation("");
      return;
    }

    const previousRecord = shiftHistory.find((record) => record.tireCode === foundTire.code);
    setObservation(previousRecord?.observation ?? "");
  };

  const focusScanInput = useCallback(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scanInputRef.current?.focus();
        scanInputRef.current?.select();
      });
    });
  }, []);

  useEffect(() => {
    focusScanInput();
  }, [focusScanInput]);

  const prepareNextScan = useCallback(() => {
    setScanQuery("");
    setLastScanAttempt("");
    setCurrentTire(undefined);
    setObservation("");
    setSelectedRejectionReasons([]);
    focusScanInput();
  }, [focusScanInput]);

  const commitDecision = useCallback(
    (
      status: FinalControlStatus,
      rejectionReasons: string[] = [],
      observationOverride = observation,
    ) => {
      if (!currentTire) return false;

      const nextRecord: ShiftRecord = {
        id: `shift-${currentTire.id}-${Date.now()}`,
        tireCode: currentTire.code,
        tireNumber: currentTire.number,
        model: currentTire.model,
        vulcanizedAt: currentTire.vulcanizedAt,
        inspectedAt: new Date().toISOString(),
        status,
        observation: observationOverride.trim(),
        rejectionReasons,
      };

      setShiftHistory((records) => [
        nextRecord,
        ...records.filter((record) => record.tireCode !== currentTire.code),
      ]);

      return true;
    },
    [currentTire, observation],
  );

  const acceptTire = useCallback(() => {
    if (commitDecision("accepted")) {
      prepareNextScan();
    }
  }, [commitDecision, prepareNextScan]);

  const openRejectDialog = useCallback(() => {
    if (!currentTire) return;

    setSelectedRejectionReasons(currentRecord?.rejectionReasons ?? []);
    setIsRejectDialogOpen(true);
  }, [currentRecord, currentTire]);

  const confirmRejection = () => {
    const nextObservation = buildRejectedObservation(observation, selectedRejectionReasons);
    if (commitDecision("rejected", selectedRejectionReasons, nextObservation)) {
      setIsRejectDialogOpen(false);
      prepareNextScan();
    }
  };

  const toggleRejectionReason = (reason: string) => {
    setSelectedRejectionReasons((reasons) =>
      reasons.includes(reason)
        ? reasons.filter((currentReason) => currentReason !== reason)
        : [...reasons, reason],
    );
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  const handleFinalAuth = (operator: string) => {
    setAuthorizedOperator(operator);
    focusScanInput();
  };

  useEffect(() => {
    if (!currentTire || isRejectDialogOpen || isAwaitingFinalAuth) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isFinalControlShortcutBlocked(event.target)) return;

      const normalizedKey = event.key.toLowerCase();
      if (normalizedKey !== "a" && normalizedKey !== "r") return;

      event.preventDefault();

      if (normalizedKey === "a") {
        acceptTire();
        return;
      }

      openRejectDialog();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTire, isAwaitingFinalAuth, isRejectDialogOpen, acceptTire, openRejectDialog]);

  return (
    <section className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl items-center justify-center">
        <div className="flex min-h-[calc(100vh-2.5rem)] w-full flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-[0_24px_80px_rgb(15_23_42/0.1)] dark:shadow-2xl dark:shadow-black/35">
          <header className="border-b border-border/70 px-5 py-5 sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#5E6AD2] dark:text-[#A8B1FF]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Control final
                </div>
                <h1 className="text-[24px] font-semibold tracking-tight text-foreground sm:text-[28px]">
                  Nueva Revisión de Neumático
                </h1>
                <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
                  Escanea el neumatico, revisa modelo y fecha de vulcanizado, y registra el
                  resultado del control.
                </p>
              </div>

              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </header>

          <form
            className="flex flex-1 flex-col"
            autoComplete="off"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="flex-1 px-5 py-7 sm:px-8 lg:px-10">
              {isAwaitingFinalAuth ? (
                <LockedFinalControlStart />
              ) : (
                <div className="mx-auto grid max-w-6xl gap-6 lg:min-h-[640px] lg:grid-cols-2 lg:items-stretch">
                  <FinalControlPanel
                    scanInputRef={scanInputRef}
                    scanQuery={scanQuery}
                    lastScanAttempt={lastScanAttempt}
                    tire={currentTire}
                    currentRecord={currentRecord}
                    observation={observation}
                    onScanQueryChange={setScanQuery}
                    onScan={scanTire}
                    onObservationChange={setObservation}
                    onAccept={acceptTire}
                    onReject={openRejectDialog}
                  />

                  <ShiftHistoryPanel records={shiftHistory} totals={totals} />
                </div>
              )}
            </div>
          </form>

          <RfidScanModal
            open={isAwaitingFinalAuth}
            onAuth={handleFinalAuth}
            title="Control final"
            heading="Acerque su tarjeta NFC"
            helperText="Escanee la tarjeta o ingrese el codigo manualmente para habilitar la estacion."
            placeholder="Codigo de tarjeta..."
          />
        </div>
      </div>

      <RejectReasonDialog
        open={isRejectDialogOpen}
        tire={currentTire}
        selectedReasons={selectedRejectionReasons}
        onOpenChange={setIsRejectDialogOpen}
        onToggleReason={toggleRejectionReason}
        onConfirm={confirmRejection}
      />
    </section>
  );
}

function LockedFinalControlStart() {
  return <div className="mx-auto min-h-[640px] max-w-6xl" aria-hidden="true" />;
}

function ThemeToggle({ theme, onToggle }: { theme: ThemeMode; onToggle: () => void }) {
  const isLight = theme === "light";

  return (
    <button
      type="button"
      aria-label={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      aria-pressed={theme === "dark"}
      title={isLight ? "Modo claro" : "Modo oscuro"}
      onClick={onToggle}
      className="group inline-grid h-8 shrink-0 grid-cols-2 rounded-md border border-border/80 bg-background/70 p-0.5 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <span
        className={cn(
          "grid h-7 w-7 place-items-center rounded-[6px] transition-all",
          isLight
            ? "bg-card text-foreground shadow-[0_1px_2px_rgb(15_23_42/0.08)] ring-1 ring-border/70"
            : "text-muted-foreground/80 group-hover:text-foreground",
        )}
      >
        <Sun className="h-3.5 w-3.5" strokeWidth={1.8} />
      </span>
      <span
        className={cn(
          "grid h-7 w-7 place-items-center rounded-[6px] transition-all",
          !isLight
            ? "bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.28)] ring-1 ring-border/70"
            : "text-muted-foreground/80 group-hover:text-foreground",
        )}
      >
        <Moon className="h-3.5 w-3.5" strokeWidth={1.8} />
      </span>
    </button>
  );
}

function FinalControlPanel({
  scanInputRef,
  scanQuery,
  lastScanAttempt,
  tire,
  currentRecord,
  observation,
  onScanQueryChange,
  onScan,
  onObservationChange,
  onAccept,
  onReject,
}: {
  scanInputRef: RefObject<HTMLInputElement | null>;
  scanQuery: string;
  lastScanAttempt: string;
  tire?: FinalControlTire;
  currentRecord?: ShiftRecord;
  observation: string;
  onScanQueryChange: (value: string) => void;
  onScan: (value?: string) => void;
  onObservationChange: (value: string) => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border/80 bg-background/35 lg:min-h-[640px]">
      <div className="border-b border-border/70 px-4 py-4 sm:px-5">
        <FieldBlock id="neumatico-control-final" label="Escaneo de Neumático">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5E6AD2] dark:text-[#A8B1FF]" />
              <Input
                ref={scanInputRef}
                id="neumatico-control-final"
                value={scanQuery}
                onChange={(event) => onScanQueryChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onScan();
                  }
                }}
                placeholder="Ej: NEU-260805-014"
                autoComplete="off"
                className="reception-field h-11 pl-9 font-mono text-[13.5px]"
              />
            </div>
            <Button
              type="button"
              className="h-11 rounded-lg bg-[#5E6AD2] px-5 text-white hover:bg-[#6875E8] focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={() => onScan()}
            >
              Escanear
            </Button>
          </div>
        </FieldBlock>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
          Prueba con
          {finalControlTires.slice(0, 3).map((sampleTire) => (
            <button
              key={sampleTire.code}
              type="button"
              onClick={() => onScan(sampleTire.code)}
              className="rounded-md border border-border/70 bg-card px-2 py-0.5 font-mono text-[11.5px] text-foreground/90 transition-colors hover:bg-accent"
            >
              {sampleTire.code}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 py-6">
        <TireDataPanel
          tire={tire}
          lastScanAttempt={lastScanAttempt}
          currentRecord={currentRecord}
        />

        <div className="mt-6">
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              aria-label="Aceptar neumatico. Presiona A"
              className={cn(
                "h-20 w-full justify-between rounded-lg bg-emerald-500 px-5 text-white shadow-sm transition-all duration-150 hover:bg-emerald-400 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-0 [&_svg]:!h-[21px] [&_svg]:!w-[21px]",
                currentRecord?.status === "accepted" &&
                  "shadow-[inset_0_0_0_2px_rgb(4_120_87/0.45)] dark:shadow-[inset_0_0_0_2px_rgb(16_185_129/0.45)]",
              )}
              disabled={!tire}
              onClick={onAccept}
              title="Aceptar neumatico"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Check strokeWidth={2.5} />
                <span className="truncate text-[15px] font-semibold tracking-normal">Aceptar</span>
              </span>
              <ShortcutKey tone="accepted">A</ShortcutKey>
            </Button>
            <Button
              type="button"
              aria-label="Rechazar neumatico. Presiona R"
              className={cn(
                "h-20 w-full justify-between rounded-lg bg-red-500 px-5 text-white shadow-sm transition-all duration-150 hover:bg-red-400 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-0 [&_svg]:!h-[21px] [&_svg]:!w-[21px]",
                currentRecord?.status === "rejected" &&
                  "shadow-[inset_0_0_0_2px_rgb(185_28_28/0.45)] dark:shadow-[inset_0_0_0_2px_rgb(248_113_113/0.45)]",
              )}
              disabled={!tire}
              onClick={onReject}
              title="Rechazar neumatico"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <XCircle strokeWidth={2.5} />
                <span className="truncate text-[15px] font-semibold tracking-normal">Rechazar</span>
              </span>
              <ShortcutKey tone="rejected">R</ShortcutKey>
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <Label
            htmlFor="observaciones-control-final"
            className="text-[12px] font-semibold text-muted-foreground"
          >
            Observaciones
          </Label>
          <Textarea
            id="observaciones-control-final"
            value={observation}
            onChange={(event) => onObservationChange(event.target.value)}
            placeholder="Observaciones del control"
            disabled={!tire}
            className="reception-field mt-2 min-h-32 resize-none text-[13px]"
          />
        </div>
      </div>
    </section>
  );
}

function TireDataPanel({
  tire,
  lastScanAttempt,
  currentRecord,
}: {
  tire?: FinalControlTire;
  lastScanAttempt: string;
  currentRecord?: ShiftRecord;
}) {
  if (!lastScanAttempt) {
    return (
      <EmptyFinalControlState
        icon={FileSearch}
        title="Sin neumatico escaneado"
        message="Escanea el codigo del neumatico para cargar sus datos de vulcanizado."
      />
    );
  }

  if (!tire) {
    return (
      <EmptyFinalControlState
        icon={FileSearch}
        title="Neumatico no encontrado"
        message={`No hay datos cargados para ${lastScanAttempt}. Verifica el codigo escaneado.`}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-card/65">
      <div className="border-b border-border/70 px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Neumatico
            </div>
            <div className="mt-1 font-mono text-[22px] font-semibold tracking-tight text-foreground">
              {tire.code}
            </div>
          </div>
          <StatusBadge status={currentRecord?.status} />
        </div>
      </div>

      <div className="grid gap-4 px-4 py-4 sm:grid-cols-2">
        <DataItem label="Modelo" value={tire.model} />
        <DataItem label="Fecha de vulcanizado" value={formatDateTime(tire.vulcanizedAt)} mono />
      </div>
    </div>
  );
}

function ShiftHistoryPanel({
  records,
  totals,
}: {
  records: ShiftRecord[];
  totals: Record<FinalControlStatus, number>;
}) {
  return (
    <aside className="flex min-w-0 lg:min-h-[640px]">
      <div className="flex w-full flex-col overflow-hidden rounded-lg border border-border/80 bg-background/35 lg:min-h-[640px]">
        <div className="border-b border-border/70 px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-foreground">
              <History className="h-4 w-4 shrink-0 text-[#5E6AD2] dark:text-[#A8B1FF]" />
              Historial del turno
            </div>
            <div className="flex items-center gap-2 text-[11.5px]">
              <span className="inline-flex h-7 min-w-[64px] items-center justify-center whitespace-nowrap rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 font-medium leading-none text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/12 dark:text-emerald-200">
                {totals.accepted} OK
              </span>
              <span className="inline-flex h-7 min-w-[64px] items-center justify-center whitespace-nowrap rounded-md border border-red-500/30 bg-red-500/10 px-2.5 font-medium leading-none text-red-700 dark:border-red-400/50 dark:bg-red-400/14 dark:text-red-200">
                {totals.rejected} Rech.
              </span>
            </div>
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Numero de neumatico, hora y estado registrado.
          </p>
        </div>

        {records.length > 0 ? (
          <div className="linear-scrollbar linear-scrollbar-both-edges min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <div className="space-y-2">
              {records.map((record) => (
                <HistoryRow key={record.id} record={record} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 p-4">
            <EmptyFinalControlState
              icon={Clock}
              title="Sin controles en el turno"
              message="Los neumaticos aceptados o rechazados apareceran aca."
              className="flex-1"
            />
          </div>
        )}
      </div>
    </aside>
  );
}

function HistoryRow({ record }: { record: ShiftRecord }) {
  return (
    <div className="rounded-lg border border-border/80 bg-card/65 px-4 py-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_224px] sm:items-center">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="font-mono text-[13.5px] font-semibold text-foreground">
              {record.tireCode}
            </span>
          </div>
          <div className="mt-1 truncate text-[12px] text-muted-foreground">{record.model}</div>
        </div>

        <div className="grid w-full grid-cols-[112px_100px] items-center gap-3 sm:w-[224px] sm:justify-self-end">
          <span className="flex w-[112px] items-center justify-end gap-1 font-mono text-[12px] text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">{formatClockTime(record.inspectedAt)}</span>
          </span>
          <StatusBadge status={record.status} compact className="w-[100px] justify-center" />
        </div>
      </div>
    </div>
  );
}

function RejectReasonDialog({
  open,
  tire,
  selectedReasons,
  onOpenChange,
  onToggleReason,
  onConfirm,
}: {
  open: boolean;
  tire?: FinalControlTire;
  selectedReasons: string[];
  onOpenChange: (open: boolean) => void;
  onToggleReason: (reason: string) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-border/80 bg-card p-0 shadow-[0_24px_80px_rgb(15_23_42/0.16)] dark:shadow-2xl dark:shadow-black/40">
        <div className="border-b border-border/70 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-[18px]">Motivos frecuentes de rechazo</DialogTitle>
            <DialogDescription>
              {tire
                ? `Selecciona uno o mas motivos para rechazar el neumatico ${tire.code}.`
                : "Selecciona uno o mas motivos de rechazo."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-2 px-6 py-5 sm:grid-cols-2">
          {frequentRejectionReasons.map((reason) => {
            const selected = selectedReasons.includes(reason);

            return (
              <button
                key={reason}
                type="button"
                onClick={() => onToggleReason(reason)}
                className={cn(
                  "min-h-12 rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  selected
                    ? "border-red-500/40 bg-red-500/10 text-red-700 dark:border-red-300/80 dark:bg-red-400/18 dark:text-red-100"
                    : "border-border/80 bg-background/45 text-foreground hover:border-red-500/30 hover:bg-red-500/10 dark:hover:border-red-300/60 dark:hover:bg-red-400/10",
                )}
              >
                {reason}
              </button>
            );
          })}
        </div>

        <DialogFooter className="border-t border-border/70 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="h-10 border-border/80 bg-background/55 focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="h-10 bg-red-500 text-white hover:bg-red-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={onConfirm}
          >
            <XCircle className="h-4 w-4" />
            Rechazar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutKey({ children, tone }: { children: ReactNode; tone: FinalControlStatus }) {
  return (
    <kbd
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded border px-2 py-0.5 font-mono text-[11px] font-semibold leading-none no-underline shadow-none",
        tone === "accepted" && "border-emerald-300/30 bg-emerald-700/55 text-emerald-50",
        tone === "rejected" && "border-red-300/30 bg-red-700/55 text-red-50",
      )}
    >
      [{children}]
    </kbd>
  );
}

function FieldBlock({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <Label
        htmlFor={id}
        className="text-[13px] font-semibold uppercase tracking-[0.04em] text-foreground"
      >
        {label}
      </Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function DataItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 min-w-0 text-[14px] font-medium text-foreground",
          mono && "font-mono text-[13px]",
        )}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyFinalControlState({
  icon: Icon,
  title,
  message,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-background/25 px-4 py-10 text-center",
        className,
      )}
    >
      <Icon className="mx-auto h-7 w-7 text-[#5E6AD2] dark:text-[#A8B1FF]" />
      <div className="mt-4 text-[14px] font-semibold text-foreground">{title}</div>
      <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
  compact,
  className,
}: {
  status?: FinalControlStatus;
  compact?: boolean;
  className?: string;
}) {
  if (status === "accepted") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:border-emerald-400/50 dark:bg-emerald-400/12 dark:text-emerald-200",
          compact ? "text-[10.5px]" : "text-[11px]",
          className,
        )}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Aprobado
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 font-medium text-red-700 dark:border-red-400/60 dark:bg-red-400/14 dark:text-red-200",
          compact ? "text-[10.5px]" : "text-[11px]",
          className,
        )}
      >
        <XCircle className="h-3.5 w-3.5" />
        Rechazado
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border/80 bg-background/40 px-2 py-0.5 font-medium text-muted-foreground",
        compact ? "text-[10.5px]" : "text-[11px]",
        className,
      )}
    >
      Pendiente
    </span>
  );
}

function findTireByCode(code: string) {
  const normalizedCode = normalizeScanCode(code);
  return finalControlTires.find((tire) => normalizeScanCode(tire.code) === normalizedCode);
}

function normalizeScanCode(value: string) {
  return value.trim().replace(/\s+/g, "-").toUpperCase();
}

function buildRejectedObservation(observation: string, reasons: string[]) {
  const baseObservation = observation.trim();
  if (reasons.length === 0) return baseObservation;

  const reasonsText = `Motivos frecuentes: ${reasons.join(", ")}`;
  if (!baseObservation) return reasonsText;
  if (baseObservation.includes(reasonsText)) return baseObservation;

  return `${baseObservation}\n${reasonsText}`;
}

function isFinalControlShortcutBlocked(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const tagName = target.tagName.toLowerCase();
  if (tagName === "textarea" || tagName === "select") return true;

  return tagName === "input" && target.id !== "neumatico-control-final";
}

function getShiftTotals(records: ShiftRecord[]) {
  return records.reduce(
    (totals, record) => {
      totals[record.status] += 1;
      return totals;
    },
    { accepted: 0, rejected: 0 } satisfies Record<FinalControlStatus, number>,
  );
}

function formatDateTime(value: string) {
  const [datePart, timePart = ""] = value.split("T");
  const [year, month, day] = datePart.split("-");
  const [hour = "", minute = ""] = timePart.split(":");
  if (!year || !month || !day || !hour || !minute) return value;

  return `${day}/${month}/${year} ${hour}:${minute}`;
}

function formatClockTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
