import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Boxes,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  Layers3,
  Plus,
  ScanLine,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";

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
import {
  createReceptionMaterialDrafts,
  receptionMaterialOptions,
  useReceptionData,
  type ReceptionMaterialEntry,
  type ReceptionTraceLot,
  type ReceptionTracePalet,
} from "@/lib/reception-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recepcion/nueva")({
  validateSearch: (search: Record<string, unknown>): { editId?: string } => ({
    editId: typeof search.editId === "string" ? search.editId : undefined,
  }),
  component: ReceptionRoute,
});

const steps = [
  { number: 1, label: "Paso 1", title: "Ingreso", icon: FileText },
  { number: 2, label: "Paso 2", title: "Trazabilidad", icon: ScanLine },
  { number: 3, label: "Paso 3", title: "Confirmar", icon: ShieldCheck },
];

const materials = receptionMaterialOptions;

const remitoExample = "R-0087421";

type Material = (typeof materials)[number];

type TracePalet = ReceptionTracePalet;

type TraceLot = ReceptionTraceLot;

type ReceiptMaterial = ReceptionMaterialEntry;

type FieldError = {
  message: string;
  nonce: number;
};

type StepOneErrors = {
  remito?: FieldError;
  receptionDate?: FieldError;
  materials?: FieldError;
};

