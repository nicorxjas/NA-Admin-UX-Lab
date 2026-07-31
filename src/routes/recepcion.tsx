import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Boxes,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  Info,
  Layers3,
  Plus,
  ScanLine,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RfidScanModal } from "@/components/hmi/RfidScanModal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recepcion")({
  component: ReceptionRoute,
});

const steps = [
  { number: 1, label: "Paso 1", title: "Ingreso", icon: FileText },
  { number: 2, label: "Paso 2", title: "Trazabilidad", icon: ScanLine },
  { number: 3, label: "Paso 3", title: "Confirmar", icon: ShieldCheck },
];

const materials = [
  {
    code: "2006/1",
    provider: "Química del Sur",
    traceability: ["Lote", "Palet", "Batch"],
  },
  {
    code: "2008/1",
    provider: "Química del Sur",
    traceability: ["Lote", "Palet", "Batch"],
  },
];

const remitoExample = "R-0087421";

type Material = (typeof materials)[number];

type TracePalet = {
  id: string;
  code: string;
  batches: string[];
  expanded: boolean;
};

type TraceLot = {
  id: string;
  code: string;
  palets: TracePalet[];
  expanded: boolean;
};

type ReceiptMaterial = {
  id: string;
  materialCode: string;
  lots: TraceLot[];
  expanded: boolean;
};

function ReceptionRoute() {
  const [activeStep, setActiveStep] = useState(1);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isEntryUnlocked, setIsEntryUnlocked] = useState(false);
  const [remito, setRemito] = useState("");
  const [receptionDate, setReceptionDate] = useState("");
  const [receiptMaterials, setReceiptMaterials] = useState<ReceiptMaterial[]>([]);
  const receptionProvider = getReceiptProviderLabel(receiptMaterials);
  const isAwaitingEntryAuth = !isConfirmed && !isEntryUnlocked;
  const canContinue =
    (activeStep === 1 && Boolean(remito.trim() && receptionDate)) ||
    (activeStep === 2 && receiptMaterials.length > 0) ||
    activeStep === 3;

  const addReceiptMaterial = (materialCode: string) => {
    const material = materials.find((item) => item.code === materialCode);
    if (!material) return false;

    if (receiptMaterials.some((entry) => entry.materialCode === material.code)) {
      return false;
    }

    setReceiptMaterials((current) => [
      ...current.map((entry) => ({ ...entry, expanded: false })),
      {
        id: `material-${material.code}-${Date.now()}`,
        materialCode: material.code,
        lots: [],
        expanded: true,
      },
    ]);
    return true;
  };

  const removeReceiptMaterial = (receiptMaterialId: string) => {
    setReceiptMaterials((current) => current.filter((entry) => entry.id !== receiptMaterialId));
  };

  const toggleReceiptMaterial = (receiptMaterialId: string) => {
    setReceiptMaterials((current) =>
      current.map((entry) =>
        entry.id === receiptMaterialId ? { ...entry, expanded: !entry.expanded } : entry,
      ),
    );
  };

  const addLot = (receiptMaterialId: string, value: string) => {
    const code = normalizeTraceCode(value);
    if (!code) return false;

    const receiptMaterial = receiptMaterials.find((entry) => entry.id === receiptMaterialId);
    if (!receiptMaterial) return false;

    if (receiptMaterial.lots.some((lot) => lot.code.toLowerCase() === code.toLowerCase())) {
      return false;
    }

    setReceiptMaterials((current) =>
      current.map((entry) =>
        entry.id === receiptMaterialId
          ? {
              ...entry,
              lots: [
                ...entry.lots.map((lot) => ({ ...lot, expanded: false })),
                {
                  id: `lot-${code}-${Date.now()}`,
                  code,
                  palets: [],
                  expanded: true,
                },
              ],
            }
          : entry,
      ),
    );
    return true;
  };

  const removeLot = (receiptMaterialId: string, lotId: string) => {
    setReceiptMaterials((current) =>
      current.map((entry) =>
        entry.id === receiptMaterialId
          ? { ...entry, lots: entry.lots.filter((lot) => lot.id !== lotId) }
          : entry,
      ),
    );
  };

  const toggleLot = (receiptMaterialId: string, lotId: string) => {
    setReceiptMaterials((current) =>
      current.map((entry) =>
        entry.id === receiptMaterialId
          ? {
              ...entry,
              lots: entry.lots.map((lot) =>
                lot.id === lotId ? { ...lot, expanded: !lot.expanded } : lot,
              ),
            }
          : entry,
      ),
    );
  };

  const addPalet = (receiptMaterialId: string, lotId: string, value: string) => {
    const code = normalizeTraceCode(value);
    if (!code) return false;

    const receiptMaterial = receiptMaterials.find((entry) => entry.id === receiptMaterialId);
    const targetLot = receiptMaterial?.lots.find((lot) => lot.id === lotId);
    if (!targetLot) return false;

    if (targetLot.palets.some((palet) => palet.code.toLowerCase() === code.toLowerCase())) {
      return false;
    }

    setReceiptMaterials((current) =>
      current.map((entry) =>
        entry.id === receiptMaterialId
          ? {
              ...entry,
              lots: entry.lots.map((lot) =>
                lot.id === lotId
                  ? {
                      ...lot,
                      palets: [
                        ...lot.palets.map((palet) => ({ ...palet, expanded: false })),
                        {
                          id: `palet-${code}-${Date.now()}`,
                          code,
                          batches: [],
                          expanded: true,
                        },
                      ],
                    }
                  : lot,
              ),
            }
          : entry,
      ),
    );
    return true;
  };

  const removePalet = (receiptMaterialId: string, lotId: string, paletId: string) => {
    setReceiptMaterials((current) =>
      current.map((entry) =>
        entry.id === receiptMaterialId
          ? {
              ...entry,
              lots: entry.lots.map((lot) =>
                lot.id === lotId
                  ? { ...lot, palets: lot.palets.filter((palet) => palet.id !== paletId) }
                  : lot,
              ),
            }
          : entry,
      ),
    );
  };

  const togglePalet = (receiptMaterialId: string, lotId: string, paletId: string) => {
    setReceiptMaterials((current) =>
      current.map((entry) =>
        entry.id === receiptMaterialId
          ? {
              ...entry,
              lots: entry.lots.map((lot) =>
                lot.id === lotId
                  ? {
                      ...lot,
                      palets: lot.palets.map((palet) =>
                        palet.id === paletId ? { ...palet, expanded: !palet.expanded } : palet,
                      ),
                    }
                  : lot,
              ),
            }
          : entry,
      ),
    );
  };

  const addBatchRange = (
    receiptMaterialId: string,
    lotId: string,
    paletId: string,
    from: string,
    to: string,
  ) => {
    const range = createBatchRange(from, to);
    if (range.length === 0) return false;

    setReceiptMaterials((current) =>
      current.map((entry) =>
        entry.id === receiptMaterialId
          ? {
              ...entry,
              lots: entry.lots.map((lot) =>
                lot.id === lotId
                  ? {
                      ...lot,
                      palets: lot.palets.map((palet) =>
                        palet.id === paletId
                          ? { ...palet, batches: mergeBatches(palet.batches, range) }
                          : palet,
                      ),
                    }
                  : lot,
              ),
            }
          : entry,
      ),
    );
    return true;
  };

  const resetReception = () => {
    setIsConfirmed(false);
    setActiveStep(1);
    setRemito("");
    setReceptionDate("");
    setReceiptMaterials([]);
  };

  const lockReceptionStart = () => {
    resetReception();
    setIsEntryUnlocked(false);
  };

  const handlePrimaryAction = () => {
    if (!canContinue) return;

    if (activeStep === 1) {
      setRemito(remito.trim());
    }

    if (activeStep < 3) {
      setActiveStep((current) => current + 1);
      return;
    }

    setIsConfirmed(true);
  };

  const handleEntryAuth = () => {
    setIsEntryUnlocked(true);
  };

  return (
    <section className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl items-center justify-center">
        <div className="flex min-h-[calc(100vh-2.5rem)] w-full flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-2xl shadow-black/35">
          <header className="border-b border-border/70 px-5 py-5 sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#A8B1FF]">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Recepción
                </div>
                <h1 className="text-[24px] font-semibold tracking-tight text-foreground sm:text-[28px]">
                  {isConfirmed ? "Ingreso registrado" : "Nuevo ingreso de material"}
                </h1>
                <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
                  {isConfirmed
                    ? "Los materiales quedan pendientes de aprobación de Calidad."
                    : activeStep === 1 &&
                      "Cargá remito y fecha; después agregás los materiales incluidos."}
                  {!isConfirmed &&
                    activeStep === 2 &&
                    "Agregá materiales y cargá la trazabilidad de cada uno."}
                  {!isConfirmed &&
                    activeStep === 3 &&
                    "Revisá el resumen antes de confirmar el ingreso."}
                </p>
              </div>

              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                title="Cerrar"
              >
                <Link to="/">
                  <X className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {!isConfirmed && !isAwaitingEntryAuth ? (
              <ol className="linear-scrollbar mt-7 flex w-full items-center overflow-x-auto pb-1">
                {steps.map((step, index) => (
                  <StepItem
                    key={step.number}
                    step={step}
                    activeStep={activeStep}
                    showLine={index < steps.length - 1}
                  />
                ))}
              </ol>
            ) : null}
          </header>

          <form
            className="flex flex-1 flex-col"
            autoComplete="off"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="min-h-[390px] flex-1 px-5 py-7 sm:px-8 lg:px-12">
              {isConfirmed ? (
                <ConfirmedStep
                  remito={remito}
                  provider={receptionProvider}
                  receiptMaterials={receiptMaterials}
                  onFinishTurn={lockReceptionStart}
                  onRegisterAnotherRequest={resetReception}
                />
              ) : isAwaitingEntryAuth ? (
                <LockedReceptionStart />
              ) : (
                <>
                  {activeStep === 1 && (
                    <ReceptionDetailsStep
                      remito={remito}
                      receptionDate={receptionDate}
                      onRemitoChange={setRemito}
                      onReceptionDateChange={setReceptionDate}
                    />
                  )}
                  {activeStep === 2 && (
                    <TraceabilityStep
                      remito={remito}
                      provider={receptionProvider}
                      receiptMaterials={receiptMaterials}
                      onAddReceiptMaterial={addReceiptMaterial}
                      onRemoveReceiptMaterial={removeReceiptMaterial}
                      onToggleReceiptMaterial={toggleReceiptMaterial}
                      onAddLot={addLot}
                      onRemoveLot={removeLot}
                      onToggleLot={toggleLot}
                      onAddPalet={addPalet}
                      onRemovePalet={removePalet}
                      onTogglePalet={togglePalet}
                      onAddBatchRange={addBatchRange}
                    />
                  )}
                  {activeStep === 3 && (
                    <ConfirmStep
                      remito={remito}
                      provider={receptionProvider}
                      receiptMaterials={receiptMaterials}
                    />
                  )}
                </>
              )}
            </div>

            {!isConfirmed && !isAwaitingEntryAuth ? (
              <footer className="border-t border-border/70 bg-background/35 px-5 py-4 sm:px-8">
                <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="order-2 flex justify-center sm:order-1 sm:justify-start">
                    {activeStep === 1 ? (
                      <Button
                        asChild
                        variant="ghost"
                        className="justify-center text-foreground hover:bg-accent/70 sm:justify-start"
                      >
                        <Link to="/">Cancelar</Link>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        className="justify-center text-foreground hover:bg-accent/70 sm:justify-start"
                        onClick={() => setActiveStep((current) => Math.max(1, current - 1))}
                      >
                        Volver
                      </Button>
                    )}
                  </div>

                  <div className="order-1 flex justify-center sm:order-2 sm:justify-end">
                    <Button
                      type="button"
                      className="h-10 bg-[#5E6AD2] px-5 text-white hover:bg-[#6875E8]"
                      onClick={handlePrimaryAction}
                      disabled={!canContinue}
                    >
                      {activeStep === 3 ? "Confirmar" : "Continuar"}
                      {activeStep === 3 ? <ShieldCheck className="h-4 w-4" /> : null}
                    </Button>
                  </div>
                </div>
              </footer>
            ) : null}
          </form>

          <RfidScanModal open={isAwaitingEntryAuth} onAuth={handleEntryAuth} />
        </div>
      </div>
    </section>
  );
}