function ReceptionRoute() {
  const navigate = useNavigate();
  const { editId } = Route.useSearch();
  const { receptions, createReception, updateReception } = useReceptionData();
  const editingReception = editId
    ? receptions.find((reception) => reception.id === editId)
    : undefined;
  const isEditMode = Boolean(editingReception);
  const [activeStep, setActiveStep] = useState(1);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [remito, setRemito] = useState(editingReception?.remito ?? "");
  const [receptionDate, setReceptionDate] = useState(editingReception?.receptionDate ?? "");
  const [receiptMaterials, setReceiptMaterials] = useState<ReceiptMaterial[]>(() =>
    editingReception ? createReceptionMaterialDrafts(editingReception.materials, true) : [],
  );
  const [stepOneErrors, setStepOneErrors] = useState<StepOneErrors>({});
  const receptionProvider = getReceiptProviderLabel(receiptMaterials);

  useEffect(() => {
    setIsConfirmed(false);
    setActiveStep(1);
    setStepOneErrors({});

    if (editingReception) {
      setRemito(editingReception.remito);
      setReceptionDate(editingReception.receptionDate);
      setReceiptMaterials(createReceptionMaterialDrafts(editingReception.materials, true));
      return;
    }

    if (editId) {
      void navigate({ to: "/recepcion", replace: true });
      return;
    }

    if (!editId) {
      setRemito("");
      setReceptionDate("");
      setReceiptMaterials([]);
    }
  }, [editId, editingReception?.id, navigate]);

  const updateRemito = (value: string) => {
    setRemito(value);
    if (value.trim()) {
      setStepOneErrors((current) => ({ ...current, remito: undefined }));
    }
  };

  const updateReceptionDate = (value: string) => {
    setReceptionDate(value);
    if (value) {
      setStepOneErrors((current) => ({ ...current, receptionDate: undefined }));
    }
  };

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
        rolls: [],
        expanded: true,
      },
    ]);
    setStepOneErrors((current) => ({ ...current, materials: undefined }));
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
    if (parsePositiveInteger(code) === undefined) return false;

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
    if (parsePositiveInteger(code) === undefined) return false;

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

  const addRollRange = (receiptMaterialId: string, from: string, to: string) => {
    const range = createNumberRange(from, to);
    if (range.length === 0) return false;

    const receiptMaterial = receiptMaterials.find((entry) => entry.id === receiptMaterialId);
    const material = receiptMaterial ? getMaterialByCode(receiptMaterial.materialCode) : undefined;
    if (!receiptMaterial || !isRollTraceabilityMaterial(material)) return false;

    if (range.some((roll) => receiptMaterial.rolls.includes(roll))) {
      return false;
    }

    setReceiptMaterials((current) =>
      current.map((entry) =>
        entry.id === receiptMaterialId
          ? {
              ...entry,
              rolls: mergeNumericCodes(entry.rolls, range),
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
    setStepOneErrors({});
  };

  const saveReception = () => {
    const input = {
      remito: remito.trim(),
      receptionDate,
      materials: receiptMaterials,
    };

    if (editingReception) {
      updateReception(editingReception.id, input);
      return;
    }

    createReception(input);
  };

  const returnToReceptionDashboard = () => {
    void navigate({ to: "/recepcion" });
  };

  const registerAnotherReception = () => {
    resetReception();
    if (editId) {
      void navigate({ to: "/recepcion/nueva", search: {}, replace: true });
    }
  };

  const handlePrimaryAction = () => {
    if (activeStep === 1) {
      const isRemitoMissing = !remito.trim();
      const isReceptionDateMissing = !receptionDate;
      const areMaterialsMissing = receiptMaterials.length === 0;

      if (isRemitoMissing || isReceptionDateMissing || areMaterialsMissing) {
        setStepOneErrors((current) => ({
          remito: isRemitoMissing
            ? createFieldError("Ingresá el número de remito para continuar.", current.remito)
            : undefined,
          receptionDate: isReceptionDateMissing
            ? createFieldError(
                "Seleccioná la fecha de recepción del remito.",
                current.receptionDate,
              )
            : undefined,
          materials: areMaterialsMissing
            ? createFieldError(
                "Agregá al menos un material incluido en este remito.",
                current.materials,
              )
            : undefined,
        }));
        return;
      }

      setStepOneErrors({});
      setRemito(remito.trim());
      setReceiptMaterials((current) =>
        current.map((entry, index) => ({ ...entry, expanded: index === 0 })),
      );
    }

    if (activeStep < 3) {
      setActiveStep((current) => current + 1);
      return;
    }

    saveReception();
    setIsConfirmed(true);
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
                  {isConfirmed
                    ? isEditMode
                      ? "Ingreso actualizado"
                      : "Ingreso registrado"
                    : isEditMode
                      ? "Editar ingreso de material"
                      : "Nuevo ingreso de material"}
                </h1>
                <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
                  {isConfirmed
                    ? isEditMode
                      ? "Los cambios quedaron guardados en el panel de recepción."
                      : "Los materiales quedan pendientes de aprobación de Calidad."
                    : activeStep === 1 && "Cargá remito, fecha y materiales incluidos."}
                  {!isConfirmed &&
                    activeStep === 2 &&
                    "Cargá la trazabilidad correspondiente para cada material."}
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
                <Link to="/recepcion">
                  <X className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {!isConfirmed ? (
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
                  isEditMode={isEditMode}
                  onFinishTurn={returnToReceptionDashboard}
                  onRegisterAnotherRequest={registerAnotherReception}
                />
              ) : (
                <>
                  {activeStep === 1 && (
                    <ReceptionDetailsStep
                      remito={remito}
                      receptionDate={receptionDate}
                      receiptMaterials={receiptMaterials}
                      validationErrors={stepOneErrors}
                      onRemitoChange={updateRemito}
                      onReceptionDateChange={updateReceptionDate}
                      onAddReceiptMaterial={addReceiptMaterial}
                      onRemoveReceiptMaterial={removeReceiptMaterial}
                    />
                  )}
                  {activeStep === 2 && (
                    <TraceabilityStep
                      remito={remito}
                      provider={receptionProvider}
                      receiptMaterials={receiptMaterials}
                      onToggleReceiptMaterial={toggleReceiptMaterial}
                      onAddLot={addLot}
                      onRemoveLot={removeLot}
                      onToggleLot={toggleLot}
                      onAddPalet={addPalet}
                      onRemovePalet={removePalet}
                      onTogglePalet={togglePalet}
                      onAddBatchRange={addBatchRange}
                      onAddRollRange={addRollRange}
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

            {!isConfirmed ? (
              <footer className="border-t border-border/70 bg-background/35 px-5 py-4 sm:px-8">
                <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="order-2 flex justify-center sm:order-1 sm:justify-start">
                    {activeStep === 1 ? (
                      <Button
                        asChild
                        variant="ghost"
                        className="justify-center text-foreground hover:bg-accent/70 sm:justify-start"
                      >
                        <Link to="/recepcion">Cancelar</Link>
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
                    >
                      {activeStep === 3
                        ? isEditMode
                          ? "Guardar cambios"
                          : "Confirmar"
                        : "Continuar"}
                      {activeStep === 3 ? <ShieldCheck className="h-4 w-4" /> : null}
                    </Button>
                  </div>
                </div>
              </footer>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}

function ReceptionDetailsStep({
  remito,
  receptionDate,
  receiptMaterials,
  validationErrors,
  onRemitoChange,
  onReceptionDateChange,
  onAddReceiptMaterial,
  onRemoveReceiptMaterial,
}: {
  remito: string;
  receptionDate: string;
  receiptMaterials: ReceiptMaterial[];
  validationErrors: StepOneErrors;
  onRemitoChange: (value: string) => void;
  onReceptionDateChange: (value: string) => void;
  onAddReceiptMaterial: (materialCode: string) => boolean;
  onRemoveReceiptMaterial: (receiptMaterialId: string) => void;
}) {
  return (
    <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
      <div className="min-w-0 md:col-span-2">
        <div className="text-[19px] font-semibold tracking-tight text-foreground sm:text-[21px]">
          Datos del Remito
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Agregá el número de remito y su fecha de recepción correspondiente.
        </p>
      </div>

      <FieldBlock id="remito" label="N° de remito" required>
        <div
          key={validationErrors.remito?.nonce}
          className={cn(validationErrors.remito && "reception-error-shake")}
        >
          <Input
            id="remito"
            value={remito}
            onChange={(event) => onRemitoChange(event.target.value)}
            placeholder={`Ej: ${remitoExample}`}
            autoComplete="off"
            aria-invalid={Boolean(validationErrors.remito)}
            className={cn(
              "reception-field h-11 font-mono text-[13.5px]",
              validationErrors.remito && "reception-field-error",
            )}
          />
        </div>
        <ValidationMessage error={validationErrors.remito} />
      </FieldBlock>

      <FieldBlock id="fecha-recepcion" label="Fecha de recepción" required>
        <div
          key={validationErrors.receptionDate?.nonce}
          className={cn(validationErrors.receptionDate && "reception-error-shake")}
        >
          <DateInput
            id="fecha-recepcion"
            value={receptionDate}
            onChange={onReceptionDateChange}
            placeholder="Seleccionar fecha de recepción"
            triggerBaseClassName="reception-date-trigger"
            triggerClassName={cn(
              "h-11 text-[13.5px]",
              validationErrors.receptionDate && "reception-field-error",
            )}
            iconClassName="h-4 w-4 text-[#A8B1FF]"
            calendarClassName="reception-calendar-surface"
          />
        </div>
        <ValidationMessage error={validationErrors.receptionDate} />
      </FieldBlock>

      <MaterialsSelectionForm
        receiptMaterials={receiptMaterials}
        error={validationErrors.materials}
        onAddReceiptMaterial={onAddReceiptMaterial}
        onRemoveReceiptMaterial={onRemoveReceiptMaterial}
      />
    </div>
  );
}

function TraceabilityStep({
  remito,
  provider,
  receiptMaterials,
  onToggleReceiptMaterial,
  onAddLot,
  onRemoveLot,
  onToggleLot,
  onAddPalet,
  onRemovePalet,
  onTogglePalet,
  onAddBatchRange,
  onAddRollRange,
}: {
  remito: string;
  provider: string;
  receiptMaterials: ReceiptMaterial[];
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
  onAddRollRange: (receiptMaterialId: string, from: string, to: string) => boolean;
}) {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-5">
        <MaterialsTraceabilityForm
          receiptMaterials={receiptMaterials}
          onToggleReceiptMaterial={onToggleReceiptMaterial}
          onAddLot={onAddLot}
          onRemoveLot={onRemoveLot}
          onToggleLot={onToggleLot}
          onAddPalet={onAddPalet}
          onRemovePalet={onRemovePalet}
          onTogglePalet={onTogglePalet}
          onAddBatchRange={onAddBatchRange}
          onAddRollRange={onAddRollRange}
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

function ConfirmedStep({
  remito,
  provider,
  receiptMaterials,
  isEditMode,
  onFinishTurn,
  onRegisterAnotherRequest,
}: {
  remito: string;
  provider: string;
  receiptMaterials: ReceiptMaterial[];
  isEditMode: boolean;
  onFinishTurn: () => void;
  onRegisterAnotherRequest: () => void;
}) {
  const totalLots = getReceiptTotalLots(receiptMaterials);
  const totalBatches = getReceiptTotalBatches(receiptMaterials);
  const totalPalets = getReceiptTotalPalets(receiptMaterials);
  const totalRolls = getReceiptTotalRolls(receiptMaterials);
  const traceMetricCards = getReceiptTraceMetricCards(receiptMaterials);
  const displayRemito = remito.trim() || "Sin remito";
  const displayProvider = provider || "Sin proveedor";
  const materialSummary = `${receiptMaterials.length} ${pluralize(
    receiptMaterials.length,
    "material",
    "materiales",
  )}`;
  const traceParts = [
    totalLots > 0 ? `${totalLots} ${pluralize(totalLots, "lote", "lotes")}` : "",
    totalRolls > 0 ? `${totalRolls} ${pluralize(totalRolls, "rollo", "rollos")}` : "",
  ].filter(Boolean);
  const traceSummary =
    traceParts.length === 0
      ? `${materialSummary} sin trazabilidad cargada`
      : `${materialSummary}, ${traceParts.join(", ")} registrados`;

  return (
    <div className="mx-auto flex min-h-[520px] max-w-3xl flex-col items-center justify-center py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#5E6AD2]/45 bg-[#5E6AD2]/10">
        <CheckCircle2 className="h-8 w-8 text-[#A8B1FF]" strokeWidth={1.8} />
      </div>

      <h2 className="mt-7 text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px]">
        {isEditMode ? "Ingreso actualizado" : "Ingreso registrado"}
      </h2>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
        Remito <span className="font-semibold text-foreground">{displayRemito}</span> · Proveedor{" "}
        <span className="font-medium text-foreground">{displayProvider}</span>.
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground/90">{traceSummary}</span>{" "}
        {isEditMode ? "guardados en el panel." : "pendiente de aprobación de Calidad."}
      </p>

      <div
        className="mt-8 grid w-full gap-3"
        style={{
          gridTemplateColumns: `repeat(${traceMetricCards.length}, minmax(0, 1fr))`,
          maxWidth: getFinalMetricGridMaxWidth(traceMetricCards.length),
        }}
      >
        {traceMetricCards.map((metric) => (
          <LiveMetric key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>

      <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <Button type="button" variant="secondary" className="h-10 flex-1" onClick={onFinishTurn}>
          Volver al panel
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

function MaterialsSelectionForm({
  receiptMaterials,
  error,
  onAddReceiptMaterial,
  onRemoveReceiptMaterial,
}: {
  receiptMaterials: ReceiptMaterial[];
  error?: FieldError;
  onAddReceiptMaterial: (materialCode: string) => boolean;
  onRemoveReceiptMaterial: (receiptMaterialId: string) => void;
}) {
  const [newMaterialCode, setNewMaterialCode] = useState("");
  const [materialError, setMaterialError] = useState<FieldError | undefined>();
  const availableMaterials = materials.filter(
    (material) => !receiptMaterials.some((entry) => entry.materialCode === material.code),
  );
  const displayedError = materialError ?? error;

  const addMaterial = () => {
    if (availableMaterials.length === 0) return;

    if (!newMaterialCode) {
      setMaterialError((current) =>
        createFieldError("Seleccioná un material antes de agregarlo.", current),
      );
      return;
    }

    const wasAdded = onAddReceiptMaterial(newMaterialCode);
    if (!wasAdded) {
      setMaterialError((current) =>
        createFieldError("Ese material ya está agregado al remito.", current),
      );
      return;
    }

    setNewMaterialCode("");
    setMaterialError(undefined);
  };

  return (
    <section className="space-y-4 md:col-span-2">
      <div className="min-w-0">
        <div className="text-[19px] font-semibold tracking-tight text-foreground sm:text-[21px]">
          Materiales del Remito
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Agregá los materiales incluido en este remito. En el próximo paso vas a cargar los datos
          de cada uno.
        </p>
      </div>

      <div className="rounded-lg border border-border/80 bg-background/35 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Agregar material
        </div>
        <div
          key={displayedError?.nonce}
          className={cn(
            "mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px]",
            displayedError && "reception-error-shake",
          )}
        >
          <Select
            value={newMaterialCode}
            onValueChange={(value) => {
              setNewMaterialCode(value);
              setMaterialError(undefined);
            }}
            disabled={availableMaterials.length === 0}
          >
            <SelectTrigger
              className={cn(
                "reception-select-trigger h-10 text-left text-[13px] data-[placeholder]:text-muted-foreground",
                displayedError && "reception-field-error",
              )}
            >
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
            disabled={availableMaterials.length === 0}
          >
            <Plus className="h-4 w-4" />
            Material
          </Button>
        </div>
        <ValidationMessage error={displayedError} />
      </div>

      {receiptMaterials.length === 0 ? (
        <EmptyTraceState
          icon={Boxes}
          title="Sin materiales"
          message="Agregá el primer material del remito para continuar."
          className="py-6"
        />
      ) : (
        <div className="space-y-2">
          {receiptMaterials.map((receiptMaterial) => (
            <MaterialSelectionRow
              key={receiptMaterial.id}
              receiptMaterial={receiptMaterial}
              onRemove={() => onRemoveReceiptMaterial(receiptMaterial.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function MaterialSelectionRow({
  receiptMaterial,
  onRemove,
}: {
  receiptMaterial: ReceiptMaterial;
  onRemove: () => void;
}) {
  const material = getMaterialByCode(receiptMaterial.materialCode);

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-lg border border-border/80 bg-card/60 px-4 py-3">
      <Boxes className="mt-0.5 h-4 w-4 shrink-0 text-[#A8B1FF]" />
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <div className="truncate text-[15px] font-semibold text-foreground">
            Recepción Material {receiptMaterial.materialCode}
          </div>
          {material ? (
            <div className="flex flex-wrap items-center gap-1.5 sm:ml-5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Trazabilidad requerida
              </span>
              {material.traceability.map((level, index) => (
                <div key={level} className="flex items-center gap-1.5">
                  <span className="rounded-md border border-[#5E6AD2]/45 bg-background/45 px-2 py-1 text-[12px] font-semibold text-foreground">
                    {level}
                  </span>
                  {index < material.traceability.length - 1 ? (
                    <ChevronRight className="h-3.5 w-3.5 text-[#A8B1FF]" />
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
          {material?.provider ?? "Sin proveedor"}
        </div>
      </div>
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
  );
}

function MaterialsTraceabilityForm({
  receiptMaterials,
  onToggleReceiptMaterial,
  onAddLot,
  onRemoveLot,
  onToggleLot,
  onAddPalet,
  onRemovePalet,
  onTogglePalet,
  onAddBatchRange,
  onAddRollRange,
}: {
  receiptMaterials: ReceiptMaterial[];
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
  onAddRollRange: (receiptMaterialId: string, from: string, to: string) => boolean;
}) {
  return (
    <section className="space-y-5">
      <div className="min-w-0">
        <div className="text-[19px] font-semibold tracking-tight text-foreground sm:text-[21px]">
          Trazabilidad por Material
        </div>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
          Completá los datos de trazabilidad correspondientes para cada material del remito.
        </p>
      </div>

      <div className="space-y-4">
        {receiptMaterials.map((receiptMaterial) => (
          <ReceiptMaterialTraceCard
            key={receiptMaterial.id}
            receiptMaterial={receiptMaterial}
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
            onAddRollRange={(from, to) => onAddRollRange(receiptMaterial.id, from, to)}
          />
        ))}

        {receiptMaterials.length === 0 ? (
          <EmptyTraceState
            icon={Boxes}
            title="Sin materiales"
            message="Volvé al paso anterior para agregar los materiales del remito."
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
  onAddRollRange,
}: {
  receiptMaterial: ReceiptMaterial;
  onRemove?: () => void;
  onToggle: () => void;
  onAddLot: (value: string) => boolean;
  onRemoveLot: (lotId: string) => void;
  onToggleLot: (lotId: string) => void;
  onAddPalet: (lotId: string, value: string) => boolean;
  onRemovePalet: (lotId: string, paletId: string) => void;
  onTogglePalet: (lotId: string, paletId: string) => void;
  onAddBatchRange: (lotId: string, paletId: string, from: string, to: string) => boolean;
  onAddRollRange: (from: string, to: string) => boolean;
}) {
  const material = getMaterialByCode(receiptMaterial.materialCode);
  const isRollMaterial = isRollTraceabilityMaterial(material);
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
          {isRollMaterial ? (
            <RollTraceCountSummary rolls={receiptMaterial.rolls.length} />
          ) : (
            <MaterialTraceCountSummary
              lots={receiptMaterial.lots.length}
              palets={totalPalets}
              batches={totalBatches}
            />
          )}
          {onRemove ? (
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
          ) : null}
        </div>
      </div>

      {receiptMaterial.expanded && (
        <div className="px-4 py-4 sm:px-5">
          {isRollMaterial ? (
            <RollTraceabilityForm rolls={receiptMaterial.rolls} onAddRollRange={onAddRollRange} />
          ) : (
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
          )}
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
  const [newLotError, setNewLotError] = useState<FieldError | undefined>();

  const addLot = () => {
    const code = normalizeTraceCode(newLotCode);
    if (!code) {
      setNewLotError((current) => createFieldError("Ingresá el número de lote.", current));
      return;
    }

    if (parsePositiveInteger(code) === undefined) {
      setNewLotError((current) =>
        createFieldError("El lote debe ser un número mayor a cero.", current),
      );
      return;
    }

    if (lots.some((lot) => lot.code.toLowerCase() === code.toLowerCase())) {
      setNewLotError((current) =>
        createFieldError(`El lote ${code} ya está cargado para este material.`, current),
      );
      return;
    }

    const wasAdded = onAddLot(newLotCode);
    if (!wasAdded) {
      setNewLotError((current) =>
        createFieldError("No se pudo agregar el lote. Revisá el número ingresado.", current),
      );
      return;
    }

    setNewLotCode("");
    setNewLotError(undefined);
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
          <div
            key={newLotError?.nonce}
            className={cn(
              "mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px]",
              newLotError && "reception-error-shake",
            )}
          >
            <Input
              placeholder="N° lote (ej. 24)"
              value={newLotCode}
              onChange={(event) => {
                setNewLotCode(event.target.value);
                setNewLotError(undefined);
              }}
              inputMode="numeric"
              autoComplete="off"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addLot();
                }
              }}
              aria-invalid={Boolean(newLotError)}
              className={cn(
                "reception-field h-10 font-mono text-[13px]",
                newLotError && "reception-field-error",
              )}
            />
            <Button
              type="button"
              className="h-10 bg-[#5E6AD2] text-white hover:bg-[#6875E8]"
              onClick={addLot}
            >
              <Plus className="h-4 w-4" />
              Lote
            </Button>
          </div>
          <ValidationMessage error={newLotError} />
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

function RollTraceabilityForm({
  rolls,
  onAddRollRange,
}: {
  rolls: string[];
  onAddRollRange: (from: string, to: string) => boolean;
}) {
  const [rollFrom, setRollFrom] = useState("");
  const [rollTo, setRollTo] = useState("");
  const [rollRangeError, setRollRangeError] = useState<FieldError | undefined>();

  const addRange = () => {
    const from = rollFrom.trim();
    const to = rollTo.trim();

    if (!from || !to) {
      setRollRangeError((current) =>
        createFieldError("Completá el rollo inicial y el rollo final.", current),
      );
      return;
    }

    const start = parsePositiveInteger(from);
    const end = parsePositiveInteger(to);

    if (start === undefined || end === undefined) {
      setRollRangeError((current) =>
        createFieldError("Los rollos deben ser números mayores a cero.", current),
      );
      return;
    }

    if (end < start) {
      setRollRangeError((current) =>
        createFieldError("El rollo final debe ser mayor o igual al rollo inicial.", current),
      );
      return;
    }

    const range = createNumberRange(from, to);
    const repeatedRolls = range.filter((roll) => rolls.includes(roll));
    if (repeatedRolls.length > 0) {
      setRollRangeError((current) =>
        createFieldError(
          `El rango incluye rollos ya cargados: ${formatRepeatedCodes(repeatedRolls)}.`,
          current,
        ),
      );
      return;
    }

    const wasAdded = onAddRollRange(rollFrom, rollTo);
    if (!wasAdded) {
      setRollRangeError((current) =>
        createFieldError("No se pudo agregar el rango. Revisá los valores ingresados.", current),
      );
      return;
    }

    setRollFrom("");
    setRollTo("");
    setRollRangeError(undefined);
  };

  return (
    <section className="space-y-5">
      <div className="min-w-0">
        <div className="text-[19px] font-semibold tracking-tight text-foreground sm:text-[21px]">
          Rollos del material
        </div>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
          Cargá los rollos de este material por rango.
        </p>
      </div>

      <div className="rounded-lg border border-border/80 bg-background/35 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Agregar rollos
        </div>
        <div
          key={rollRangeError?.nonce}
          className={cn(
            "mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)_160px] md:items-center",
            rollRangeError && "reception-error-shake",
          )}
        >
          <Input
            value={rollFrom}
            onChange={(event) => {
              setRollFrom(event.target.value);
              setRollRangeError(undefined);
            }}
            placeholder="Desde"
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={Boolean(rollRangeError)}
            className={cn(
              "reception-field h-10 text-[13px]",
              rollRangeError && "reception-field-error",
            )}
          />
          <ChevronRight className="hidden h-4 w-4 justify-self-center text-muted-foreground md:block" />
          <Input
            value={rollTo}
            onChange={(event) => {
              setRollTo(event.target.value);
              setRollRangeError(undefined);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addRange();
              }
            }}
            placeholder="Hasta"
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={Boolean(rollRangeError)}
            className={cn(
              "reception-field h-10 text-[13px]",
              rollRangeError && "reception-field-error",
            )}
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
        <ValidationMessage error={rollRangeError} />
      </div>

      {rolls.length === 0 ? (
        <EmptyTraceState
          icon={Layers3}
          title="Sin rollos"
          message="Agregá el rango de rollos incluido en este material."
          className="py-6"
        />
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {rolls.map((roll) => (
            <span
              key={roll}
              className="flex h-8 min-w-10 items-center justify-center rounded-md border border-border/80 bg-background/45 px-2.5 font-mono text-[12.5px] text-foreground"
            >
              {roll}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function AddPaletPanel({
  value,
  error,
  onValueChange,
  onAdd,
}: {
  value: string;
  error?: FieldError;
  onValueChange: (value: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-background/35 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        Agregar palet a este lote
      </div>
      <div
        key={error?.nonce}
        className={cn(
          "mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px]",
          error && "reception-error-shake",
        )}
      >
        <Input
          placeholder="N° palet (ej. 1)"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          inputMode="numeric"
          autoComplete="off"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAdd();
            }
          }}
          aria-invalid={Boolean(error)}
          className={cn(
            "reception-field h-10 font-mono text-[13px]",
            error && "reception-field-error",
          )}
        />
        <Button
          type="button"
          className="h-10 bg-[#5E6AD2] text-white hover:bg-[#6875E8]"
          onClick={onAdd}
        >
          <Plus className="h-4 w-4" />
          Palet
        </Button>
      </div>
      <ValidationMessage error={error} />
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
  const [newPaletError, setNewPaletError] = useState<FieldError | undefined>();
  const batchCount = getLotBatchCount(lot);

  const addPalet = () => {
    const code = normalizeTraceCode(newPaletCode);
    if (!code) {
      setNewPaletError((current) => createFieldError("Ingresá el número de palet.", current));
      return;
    }

    if (parsePositiveInteger(code) === undefined) {
      setNewPaletError((current) =>
        createFieldError("El palet debe ser un número mayor a cero.", current),
      );
      return;
    }

    if (lot.palets.some((palet) => palet.code.toLowerCase() === code.toLowerCase())) {
      setNewPaletError((current) =>
        createFieldError(`El palet ${code} ya está cargado en este lote.`, current),
      );
      return;
    }

    const wasAdded = onAddPalet(newPaletCode);
    if (!wasAdded) {
      setNewPaletError((current) =>
        createFieldError("No se pudo agregar el palet. Revisá el número ingresado.", current),
      );
      return;
    }

    setNewPaletCode("");
    setNewPaletError(undefined);
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
                error={newPaletError}
                onValueChange={(value) => {
                  setNewPaletCode(value);
                  setNewPaletError(undefined);
                }}
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
                error={newPaletError}
                onValueChange={(value) => {
                  setNewPaletCode(value);
                  setNewPaletError(undefined);
                }}
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
  const [batchRangeError, setBatchRangeError] = useState<FieldError | undefined>();

  const addRange = () => {
    const from = batchFrom.trim();
    const to = batchTo.trim();

    if (!from || !to) {
      setBatchRangeError((current) =>
        createFieldError("Completá el batch inicial y el batch final.", current),
      );
      return;
    }

    const start = parsePositiveInteger(from);
    const end = parsePositiveInteger(to);

    if (start === undefined || end === undefined) {
      setBatchRangeError((current) =>
        createFieldError("Los batches deben ser números mayores a cero.", current),
      );
      return;
    }

    if (end < start) {
      setBatchRangeError((current) =>
        createFieldError("El batch final debe ser mayor o igual al batch inicial.", current),
      );
      return;
    }

    const range = createBatchRange(from, to);
    const repeatedBatches = range.filter((batch) => palet.batches.includes(batch));
    if (repeatedBatches.length > 0) {
      setBatchRangeError((current) =>
        createFieldError(
          `El rango incluye batches ya cargados: ${formatRepeatedBatches(repeatedBatches)}.`,
          current,
        ),
      );
      return;
    }

    const wasAdded = onAddBatchRange(batchFrom, batchTo);
    if (!wasAdded) {
      setBatchRangeError((current) =>
        createFieldError("No se pudo agregar el rango. Revisá los valores ingresados.", current),
      );
      return;
    }

    setBatchFrom("");
    setBatchTo("");
    setBatchRangeError(undefined);
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
          <div
            key={batchRangeError?.nonce}
            className={cn(
              "mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)_160px] md:items-center",
              batchRangeError && "reception-error-shake",
            )}
          >
            <Input
              value={batchFrom}
              onChange={(event) => {
                setBatchFrom(event.target.value);
                setBatchRangeError(undefined);
              }}
              placeholder="Desde"
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={Boolean(batchRangeError)}
              className={cn(
                "reception-field h-10 text-[13px]",
                batchRangeError && "reception-field-error",
              )}
            />
            <ChevronRight className="hidden h-4 w-4 justify-self-center text-muted-foreground md:block" />
            <Input
              value={batchTo}
              onChange={(event) => {
                setBatchTo(event.target.value);
                setBatchRangeError(undefined);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addRange();
                }
              }}
              placeholder="Hasta"
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={Boolean(batchRangeError)}
              className={cn(
                "reception-field h-10 text-[13px]",
                batchRangeError && "reception-field-error",
              )}
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
          <ValidationMessage error={batchRangeError} />

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

function RollTraceCountSummary({ rolls }: { rolls: number }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground sm:justify-end">
      <span>
        <strong className="font-semibold text-foreground">{rolls}</strong>{" "}
        {pluralize(rolls, "rollo", "rollos")}
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
        const material = getMaterialByCode(receiptMaterial.materialCode);
        const isRollMaterial = isRollTraceabilityMaterial(material);
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
              {isRollMaterial ? (
                <span className="text-[12.5px] text-muted-foreground">
                  ({receiptMaterial.rolls.length}{" "}
                  {pluralize(receiptMaterial.rolls.length, "rollo", "rollos")})
                </span>
              ) : (
                <span className="text-[12.5px] text-muted-foreground">
                  ({receiptMaterial.lots.length}{" "}
                  {pluralize(receiptMaterial.lots.length, "lote", "lotes")}, {totalPalets}{" "}
                  {pluralize(totalPalets, "palet", "palets")}, {totalBatches} batches)
                </span>
              )}
            </div>

            {isRollMaterial ? (
              <RollsTraceabilitySummary rolls={receiptMaterial.rolls} />
            ) : (
              <TraceabilitySummary lots={receiptMaterial.lots} />
            )}
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

function RollsTraceabilitySummary({ rolls }: { rolls: string[] }) {
  if (rolls.length === 0) {
    return (
      <div className="mt-4 rounded-md border border-dashed border-border/80 bg-background/30 px-3 py-3 text-[12.5px] text-muted-foreground">
        Sin rollos registrados.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <Layers3 className="h-4 w-4 text-[#A8B1FF]" />
        <span className="font-mono text-[13.5px] font-semibold text-foreground">Rollos</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {rolls.map((roll) => (
          <span
            key={roll}
            className="flex h-7 min-w-8 items-center justify-center rounded-md border border-border/80 bg-background/45 px-2 font-mono text-[12px] text-foreground"
          >
            {roll}
          </span>
        ))}
      </div>
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
  const traceMetricCards = getReceiptTraceMetricCards(receiptMaterials);
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

      {traceMetricCards.length > 0 ? (
        <div
          className={cn(
            "mt-4 grid gap-3",
            traceMetricCards.length === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {traceMetricCards.map((metric) => (
            <LiveMetric key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>
      ) : null}
    </aside>
  );
}

function LiveMaterialSummary({ receiptMaterial }: { receiptMaterial: ReceiptMaterial }) {
  const material = getMaterialByCode(receiptMaterial.materialCode);
  const isRollMaterial = isRollTraceabilityMaterial(material);

  return (
    <div className="rounded-lg border border-border/80 bg-background/35 p-4">
      <div className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
        <Boxes className="h-4 w-4 text-[#A8B1FF]" />
        Recepción Material {receiptMaterial.materialCode}
      </div>

      <div className="mt-4 border-t border-border/70 pt-4">
        {isRollMaterial ? (
          receiptMaterial.rolls.length === 0 ? (
            <div className="text-[12px] text-muted-foreground">Sin rollos registrados</div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-[#A8B1FF]" />
                <span className="font-mono text-[13.5px] font-semibold text-foreground">
                  Rollos
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {receiptMaterial.rolls.map((roll) => (
                  <span
                    key={roll}
                    className="flex h-7 min-w-8 items-center justify-center rounded-md border border-border/80 bg-card/60 px-2 font-mono text-[12px] text-foreground"
                  >
                    {roll}
                  </span>
                ))}
              </div>
            </div>
          )
        ) : receiptMaterial.lots.length === 0 ? (
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

function createFieldError(message: string, current?: FieldError) {
  return {
    message,
    nonce: (current?.nonce ?? 0) + 1,
  };
}

function getMaterialByCode(code: string) {
  return materials.find((material) => material.code === code);
}

function isRollTraceabilityMaterial(material?: Material) {
  return material?.traceability.length === 1 && material.traceability[0] === "Rollo";
}

function isLotTraceabilityMaterial(material?: Material) {
  return Boolean(material?.traceability.includes("Lote"));
}

function getReceiptTraceMetricCards(receiptMaterials: ReceiptMaterial[]) {
  if (receiptMaterials.length === 0) {
    return [];
  }

  const hasLotMaterials = receiptMaterials.some((entry) =>
    isLotTraceabilityMaterial(getMaterialByCode(entry.materialCode)),
  );
  const hasRollMaterials = receiptMaterials.some((entry) =>
    isRollTraceabilityMaterial(getMaterialByCode(entry.materialCode)),
  );
  const metrics = {
    materials: { label: "Materiales", value: String(receiptMaterials.length) },
    lots: { label: "Lotes", value: String(getReceiptTotalLots(receiptMaterials)) },
    palets: { label: "Palets", value: String(getReceiptTotalPalets(receiptMaterials)) },
    batches: { label: "Batches", value: String(getReceiptTotalBatches(receiptMaterials)) },
    rolls: { label: "Rollos", value: String(getReceiptTotalRolls(receiptMaterials)) },
  };
  const baseMetrics = [metrics.materials];

  if (hasLotMaterials && hasRollMaterials) {
    return [...baseMetrics, metrics.lots, metrics.palets, metrics.batches, metrics.rolls];
  }

  if (hasRollMaterials) {
    return [...baseMetrics, metrics.rolls];
  }

  if (hasLotMaterials) {
    return [...baseMetrics, metrics.lots, metrics.palets, metrics.batches];
  }

  return baseMetrics;
}

function getFinalMetricGridMaxWidth(metricCount: number) {
  if (metricCount === 1) return "20rem";
  if (metricCount === 4) return "42rem";
  return "48rem";
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

function parsePositiveInteger(value: string) {
  const trimmedValue = value.trim();
  if (!/^\d+$/.test(trimmedValue)) return undefined;

  const parsedValue = Number.parseInt(trimmedValue, 10);
  return parsedValue > 0 ? parsedValue : undefined;
}

function createBatchRange(from: string, to: string) {
  return createNumberRange(from, to);
}

function createNumberRange(from: string, to: string) {
  const start = parsePositiveInteger(from);
  const end = parsePositiveInteger(to);
  if (start === undefined || end === undefined || end < start) {
    return [];
  }

  return Array.from({ length: end - start + 1 }, (_, index) => String(start + index));
}

function mergeBatches(current: string[], next: string[]) {
  return mergeNumericCodes(current, next);
}

function mergeNumericCodes(current: string[], next: string[]) {
  return Array.from(new Set([...current, ...next])).sort((a, b) => Number(a) - Number(b));
}

function formatRepeatedBatches(batches: string[]) {
  return formatRepeatedCodes(batches);
}

function formatRepeatedCodes(batches: string[]) {
  const visibleBatches = batches.slice(0, 5).join(", ");
  return batches.length > 5 ? `${visibleBatches} y ${batches.length - 5} más` : visibleBatches;
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

function getReceiptTotalRolls(receiptMaterials: ReceiptMaterial[]) {
  return receiptMaterials.reduce((total, entry) => total + entry.rolls.length, 0);
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

function ValidationMessage({ error }: { error?: FieldError }) {
  if (!error) return null;

  return <p className="mt-2 text-[12px] font-medium text-red-400">{error.message}</p>;
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