function ReceptionDetailsStep({
  remito,
  receptionDate,
  onRemitoChange,
  onReceptionDateChange,
}: {
  remito: string;
  receptionDate: string;
  onRemitoChange: (value: string) => void;
  onReceptionDateChange: (value: string) => void;
}) {
  return (
    <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
      <FieldBlock id="remito" label="N° de remito" required>
        <Input
          id="remito"
          value={remito}
          onChange={(event) => onRemitoChange(event.target.value)}
          placeholder={`Ej: ${remitoExample}`}
          autoComplete="off"
          className="reception-field h-11 font-mono text-[13.5px]"
        />
      </FieldBlock>

      <FieldBlock id="fecha-recepcion" label="Fecha de recepción" required>
        <DateInput
          id="fecha-recepcion"
          value={receptionDate}
          onChange={onReceptionDateChange}
          placeholder="Seleccionar fecha de recepción"
          triggerBaseClassName="reception-date-trigger"
          triggerClassName="h-11 text-[13.5px]"
          iconClassName="h-4 w-4 text-[#A8B1FF]"
          calendarClassName="reception-calendar-surface"
        />
      </FieldBlock>

      <div className="rounded-lg border border-[#5E6AD2]/45 bg-[#5E6AD2]/10 p-5 md:col-span-2">
        <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-foreground">
          <Info className="h-4 w-4 text-[#A8B1FF]" />
          Materiales del remito
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
          En el próximo paso vas a agregar uno o más materiales del remito y cargar la trazabilidad
          de cada uno.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {["Material", "Lote", "Palet", "Batch"].map((level, index, levels) => (
            <div key={level} className="flex items-center gap-2">
              <span className="rounded-md border border-[#5E6AD2]/55 bg-background/50 px-3 py-1.5 text-[13px] font-semibold text-foreground">
                {level}
              </span>
              {index < levels.length - 1 && <ChevronRight className="h-4 w-4 text-[#A8B1FF]" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TraceabilityStep({
  remito,
  provider,
  receiptMaterials,
  onAddReceiptMaterial,
  onRemoveReceiptMaterial,
  onToggleReceiptMaterial,
  onAddLot,
  onRemoveLot,
  onToggleLot,
  onAddPalet,
  onRemovePalet,
  onTogglePalet,
  onAddBatchRange,
}: {
  remito: string;
  provider: string;
  receiptMaterials: ReceiptMaterial[];
  onAddReceiptMaterial: (materialCode: string) => boolean;
  onRemoveReceiptMaterial: (receiptMaterialId: string) => void;
  onToggleReceiptMaterial: (receiptMaterialId: string) => void;
  onAddLot: (receiptMaterialId: string, value: string) => boolean;
  onRemoveLot: (receiptMaterialId: string, lotId: string) => void;
  onToggleLot: (receiptMaterialId: string, lotId: string) => void;
  onAddPalet: (receiptMaterialId: string, lotId: string, value: string) => boolean;
  onRemovePalet: (receiptMaterialId: string, lotId: string, paletId: string) => void;
  onTogglePalet: (receiptMaterialId: string, lotId: string, paletId: string) => void;
  onAddBatchRange: (
    receiptMaterialId: string,
    lotId: string,
    paletId: string,
    from: string,
    to: string,
  ) => boolean;
}) {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-5">
        <MaterialsTraceabilityForm
          receiptMaterials={receiptMaterials}
          onAddReceiptMaterial={onAddReceiptMaterial}
          onRemoveReceiptMaterial={onRemoveReceiptMaterial}
          onToggleReceiptMaterial={onToggleReceiptMaterial}
          onAddLot={onAddLot}
          onRemoveLot={onRemoveLot}
          onToggleLot={onToggleLot}
          onAddPalet={onAddPalet}
          onRemovePalet={onRemovePalet}
          onTogglePalet={onTogglePalet}
          onAddBatchRange={onAddBatchRange}
        />
      </div>

      <LiveTraceabilityPanel
        remito={remito}
        provider={provider}
        receiptMaterials={receiptMaterials}
      />
    </div>
  );
}

function LockedReceptionStart() {
  return <div className="mx-auto min-h-[390px] max-w-4xl" aria-hidden="true" />;
}

function ConfirmedStep({
  remito,
  provider,
  receiptMaterials,
  onFinishTurn,
  onRegisterAnotherRequest,
}: {
  remito: string;
  provider: string;
  receiptMaterials: ReceiptMaterial[];
  onFinishTurn: () => void;
  onRegisterAnotherRequest: () => void;
}) {
  const totalLots = getReceiptTotalLots(receiptMaterials);
  const totalBatches = getReceiptTotalBatches(receiptMaterials);
  const totalPalets = getReceiptTotalPalets(receiptMaterials);
  const displayRemito = remito.trim() || "Sin remito";
  const displayProvider = provider || "Sin proveedor";
  const traceSummary =
    totalLots === 0
      ? `${receiptMaterials.length} ${pluralize(
          receiptMaterials.length,
          "material",
          "materiales",
        )} sin lotes cargados`
      : `${receiptMaterials.length} ${pluralize(
          receiptMaterials.length,
          "material",
          "materiales",
        )}, ${totalLots} ${pluralize(totalLots, "lote", "lotes")} registrados`;

  return (
    <div className="mx-auto flex min-h-[520px] max-w-3xl flex-col items-center justify-center py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#5E6AD2]/45 bg-[#5E6AD2]/10">
        <CheckCircle2 className="h-8 w-8 text-[#A8B1FF]" strokeWidth={1.8} />
      </div>

      <h2 className="mt-7 text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px]">
        Ingreso registrado
      </h2>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
        Remito <span className="font-semibold text-foreground">{displayRemito}</span> · Proveedor{" "}
        <span className="font-medium text-foreground">{displayProvider}</span>.
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground/90">{traceSummary}</span> pendiente de
        aprobación de Calidad.
      </p>

      <div className="mt-8 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        <LiveMetric label="Materiales" value={String(receiptMaterials.length)} />
        <LiveMetric label="Lotes" value={String(totalLots)} />
        <LiveMetric label="Palets" value={String(totalPalets)} />
        <LiveMetric label="Batches" value={String(totalBatches)} />
      </div>

      <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <Button type="button" variant="secondary" className="h-10 flex-1" onClick={onFinishTurn}>
          Finalizar turno
        </Button>
        <Button
          type="button"
          className="h-10 flex-1 bg-[#5E6AD2] text-white hover:bg-[#6875E8]"
          onClick={onRegisterAnotherRequest}
        >
          Registrar otro ingreso
        </Button>
      </div>
    </div>
  );
}

function ConfirmStep({
  remito,
  provider,
  receiptMaterials,
}: {
  remito: string;
  provider: string;
  receiptMaterials: ReceiptMaterial[];
}) {
  const displayRemito = remito.trim() || "Sin remito";
  const displayProvider = provider || "Sin proveedor";

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="rounded-lg border border-[#5E6AD2]/45 bg-[#5E6AD2]/10 p-5">
        <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-foreground">
          <ShieldCheck className="h-4 w-4 text-[#A8B1FF]" />
          Resumen del ingreso
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          Revisá remito, proveedor, materiales y trazabilidad antes de confirmar la recepción.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <MaterialMeta label="Remito" value={displayRemito} mono />
        <MaterialMeta label="Proveedor" value={displayProvider} />
        <MaterialMeta label="Materiales" value={String(receiptMaterials.length)} />
      </div>

      <section className="rounded-lg border border-border/80 bg-background/35 p-5">
        <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-foreground">
          <Boxes className="h-4 w-4 text-[#A8B1FF]" />
          Trazabilidad
        </div>

        <MaterialsTraceabilitySummary receiptMaterials={receiptMaterials} />
      </section>
    </div>
  );
}

function MaterialsTraceabilityForm({
  receiptMaterials,
  onAddReceiptMaterial,
  onRemoveReceiptMaterial,
  onToggleReceiptMaterial,
  onAddLot,
  onRemoveLot,
  onToggleLot,
  onAddPalet,
  onRemovePalet,
  onTogglePalet,
  onAddBatchRange,
}: {
  receiptMaterials: ReceiptMaterial[];
  onAddReceiptMaterial: (materialCode: string) => boolean;
  onRemoveReceiptMaterial: (receiptMaterialId: string) => void;
  onToggleReceiptMaterial: (receiptMaterialId: string) => void;
  onAddLot: (receiptMaterialId: string, value: string) => boolean;
  onRemoveLot: (receiptMaterialId: string, lotId: string) => void;
  onToggleLot: (receiptMaterialId: string, lotId: string) => void;
  onAddPalet: (receiptMaterialId: string, lotId: string, value: string) => boolean;
  onRemovePalet: (receiptMaterialId: string, lotId: string, paletId: string) => void;
  onTogglePalet: (receiptMaterialId: string, lotId: string, paletId: string) => void;
  onAddBatchRange: (
    receiptMaterialId: string,
    lotId: string,
    paletId: string,
    from: string,
    to: string,
  ) => boolean;
}) {
  const [newMaterialCode, setNewMaterialCode] = useState("");
  const availableMaterials = materials.filter(
    (material) => !receiptMaterials.some((entry) => entry.materialCode === material.code),
  );
  const canAddMaterial = Boolean(newMaterialCode && availableMaterials.length > 0);

  const addMaterial = () => {
    const wasAdded = onAddReceiptMaterial(newMaterialCode);
    if (!wasAdded) return;

    setNewMaterialCode("");
  };

  return (
    <section className="space-y-5">
      <div className="min-w-0">
        <div className="text-[19px] font-semibold tracking-tight text-foreground sm:text-[21px]">
          Materiales del Remito
        </div>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
          Agregá cada material con sus lotes, palets y batches correspondientes.
        </p>
      </div>

      <div className="space-y-4">
        {receiptMaterials.map((receiptMaterial) => (
          <ReceiptMaterialTraceCard
            key={receiptMaterial.id}
            receiptMaterial={receiptMaterial}
            onRemove={() => onRemoveReceiptMaterial(receiptMaterial.id)}
            onToggle={() => onToggleReceiptMaterial(receiptMaterial.id)}
            onAddLot={(value) => onAddLot(receiptMaterial.id, value)}
            onRemoveLot={(lotId) => onRemoveLot(receiptMaterial.id, lotId)}
            onToggleLot={(lotId) => onToggleLot(receiptMaterial.id, lotId)}
            onAddPalet={(lotId, value) => onAddPalet(receiptMaterial.id, lotId, value)}
            onRemovePalet={(lotId, paletId) => onRemovePalet(receiptMaterial.id, lotId, paletId)}
            onTogglePalet={(lotId, paletId) => onTogglePalet(receiptMaterial.id, lotId, paletId)}
            onAddBatchRange={(lotId, paletId, from, to) =>
              onAddBatchRange(receiptMaterial.id, lotId, paletId, from, to)
            }
          />
        ))}

        <div className="rounded-lg border border-border/80 bg-background/35 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Agregar material
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px]">
            <Select
              value={newMaterialCode}
              onValueChange={setNewMaterialCode}
              disabled={availableMaterials.length === 0}
            >
              <SelectTrigger className="reception-select-trigger h-10 text-left text-[13px] data-[placeholder]:text-muted-foreground">
                <SelectValue
                  placeholder={
                    availableMaterials.length === 0
                      ? "Todos los materiales agregados"
                      : "Seleccionar material"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableMaterials.map((material) => (
                  <SelectItem
                    key={material.code}
                    value={material.code}
                    textValue={materialLabel(material)}
                  >
                    {materialLabel(material)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              className="h-10 bg-[#5E6AD2] text-white hover:bg-[#6875E8]"
              onClick={addMaterial}
              disabled={!canAddMaterial}
            >
              <Plus className="h-4 w-4" />
              Material
            </Button>
          </div>
        </div>

        {receiptMaterials.length === 0 ? (
          <EmptyTraceState
            icon={Boxes}
            title="Sin materiales"
            message="Agregá el primer material del remito para cargar sus lotes."
            className="py-6"
          />
        ) : null}
      </div>
    </section>
  );
}

function ReceiptMaterialTraceCard({
  receiptMaterial,
  onRemove,
  onToggle,
  onAddLot,
  onRemoveLot,
  onToggleLot,
  onAddPalet,
  onRemovePalet,
  onTogglePalet,
  onAddBatchRange,
}: {
  receiptMaterial: ReceiptMaterial;
  onRemove: () => void;
  onToggle: () => void;
  onAddLot: (value: string) => boolean;
  onRemoveLot: (lotId: string) => void;
  onToggleLot: (lotId: string) => void;
  onAddPalet: (lotId: string, value: string) => boolean;
  onRemovePalet: (lotId: string, paletId: string) => void;
  onTogglePalet: (lotId: string, paletId: string) => void;
  onAddBatchRange: (lotId: string, paletId: string, from: string, to: string) => boolean;
}) {
  const material = getMaterialByCode(receiptMaterial.materialCode);
  const totalPalets = getTotalPalets(receiptMaterial.lots);
  const totalBatches = getTotalBatches(receiptMaterial.lots);

  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-background/30">
      <div
        className={cn(
          "grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5",
          receiptMaterial.expanded && "border-b border-border/70",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-ml-2 h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onToggle}
            title={receiptMaterial.expanded ? "Contraer material" : "Expandir material"}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                receiptMaterial.expanded && "rotate-180",
              )}
            />
          </Button>
          <Boxes className="h-4 w-4 shrink-0 text-[#A8B1FF]" />
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold text-foreground">
              Recepción Material {receiptMaterial.materialCode}
            </div>
            <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
              {material?.provider ?? "Sin proveedor"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pl-10 sm:pl-0">
          <MaterialTraceCountSummary
            lots={receiptMaterial.lots.length}
            palets={totalPalets}
            batches={totalBatches}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onRemove}
            title="Eliminar material"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {receiptMaterial.expanded && (
        <div className="px-4 py-4 sm:px-5">
          <LotTraceabilityForm
            lots={receiptMaterial.lots}
            title="Lotes del material"
            description="Cargá cada lote de este material con sus palets y batches correspondientes."
            onAddLot={onAddLot}
            onRemoveLot={onRemoveLot}
            onToggleLot={onToggleLot}
            onAddPalet={onAddPalet}
            onRemovePalet={onRemovePalet}
            onTogglePalet={onTogglePalet}
            onAddBatchRange={onAddBatchRange}
          />
        </div>
      )}
    </div>
  );
}

function LotTraceabilityForm({
  lots,
  title = "Lotes del Remito",
  description = "Cargá cada lote con sus palets y batches correspondientes.",
  onAddLot,
  onRemoveLot,
  onToggleLot,
  onAddPalet,
  onRemovePalet,
  onTogglePalet,
  onAddBatchRange,
}: {
  lots: TraceLot[];
  title?: string;
  description?: string;
  onAddLot: (value: string) => boolean;
  onRemoveLot: (lotId: string) => void;
  onToggleLot: (lotId: string) => void;
  onAddPalet: (lotId: string, value: string) => boolean;
  onRemovePalet: (lotId: string, paletId: string) => void;
  onTogglePalet: (lotId: string, paletId: string) => void;
  onAddBatchRange: (lotId: string, paletId: string, from: string, to: string) => boolean;
}) {
  const [newLotCode, setNewLotCode] = useState("");

  const addLot = () => {
    const wasAdded = onAddLot(newLotCode);
    if (!wasAdded) return;

    setNewLotCode("");
  };

  return (
    <section className="space-y-5">
      <div className="min-w-0">
        <div className="text-[19px] font-semibold tracking-tight text-foreground sm:text-[21px]">
          {title}
        </div>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="space-y-4">
        {lots.map((lot) => (
          <LotTraceCard
            key={lot.id}
            lot={lot}
            onRemove={() => onRemoveLot(lot.id)}
            onToggle={() => onToggleLot(lot.id)}
            onAddPalet={(value) => onAddPalet(lot.id, value)}
            onRemovePalet={(paletId) => onRemovePalet(lot.id, paletId)}
            onTogglePalet={(paletId) => onTogglePalet(lot.id, paletId)}
            onAddBatchRange={(paletId, from, to) => onAddBatchRange(lot.id, paletId, from, to)}
          />
        ))}

        <div className="rounded-lg border border-border/80 bg-background/35 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Agregar lote
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px]">
            <Input
              placeholder="N° lote (ej. 24)"
              value={newLotCode}
              onChange={(event) => setNewLotCode(event.target.value)}
              autoComplete="off"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addLot();
                }
              }}
              className="reception-field h-10 font-mono text-[13px]"
            />
            <Button
              type="button"
              className="h-10 bg-[#5E6AD2] text-white hover:bg-[#6875E8]"
              onClick={addLot}
              disabled={!newLotCode.trim()}
            >
              <Plus className="h-4 w-4" />
              Lote
            </Button>
          </div>
        </div>

        {lots.length === 0 ? (
          <EmptyTraceState
            icon={FileText}
            title="Sin lotes"
            message="Agregá el primer lote para cargar sus palets y batches."
            className="py-6"
          />
        ) : null}
      </div>
    </section>
  );
}

function AddPaletPanel({
  value,
  onValueChange,
  onAdd,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-background/35 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        Agregar palet a este lote
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px]">
        <Input
          placeholder="N° palet (ej. P-01)"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          autoComplete="off"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAdd();
            }
          }}
          className="reception-field h-10 font-mono text-[13px]"
        />
        <Button
          type="button"
          className="h-10 bg-[#5E6AD2] text-white hover:bg-[#6875E8]"
          onClick={onAdd}
          disabled={!value.trim()}
        >
          <Plus className="h-4 w-4" />
          Palet
        </Button>
      </div>
    </div>
  );
}

function LotTraceCard({
  lot,
  onRemove,
  onToggle,
  onAddPalet,
  onRemovePalet,
  onTogglePalet,
  onAddBatchRange,
}: {
  lot: TraceLot;
  onRemove: () => void;
  onToggle: () => void;
  onAddPalet: (value: string) => boolean;
  onRemovePalet: (paletId: string) => void;
  onTogglePalet: (paletId: string) => void;
  onAddBatchRange: (paletId: string, from: string, to: string) => boolean;
}) {
  const [newPaletCode, setNewPaletCode] = useState("");
  const batchCount = getLotBatchCount(lot);

  const addPalet = () => {
    const wasAdded = onAddPalet(newPaletCode);
    if (!wasAdded) return;

    setNewPaletCode("");
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-background/30">
      <div
        className={cn(
          "grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5",
          lot.expanded && "border-b border-border/70",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-ml-2 h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onToggle}
            title={lot.expanded ? "Contraer lote" : "Expandir lote"}
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", lot.expanded && "rotate-180")}
            />
          </Button>
          <FileText className="h-4 w-4 shrink-0 text-[#A8B1FF]" />
          <span className="min-w-0 truncate font-mono text-[13.5px] font-semibold text-foreground">
            Lote {lot.code}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 pl-10 sm:pl-0">
          <TraceCountSummary palets={lot.palets.length} batches={batchCount} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onRemove}
            title="Eliminar lote"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {lot.expanded && (
        <div className="space-y-4 px-4 py-4 sm:px-5">
          {lot.palets.length === 0 ? (
            <>
              <AddPaletPanel
                value={newPaletCode}
                onValueChange={setNewPaletCode}
                onAdd={addPalet}
              />
              <EmptyTraceState
                icon={Layers3}
                title="Sin palets"
                message="Agregá un palet para cargar el rango de batches."
                className="py-6"
              />
            </>
          ) : (
            <>
              {lot.palets.map((palet) => (
                <PaletTraceCard
                  key={palet.id}
                  palet={palet}
                  onRemove={() => onRemovePalet(palet.id)}
                  onToggle={() => onTogglePalet(palet.id)}
                  onAddBatchRange={(from, to) => onAddBatchRange(palet.id, from, to)}
                />
              ))}
              <AddPaletPanel
                value={newPaletCode}
                onValueChange={setNewPaletCode}
                onAdd={addPalet}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PaletTraceCard({
  palet,
  onRemove,
  onToggle,
  onAddBatchRange,
}: {
  palet: TracePalet;
  onRemove: () => void;
  onToggle: () => void;
  onAddBatchRange: (from: string, to: string) => boolean;
}) {
  const [batchFrom, setBatchFrom] = useState("");
  const [batchTo, setBatchTo] = useState("");

  const addRange = () => {
    const wasAdded = onAddBatchRange(batchFrom, batchTo);
    if (!wasAdded) return;

    setBatchFrom("");
    setBatchTo("");
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-card/70">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3",
          palet.expanded && "border-b border-border/70",
        )}
      >
        <Layers3 className="h-4 w-4 text-[#A8B1FF]" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-[13.5px] font-semibold text-foreground">
              Palet {palet.code}
            </span>
            <span className="text-[12px] text-muted-foreground">
              ({palet.batches.length} batches)
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRemove}
            title="Eliminar palet"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggle}
            title={palet.expanded ? "Contraer palet" : "Expandir palet"}
          >
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", palet.expanded && "rotate-180")}
            />
          </Button>
        </div>
      </div>

      {palet.expanded && (
        <div className="px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Rango de batches
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)_160px] md:items-center">
            <Input
              value={batchFrom}
              onChange={(event) => setBatchFrom(event.target.value)}
              placeholder="Desde"
              inputMode="numeric"
              autoComplete="off"
              className="reception-field h-10 text-[13px]"
            />
            <ChevronRight className="hidden h-4 w-4 justify-self-center text-muted-foreground md:block" />
            <Input
              value={batchTo}
              onChange={(event) => setBatchTo(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addRange();
                }
              }}
              placeholder="Hasta"
              inputMode="numeric"
              autoComplete="off"
              className="reception-field h-10 text-[13px]"
            />
            <Button
              type="button"
              className="h-10 bg-[#5E6AD2] text-white hover:bg-[#6875E8]"
              onClick={addRange}
            >
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </div>

          {palet.batches.length === 0 ? (
            <div className="mt-4 rounded-md border border-dashed border-border/80 bg-background/30 px-3 py-2 text-[12.5px] text-muted-foreground">
              Este palet todavía no tiene batches registrados.
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {palet.batches.map((batch) => (
                <span
                  key={batch}
                  className="flex h-7 min-w-8 items-center justify-center rounded-md border border-border/80 bg-background/45 px-2 font-mono text-[12px] text-foreground"
                >
                  {batch}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TraceCountSummary({ palets, batches }: { palets: number; batches: number }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground sm:justify-end">
      <span>
        <strong className="font-semibold text-foreground">{palets}</strong>{" "}
        {pluralize(palets, "palet", "palets")}
      </span>
      <span className="text-muted-foreground/60">·</span>
      <span>
        <strong className="font-semibold text-foreground">{batches}</strong> batches
      </span>
    </div>
  );
}

function MaterialTraceCountSummary({
  lots,
  palets,
  batches,
}: {
  lots: number;
  palets: number;
  batches: number;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground sm:justify-end">
      <span>
        <strong className="font-semibold text-foreground">{lots}</strong>{" "}
        {pluralize(lots, "lote", "lotes")}
      </span>
      <span className="text-muted-foreground/60">·</span>
      <span>
        <strong className="font-semibold text-foreground">{palets}</strong>{" "}
        {pluralize(palets, "palet", "palets")}
      </span>
      <span className="text-muted-foreground/60">·</span>
      <span>
        <strong className="font-semibold text-foreground">{batches}</strong> batches
      </span>
    </div>
  );
}

function EmptyTraceState({
  icon: Icon = Layers3,
  title,
  message,
  className,
  onClick,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  message: string;
  className?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <Icon className="mx-auto h-7 w-7 text-[#A8B1FF]" />
      <div className="mt-4 text-[14px] font-semibold text-foreground">{title}</div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{message}</p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={cn(
          "w-full rounded-lg border border-dashed border-border/80 bg-background/25 px-4 py-12 text-center transition-colors hover:border-[#A8B1FF]/60 hover:bg-[#5E6AD2]/10",
          className,
        )}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border/80 bg-background/25 px-4 py-8 text-center",
        className,
      )}
    >
      {content}
    </div>
  );
}

function MaterialsTraceabilitySummary({
  receiptMaterials,
}: {
  receiptMaterials: ReceiptMaterial[];
}) {
  if (receiptMaterials.length === 0) {
    return (
      <div className="mt-4 rounded-md border border-dashed border-border/80 bg-background/30 px-3 py-3 text-[12.5px] text-muted-foreground">
        Sin materiales registrados.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {receiptMaterials.map((receiptMaterial) => {
        const totalPalets = getTotalPalets(receiptMaterial.lots);
        const totalBatches = getTotalBatches(receiptMaterial.lots);

        return (
          <div
            key={receiptMaterial.id}
            className="rounded-md border border-border/70 bg-card/60 px-4 py-3"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <div className="flex min-w-0 items-center gap-2">
                <Boxes className="h-3.5 w-3.5 shrink-0 text-[#A8B1FF]" />
                <span className="text-[15px] font-semibold text-foreground">
                  Recepción Material {receiptMaterial.materialCode}
                </span>
              </div>
              <span className="text-[12.5px] text-muted-foreground">
                ({receiptMaterial.lots.length}{" "}
                {pluralize(receiptMaterial.lots.length, "lote", "lotes")}, {totalPalets}{" "}
                {pluralize(totalPalets, "palet", "palets")}, {totalBatches} batches)
              </span>
            </div>

            <TraceabilitySummary lots={receiptMaterial.lots} />
          </div>
        );
      })}
    </div>
  );
}

function TraceabilitySummary({ lots }: { lots: TraceLot[] }) {
  if (lots.length === 0) {
    return (
      <div className="mt-4 rounded-md border border-dashed border-border/80 bg-background/30 px-3 py-3 text-[12.5px] text-muted-foreground">
        Sin lotes registrados.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {lots.map((lot) => {
        const batchCount = getLotBatchCount(lot);

        return (
          <div key={lot.id} className="rounded-md border border-border/70 bg-card/60 px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-3.5 w-3.5 shrink-0 text-[#A8B1FF]" />
                <span className="font-mono text-[16px] font-semibold text-foreground">
                  Lote {formatLotCode(lot)}
                </span>
              </div>
              <span className="text-[12.5px] text-muted-foreground">
                ({lot.palets.length} {pluralize(lot.palets.length, "palet", "palets")}, {batchCount}{" "}
                batches)
              </span>
            </div>

            {lot.palets.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed border-border/80 bg-background/30 px-3 py-2 text-[12.5px] text-muted-foreground">
                Sin palets registrados.
              </div>
            ) : (
              <div className="mt-4 space-y-4 border-l border-border/80 pl-4">
                {lot.palets.map((palet) => (
                  <div key={palet.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Layers3 className="h-4 w-4 text-[#A8B1FF]" />
                      <span className="font-mono text-[13.5px] font-semibold text-foreground">
                        Palet {palet.code}
                      </span>
                      <span className="text-[12px] text-muted-foreground">
                        ({palet.batches.length} batches)
                      </span>
                    </div>

                    {palet.batches.length === 0 ? (
                      <div className="mt-2 text-[12.5px] text-muted-foreground">
                        Sin batches registrados.
                      </div>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {palet.batches.map((batch) => (
                          <span
                            key={`${palet.id}-${batch}`}
                            className="flex h-7 min-w-8 items-center justify-center rounded-md border border-border/80 bg-background/45 px-2 font-mono text-[12px] text-foreground"
                          >
                            {batch}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LiveTraceabilityPanel({
  remito,
  provider,
  receiptMaterials,
}: {
  remito: string;
  provider: string;
  receiptMaterials: ReceiptMaterial[];
}) {
  const totalLots = getReceiptTotalLots(receiptMaterials);
  const totalBatches = getReceiptTotalBatches(receiptMaterials);
  const totalPalets = getReceiptTotalPalets(receiptMaterials);
  const displayRemito = remito.trim() || "Sin remito";
  const displayProvider = provider || "Sin proveedor";

  return (
    <aside className="min-w-0">
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Resumen
        </div>
        <div className="mt-3 grid gap-2">
          <LiveContext icon={FileText} label="Remito" value={displayRemito} mono />
          <LiveContext icon={Building2} label="Proveedor" value={displayProvider} />
        </div>
      </div>

      <div className="space-y-3">
        {receiptMaterials.length === 0 ? (
          <div className="rounded-lg border border-border/80 bg-background/35 p-4 text-[12px] text-muted-foreground">
            Sin materiales registrados
          </div>
        ) : (
          receiptMaterials.map((receiptMaterial) => (
            <LiveMaterialSummary key={receiptMaterial.id} receiptMaterial={receiptMaterial} />
          ))
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <LiveMetric label="Materiales" value={String(receiptMaterials.length)} />
        <LiveMetric label="Lotes" value={String(totalLots)} />
        <LiveMetric label="Palets" value={String(totalPalets)} />
        <LiveMetric label="Batches" value={String(totalBatches)} />
      </div>
    </aside>
  );
}

function LiveMaterialSummary({ receiptMaterial }: { receiptMaterial: ReceiptMaterial }) {
  return (
    <div className="rounded-lg border border-border/80 bg-background/35 p-4">
      <div className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
        <Boxes className="h-4 w-4 text-[#A8B1FF]" />
        Recepción Material {receiptMaterial.materialCode}
      </div>

      <div className="mt-4 border-t border-border/70 pt-4">
        {receiptMaterial.lots.length === 0 ? (
          <div className="text-[12px] text-muted-foreground">Sin lotes registrados</div>
        ) : (
          <div className="space-y-3">
            {receiptMaterial.lots.map((lot) => (
              <div key={lot.id} className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 text-[#A8B1FF]" />
                <div className="min-w-0">
                  <div className="font-mono text-[13px] font-semibold text-foreground">
                    Lote {formatLotCode(lot)}
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground">
                    {lot.palets.length} {pluralize(lot.palets.length, "palet", "palets")} ·{" "}
                    {getLotBatchCount(lot)} batches
                  </div>

                  {lot.palets.length > 0 ? (
                    <div className="mt-2 space-y-2 border-l border-border/80 pl-4">
                      {lot.palets.map((palet) => (
                        <div key={palet.id} className="flex items-start gap-2">
                          <Layers3 className="mt-0.5 h-4 w-4 text-[#A8B1FF]" />
                          <div>
                            <div className="font-mono text-[13px] font-semibold text-foreground">
                              Palet {palet.code}
                            </div>
                            <div className="mt-0.5 text-[12px] text-muted-foreground">
                              ({palet.batches.length} batches)
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveContext({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border/70 bg-card/60 px-3 py-2">
      <Icon className="h-3.5 w-3.5 text-[#A8B1FF]" />
      <span className="text-[15px] font-semibold text-foreground">{label}</span>
      <span className={cn("ml-auto truncate text-[12.5px] text-foreground", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );
}

function LiveMetric({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border/80 bg-background/35 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-semibold text-[#A8B1FF]",
          mono ? "font-mono text-[15px] leading-relaxed" : "text-[22px]",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function getMaterialByCode(code: string) {
  return materials.find((material) => material.code === code);
}

function getReceiptProviderLabel(receiptMaterials: ReceiptMaterial[]) {
  const providers = Array.from(
    new Set(
      receiptMaterials
        .map((entry) => getMaterialByCode(entry.materialCode)?.provider)
        .filter((provider): provider is string => Boolean(provider)),
    ),
  );

  return providers.length > 0 ? providers.join(", ") : "";
}

function normalizeTraceCode(value: string) {
  return value.trim().replace(/\s+/g, "-").toUpperCase();
}

function createBatchRange(from: string, to: string) {
  const start = Number.parseInt(from, 10);
  const end = Number.parseInt(to, 10);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start <= 0 || end < start) {
    return [];
  }

  return Array.from({ length: end - start + 1 }, (_, index) => String(start + index));
}

function mergeBatches(current: string[], next: string[]) {
  return Array.from(new Set([...current, ...next])).sort((a, b) => Number(a) - Number(b));
}

function getLotBatchCount(lot: TraceLot) {
  return lot.palets.reduce((total, palet) => total + palet.batches.length, 0);
}

function getTotalPalets(lots: TraceLot[]) {
  return lots.reduce((total, lot) => total + lot.palets.length, 0);
}

function getTotalBatches(lots: TraceLot[]) {
  return lots.reduce((total, lot) => total + getLotBatchCount(lot), 0);
}

function getReceiptTotalLots(receiptMaterials: ReceiptMaterial[]) {
  return receiptMaterials.reduce((total, entry) => total + entry.lots.length, 0);
}

function getReceiptTotalPalets(receiptMaterials: ReceiptMaterial[]) {
  return receiptMaterials.reduce((total, entry) => total + getTotalPalets(entry.lots), 0);
}

function getReceiptTotalBatches(receiptMaterials: ReceiptMaterial[]) {
  return receiptMaterials.reduce((total, entry) => total + getTotalBatches(entry.lots), 0);
}

function formatLotCode(lot: TraceLot) {
  return lot.code.trim() || "Sin número";
}

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

function materialLabel(material: (typeof materials)[number]) {
  return material.code;
}

function MaterialMeta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border/80 bg-background/35 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-1 text-[13.5px] font-semibold text-foreground", mono && "font-mono")}>
        {value}
      </div>
    </div>
  );
}

function StepItem({
  step,
  activeStep,
  showLine,
}: {
  step: (typeof steps)[number];
  activeStep: number;
  showLine: boolean;
}) {
  const Icon = step.icon;
  const isComplete = step.number < activeStep;
  const isCurrent = step.number === activeStep;

  return (
    <li className="flex min-w-[176px] flex-1 items-center">
      {step.number > 1 ? <span className="mr-4 h-px min-w-8 flex-1 bg-border/80" /> : null}
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold",
            isCurrent
              ? "border-[#5E6AD2] bg-[#5E6AD2] text-white shadow-[0_0_0_4px_rgba(94,106,210,0.16)]"
              : isComplete
                ? "border-[#5E6AD2]/60 bg-[#5E6AD2]/15 text-[#A8B1FF]"
                : "border-border bg-background/55 text-muted-foreground",
          )}
        >
          {isComplete ? <Check className="h-4 w-4" /> : step.number}
        </span>
        <div className="min-w-0">
          <div
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]",
              isCurrent || isComplete ? "text-[#A8B1FF]" : "text-muted-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {step.label}
          </div>
          <div className="mt-0.5 truncate text-[13.5px] font-medium text-foreground">
            {step.title}
          </div>
        </div>
      </div>
      {showLine && <span className="ml-4 h-px min-w-8 flex-1 bg-border/80" />}
    </li>
  );
}

function FieldBlock({
  id,
  label,
  required,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-1.5">
        <Label
          htmlFor={id}
          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
        >
          {label}
        </Label>
        {required && <span className="text-[#A8B1FF]">*</span>}
      </div>
      {children}
    </div>
  );
}
