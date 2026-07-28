import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Boxes,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  Hash,
  Info,
  Layers3,
  PackageSearch,
  Plus,
  ScanLine,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recepcion")({
  component: ReceptionRoute,
});

const steps = [
  { number: 1, label: "Paso 1", title: "Remito", icon: FileText },
  { number: 2, label: "Paso 2", title: "Material", icon: PackageSearch },
  { number: 3, label: "Paso 3", title: "Trazabilidad", icon: ScanLine },
  { number: 4, label: "Paso 4", title: "Confirmar", icon: ShieldCheck },
];

const materials = [
  {
    code: "2006/1",
    name: "Caucho banda 2006/1",
    provider: "Química del Sur",
    type: "Compuesto de caucho",
    traceability: ["Lote", "Palet", "Batch"],
  },
  {
    code: "2008/2",
    name: "Caucho banda 2008/2",
    provider: "Química del Sur",
    type: "Compuesto de caucho",
    traceability: ["Lote", "Palet", "Batch"],
  },
  {
    code: "2010/2",
    name: "Caucho banda 2010/2",
    provider: "Química del Sur",
    type: "Compuesto de caucho",
    traceability: ["Lote", "Palet", "Batch"],
  },
  {
    code: "Tela Firestone",
    name: "Tela Firestone",
    provider: "Textiles Norte",
    type: "Tela",
    traceability: ["Número de rollo"],
  },
  {
    code: "Tela Flex",
    name: "Tela Flex",
    provider: "Textiles Norte",
    type: "Tela",
    traceability: ["Número de rollo"],
  },
];

const remitoNumber = "R-0087421";

type TracePalet = {
  id: string;
  code: string;
  batches: string[];
  expanded: boolean;
};

function ReceptionRoute() {
  const [activeStep, setActiveStep] = useState(1);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [selectedMaterialCode, setSelectedMaterialCode] = useState("2006/1");
  const [lotNumber, setLotNumber] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [newPaletCode, setNewPaletCode] = useState("");
  const [tracePalets, setTracePalets] = useState<TracePalet[]>([]);
  const selectedMaterial =
    materials.find((material) => material.code === selectedMaterialCode) ?? materials[0];
  const statusLabel = isConfirmed
    ? "Ingreso confirmado"
    : activeStep === 1
      ? "Remito en edición"
      : activeStep === 2
        ? "Material en edición"
        : activeStep === 3
          ? "Trazabilidad en edición"
          : "Recepción lista para confirmar";
  const handleMaterialChange = (value: string) => {
    setSelectedMaterialCode(value);
    setLotNumber("");
    setRollNumber("");
    setNewPaletCode("");
    setTracePalets([]);
  };

  const addPalet = () => {
    const code = normalizeTraceCode(newPaletCode);
    if (!code) return;

    setTracePalets((current) => {
      if (current.some((palet) => palet.code.toLowerCase() === code.toLowerCase())) {
        return current;
      }

      return [
        ...current.map((palet) => ({ ...palet, expanded: false })),
        {
          id: `${code}-${Date.now()}`,
          code,
          batches: [],
          expanded: true,
        },
      ];
    });
    setNewPaletCode("");
  };

  const removePalet = (paletId: string) => {
    setTracePalets((current) => current.filter((palet) => palet.id !== paletId));
  };

  const togglePalet = (paletId: string) => {
    setTracePalets((current) =>
      current.map((palet) =>
        palet.id === paletId ? { ...palet, expanded: !palet.expanded } : palet,
      ),
    );
  };

  const addBatchRange = (paletId: string, from: string, to: string) => {
    const range = createBatchRange(from, to);
    if (range.length === 0) return false;

    setTracePalets((current) =>
      current.map((palet) =>
        palet.id === paletId ? { ...palet, batches: mergeBatches(palet.batches, range) } : palet,
      ),
    );
    return true;
  };

  const resetReception = () => {
    setIsConfirmed(false);
    setActiveStep(1);
    setSelectedMaterialCode("2006/1");
    setLotNumber("");
    setRollNumber("");
    setNewPaletCode("");
    setTracePalets([]);
  };

  const handlePrimaryAction = () => {
    if (activeStep < 4) {
      setActiveStep((current) => current + 1);
      return;
    }

    setIsConfirmed(true);
  };

  return (
    <section className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-lg border border-border/80 bg-card shadow-2xl shadow-black/35">
          <header className="border-b border-border/70 px-5 py-5 sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#A8B1FF]">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Recepción
                </div>
                <h1 className="text-[24px] font-semibold tracking-tight text-foreground sm:text-[28px]">
                  {isConfirmed ? "Ingreso registrado" : "Nuevo ingreso de materia prima"}
                </h1>
                <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
                  {isConfirmed
                    ? "El material queda pendiente de aprobación de Calidad."
                    : activeStep === 1 &&
                      "Cargá el remito, elegí el proveedor y registrá las observaciones iniciales."}
                  {!isConfirmed &&
                    activeStep === 2 &&
                    "Cargá el remito, elegí el material y revisá la trazabilidad requerida."}
                  {!isConfirmed &&
                    activeStep === 3 &&
                    "Cargá los identificadores y revisá la trazabilidad en vivo."}
                  {!isConfirmed &&
                    activeStep === 4 &&
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

            {!isConfirmed ? (
              <ol className="linear-scrollbar mt-7 flex items-center gap-4 overflow-x-auto pb-1">
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

          <form onSubmit={(event) => event.preventDefault()}>
            <div className="min-h-[390px] px-5 py-7 sm:px-8 lg:px-12">
              {isConfirmed ? (
                <ConfirmedStep
                  selectedMaterial={selectedMaterial}
                  remito={remitoNumber}
                  lotNumber={lotNumber}
                  rollNumber={rollNumber}
                  palets={tracePalets}
                  onRegisterAnother={resetReception}
                />
              ) : (
                <>
                  {activeStep === 1 && <RemitoStep />}
                  {activeStep === 2 && (
                    <MaterialStep
                      selectedMaterial={selectedMaterial}
                      selectedMaterialCode={selectedMaterialCode}
                      onMaterialChange={handleMaterialChange}
                    />
                  )}
                  {activeStep === 3 && (
                    <TraceabilityStep
                      selectedMaterial={selectedMaterial}
                      remito={remitoNumber}
                      lotNumber={lotNumber}
                      rollNumber={rollNumber}
                      newPaletCode={newPaletCode}
                      palets={tracePalets}
                      onLotNumberChange={setLotNumber}
                      onRollNumberChange={setRollNumber}
                      onNewPaletCodeChange={setNewPaletCode}
                      onAddPalet={addPalet}
                      onRemovePalet={removePalet}
                      onTogglePalet={togglePalet}
                      onAddBatchRange={addBatchRange}
                    />
                  )}
                  {activeStep === 4 && (
                    <ConfirmStep
                      selectedMaterial={selectedMaterial}
                      remito={remitoNumber}
                      lotNumber={lotNumber}
                      rollNumber={rollNumber}
                      palets={tracePalets}
                    />
                  )}
                </>
              )}
            </div>

            {!isConfirmed ? (
              <footer className="border-t border-border/70 bg-background/35 px-5 py-4 sm:px-8">
                <div
                  className={cn(
                    "mx-auto flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between",
                    activeStep >= 3 ? "max-w-5xl" : "max-w-4xl",
                  )}
                >
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

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#A8B1FF]" />
                      {statusLabel}
                    </div>
                    <Button
                      type="button"
                      className="h-10 bg-[#5E6AD2] px-5 text-white hover:bg-[#6875E8]"
                      onClick={handlePrimaryAction}
                    >
                      {activeStep === 4 ? "Confirmar" : "Continuar"}
                      {activeStep === 4 ? (
                        <ShieldCheck className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
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

function RemitoStep() {
  return (
    <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
      <FieldBlock id="remito" label="N° de remito" required>
        <Input
          id="remito"
          defaultValue={remitoNumber}
          className="reception-field h-11 font-mono text-[13.5px]"
        />
      </FieldBlock>

      <FieldBlock id="fecha-recepcion" label="Fecha de recepción" required>
        <div className="relative">
          <Input
            id="fecha-recepcion"
            type="text"
            inputMode="numeric"
            defaultValue="27/07/2026"
            className="reception-field h-11 pr-10 text-[13.5px]"
          />
          <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </FieldBlock>

      <FieldBlock id="proveedor" label="Proveedor" required className="md:col-span-2">
        <Select defaultValue="quimica-del-sur">
          <SelectTrigger id="proveedor" className="reception-select-trigger h-11 text-[13.5px]">
            <SelectValue placeholder="Seleccionar proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cauchos-del-plata">Cauchos del Plata</SelectItem>
            <SelectItem value="textiles-norte">Textiles Norte</SelectItem>
            <SelectItem value="quimica-del-sur">Química del Sur</SelectItem>
          </SelectContent>
        </Select>
      </FieldBlock>

      <FieldBlock id="observaciones" label="Observaciones" className="md:col-span-2">
        <Textarea
          id="observaciones"
          placeholder="Notas sobre la recepción, condiciones del transporte, etc."
          className="reception-field min-h-28 resize-none text-[13.5px]"
        />
      </FieldBlock>
    </div>
  );
}

function MaterialStep({
  selectedMaterial,
  selectedMaterialCode,
  onMaterialChange,
}: {
  selectedMaterial: (typeof materials)[number];
  selectedMaterialCode: string;
  onMaterialChange: (value: string) => void;
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <FieldBlock id="material" label="Material" required>
        <Select value={selectedMaterialCode} onValueChange={onMaterialChange}>
          <SelectTrigger id="material" className="reception-select-trigger h-14 text-[13.5px]">
            <SelectValue placeholder="Seleccionar material" />
          </SelectTrigger>
          <SelectContent>
            {materials.map((material) => (
              <SelectItem
                key={material.code}
                value={material.code}
                textValue={materialLabel(material)}
              >
                <span className="text-[13.5px] font-semibold text-foreground">
                  {materialLabel(material)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldBlock>

      <div className="mt-6 rounded-lg border border-[#5E6AD2]/45 bg-[#5E6AD2]/10 p-5">
        <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-foreground">
          <Info className="h-4 w-4 text-[#A8B1FF]" />
          Trazabilidad requerida para este material
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {selectedMaterial.traceability.map((level, index) => (
            <div key={level} className="flex items-center gap-2">
              <span className="rounded-md border border-[#5E6AD2]/55 bg-background/50 px-3 py-1.5 text-[13px] font-semibold text-foreground">
                {level}
              </span>
              {index < selectedMaterial.traceability.length - 1 && (
                <ChevronRight className="h-4 w-4 text-[#A8B1FF]" />
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground">
          En el próximo paso vas a cargar los identificadores para cada nivel.
        </p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <MaterialMeta label="Proveedor" value={selectedMaterial.provider} />
        <MaterialMeta label="Tipo" value={selectedMaterial.type} />
        <MaterialMeta label="Código" value={selectedMaterial.code} mono />
      </div>
    </div>
  );
}

function TraceabilityStep({
  selectedMaterial,
  remito,
  lotNumber,
  rollNumber,
  newPaletCode,
  palets,
  onLotNumberChange,
  onRollNumberChange,
  onNewPaletCodeChange,
  onAddPalet,
  onRemovePalet,
  onTogglePalet,
  onAddBatchRange,
}: {
  selectedMaterial: (typeof materials)[number];
  remito: string;
  lotNumber: string;
  rollNumber: string;
  newPaletCode: string;
  palets: TracePalet[];
  onLotNumberChange: (value: string) => void;
  onRollNumberChange: (value: string) => void;
  onNewPaletCodeChange: (value: string) => void;
  onAddPalet: () => void;
  onRemovePalet: (paletId: string) => void;
  onTogglePalet: (paletId: string) => void;
  onAddBatchRange: (paletId: string, from: string, to: string) => boolean;
}) {
  const isFabric = selectedMaterial.type === "Tela";

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-5">
        {isFabric ? (
          <FabricTraceabilityForm rollNumber={rollNumber} onRollNumberChange={onRollNumberChange} />
        ) : (
          <BandTraceabilityForm
            selectedMaterial={selectedMaterial}
            lotNumber={lotNumber}
            newPaletCode={newPaletCode}
            palets={palets}
            onLotNumberChange={onLotNumberChange}
            onNewPaletCodeChange={onNewPaletCodeChange}
            onAddPalet={onAddPalet}
            onRemovePalet={onRemovePalet}
            onTogglePalet={onTogglePalet}
            onAddBatchRange={onAddBatchRange}
          />
        )}
      </div>

      <LiveTraceabilityPanel
        selectedMaterial={selectedMaterial}
        remito={remito}
        isFabric={isFabric}
        lotNumber={lotNumber}
        rollNumber={rollNumber}
        palets={palets}
      />
    </div>
  );
}

function ConfirmedStep({
  selectedMaterial,
  remito,
  lotNumber,
  rollNumber,
  palets,
  onRegisterAnother,
}: {
  selectedMaterial: (typeof materials)[number];
  remito: string;
  lotNumber: string;
  rollNumber: string;
  palets: TracePalet[];
  onRegisterAnother: () => void;
}) {
  const isFabric = selectedMaterial.type === "Tela";
  const totalBatches = palets.reduce((total, palet) => total + palet.batches.length, 0);
  const totalPalets = palets.length;
  const displayLot = lotNumber.trim() || "Sin lote";
  const displayRoll = rollNumber.trim() || "Sin rollo";
  const traceSummary = isFabric ? `Rollo ${displayRoll}` : `Lote ${displayLot}`;

  return (
    <div className="mx-auto flex min-h-[520px] max-w-3xl flex-col items-center justify-center py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#5E6AD2]/45 bg-[#5E6AD2]/10">
        <CheckCircle2 className="h-8 w-8 text-[#A8B1FF]" strokeWidth={1.8} />
      </div>

      <h2 className="mt-7 text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px]">
        Ingreso registrado
      </h2>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
        Remito <span className="font-semibold text-foreground">{remito}</span> -{" "}
        <span className="font-medium text-foreground">{selectedMaterial.name}</span>.
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground/90">{traceSummary}</span> pendiente de
        aprobación de Calidad.
      </p>

      <div className="mt-8 grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
        <LiveMetric label="Palets" value={String(totalPalets)} />
        <LiveMetric label="Batchs" value={String(totalBatches)} />
      </div>

      <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <Button asChild variant="secondary" className="h-10 flex-1">
          <Link to="/">Finalizar turno</Link>
        </Button>
        <Button
          type="button"
          className="h-10 flex-1 bg-[#5E6AD2] text-white hover:bg-[#6875E8]"
          onClick={onRegisterAnother}
        >
          Registrar otro ingreso
        </Button>
      </div>
    </div>
  );
}

function ConfirmStep({
  selectedMaterial,
  remito,
  lotNumber,
  rollNumber,
  palets,
}: {
  selectedMaterial: (typeof materials)[number];
  remito: string;
  lotNumber: string;
  rollNumber: string;
  palets: TracePalet[];
}) {
  const isFabric = selectedMaterial.type === "Tela";
  const totalBatches = palets.reduce((total, palet) => total + palet.batches.length, 0);
  const displayLot = lotNumber.trim() || "Sin lote";
  const displayRoll = rollNumber.trim() || "Sin rollo";
  const lotSummary = `${palets.length} ${palets.length === 1 ? "palet" : "palets"}, ${totalBatches} ${
    totalBatches === 1 ? "batch" : "batches"
  }`;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="rounded-lg border border-[#5E6AD2]/45 bg-[#5E6AD2]/10 p-5">
        <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-foreground">
          <ShieldCheck className="h-4 w-4 text-[#A8B1FF]" />
          Resumen del ingreso
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          Revisá remito, proveedor, material y trazabilidad antes de confirmar la recepción.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <MaterialMeta label="Remito" value={remito} mono />
        <MaterialMeta label="Proveedor" value={selectedMaterial.provider} />
        <MaterialMeta label="Material" value={selectedMaterial.name} />
        <MaterialMeta label="Tipo" value={selectedMaterial.type} />
      </div>

      <section className="rounded-lg border border-border/80 bg-background/35 p-5">
        <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-foreground">
          <Boxes className="h-4 w-4 text-[#A8B1FF]" />
          Trazabilidad
        </div>

        {isFabric ? (
          <div className="mt-4 rounded-md border border-border/70 bg-card/60 px-4 py-3">
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <Hash className="h-3.5 w-3.5 text-[#A8B1FF]" />
              Número de rollo
            </div>
            <div className="mt-2 font-mono text-[15px] font-semibold text-foreground">
              {displayRoll}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-border/70 bg-card/60 px-4 py-3">
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <FileText className="h-3.5 w-3.5 text-[#A8B1FF]" />
              Lote
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-mono text-[15px] font-semibold text-foreground">
                {displayLot}
              </span>
              <span className="text-[12.5px] text-muted-foreground">({lotSummary})</span>
            </div>

            {palets.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed border-border/80 bg-background/30 px-3 py-2 text-[12.5px] text-muted-foreground">
                Sin palets registrados.
              </div>
            ) : (
              <div className="mt-4 space-y-4 border-l border-border/80 pl-4">
                {palets.map((palet) => (
                  <div key={palet.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Layers3 className="h-4 w-4 text-[#A8B1FF]" />
                      <span className="font-mono text-[13.5px] font-semibold text-foreground">
                        Palet {palet.code}
                      </span>
                      <span className="text-[12px] text-muted-foreground">
                        {palet.batches.length} batches
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
        )}
      </section>
    </div>
  );
}

function BandTraceabilityForm({
  selectedMaterial,
  lotNumber,
  newPaletCode,
  palets,
  onLotNumberChange,
  onNewPaletCodeChange,
  onAddPalet,
  onRemovePalet,
  onTogglePalet,
  onAddBatchRange,
}: {
  selectedMaterial: (typeof materials)[number];
  lotNumber: string;
  newPaletCode: string;
  palets: TracePalet[];
  onLotNumberChange: (value: string) => void;
  onNewPaletCodeChange: (value: string) => void;
  onAddPalet: () => void;
  onRemovePalet: (paletId: string) => void;
  onTogglePalet: (paletId: string) => void;
  onAddBatchRange: (paletId: string, from: string, to: string) => boolean;
}) {
  return (
    <>
      <FieldBlock id="lote" label="N° de lote" required>
        <Input
          id="lote"
          value={lotNumber}
          onChange={(event) => onLotNumberChange(event.target.value)}
          placeholder="Ej. L-25-2323"
          className="reception-field h-11 max-w-sm font-mono text-[13.5px]"
        />
      </FieldBlock>

      <div className="rounded-lg border border-border/80 bg-background/30 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Agregar palet
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px]">
          <Input
            placeholder="N° palet (ej. P-03)"
            value={newPaletCode}
            onChange={(event) => onNewPaletCodeChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAddPalet();
              }
            }}
            className="reception-field h-10 font-mono text-[13px]"
          />
          <Button
            type="button"
            variant="secondary"
            className="h-10 bg-secondary/80 text-foreground hover:bg-accent"
            onClick={onAddPalet}
          >
            <Plus className="h-4 w-4" />
            Agregar palet
          </Button>
        </div>
      </div>

      {palets.length === 0 ? (
        <EmptyTraceState message="Todavía no hay palets registrados para este lote." />
      ) : (
        palets.map((palet) => (
          <PaletTraceCard
            key={palet.id}
            palet={palet}
            selectedMaterial={selectedMaterial}
            onRemove={() => onRemovePalet(palet.id)}
            onToggle={() => onTogglePalet(palet.id)}
            onAddBatchRange={(from, to) => onAddBatchRange(palet.id, from, to)}
          />
        ))
      )}
    </>
  );
}

function PaletTraceCard({
  palet,
  selectedMaterial,
  onRemove,
  onToggle,
  onAddBatchRange,
}: {
  palet: TracePalet;
  selectedMaterial: (typeof materials)[number];
  onRemove: () => void;
  onToggle: () => void;
  onAddBatchRange: (from: string, to: string) => boolean;
}) {
  const [batchFrom, setBatchFrom] = useState("");
  const [batchTo, setBatchTo] = useState("");

  const addRange = () => {
    onAddBatchRange(batchFrom, batchTo);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-card/70">
      <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
        <Layers3 className="h-4 w-4 text-[#A8B1FF]" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-[13.5px] font-semibold text-foreground">
              Palet {palet.code}
            </span>
            <span className="text-[12px] text-muted-foreground">
              {palet.batches.length} batches
            </span>
          </div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">
            {selectedMaterial.code} · {selectedMaterial.type}
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
              className="reception-field h-10 text-[13px]"
            />
            <Button
              type="button"
              className="h-10 bg-[#5E6AD2] text-white hover:bg-[#6875E8]"
              onClick={addRange}
            >
              <Plus className="h-4 w-4" />
              Agregar rango
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

function EmptyTraceState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/80 bg-background/25 px-4 py-8 text-center">
      <Layers3 className="mx-auto h-5 w-5 text-[#A8B1FF]" />
      <div className="mt-3 text-[13px] font-medium text-foreground">Carga desde cero</div>
      <p className="mt-1 text-[12.5px] text-muted-foreground">{message}</p>
    </div>
  );
}

function FabricTraceabilityForm({
  rollNumber,
  onRollNumberChange,
}: {
  rollNumber: string;
  onRollNumberChange: (value: string) => void;
}) {
  return (
    <>
      <FieldBlock id="numero-rollo" label="Número de rollo" required>
        <Input
          id="numero-rollo"
          value={rollNumber}
          onChange={(event) => onRollNumberChange(event.target.value)}
          placeholder="Ej. ROL-FIR-0142"
          className="reception-field h-11 max-w-md font-mono text-[13.5px]"
        />
      </FieldBlock>

      <div className="rounded-lg border border-[#5E6AD2]/45 bg-[#5E6AD2]/10 p-5">
        <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-foreground">
          <Info className="h-4 w-4 text-[#A8B1FF]" />
          Trazabilidad requerida para este material
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          Este material tiene un único nivel de trazabilidad. Registrá el número de rollo de la tela
          recibida.
        </p>
      </div>
    </>
  );
}

function LiveTraceabilityPanel({
  selectedMaterial,
  remito,
  isFabric,
  lotNumber,
  rollNumber,
  palets,
}: {
  selectedMaterial: (typeof materials)[number];
  remito: string;
  isFabric: boolean;
  lotNumber: string;
  rollNumber: string;
  palets: TracePalet[];
}) {
  const totalBatches = palets.reduce((total, palet) => total + palet.batches.length, 0);
  const displayLot = lotNumber.trim() || "Sin lote";
  const displayRoll = rollNumber.trim() || "Sin rollo";

  return (
    <aside className="min-w-0">
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Resumen
        </div>
        <div className="mt-3 grid gap-2">
          <LiveContext icon={FileText} label="Remito" value={remito} mono />
          <LiveContext icon={Building2} label="Proveedor" value={selectedMaterial.provider} />
        </div>
      </div>

      <div className="rounded-lg border border-border/80 bg-background/35 p-4">
        <div className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <Boxes className="h-4 w-4 text-[#A8B1FF]" />
          {selectedMaterial.name}
        </div>

        <div className="mt-4 border-t border-border/70 pt-4">
          {isFabric ? (
            <div className="flex items-start gap-2">
              <Hash className="mt-0.5 h-4 w-4 text-[#A8B1FF]" />
              <div>
                <div className="font-mono text-[13px] font-semibold text-foreground">
                  Rollo {displayRoll}
                </div>
                <div className="mt-1 text-[12px] text-muted-foreground">
                  1 nivel de trazabilidad
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 text-[#A8B1FF]" />
                <div>
                  <div className="font-mono text-[13px] font-semibold text-foreground">
                    Lote {displayLot}
                  </div>
                  {palets.length === 0 ? (
                    <div className="mt-2 text-[12px] text-muted-foreground">
                      Sin palets registrados
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2 border-l border-border/80 pl-4">
                      {palets.map((palet) => (
                        <div key={palet.id} className="flex items-start gap-2">
                          <Layers3 className="mt-0.5 h-4 w-4 text-[#A8B1FF]" />
                          <div>
                            <div className="font-mono text-[13px] font-semibold text-foreground">
                              Palet {palet.code}
                            </div>
                            <div className="mt-0.5 text-[12px] text-muted-foreground">
                              {palet.batches.length} batches
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {isFabric ? (
          <>
            <LiveMetric label="Niveles" value="1" />
            <LiveMetric label="Rollo" value={displayRoll} mono />
          </>
        ) : (
          <>
            <LiveMetric label="Palets" value={String(palets.length)} />
            <LiveMetric label="Batches" value={String(totalBatches)} />
          </>
        )}
      </div>
    </aside>
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
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
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

function materialLabel(material: (typeof materials)[number]) {
  if (material.type === "Tela") return material.name;
  return `${material.code} — ${material.name}`;
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
      <div className="flex min-w-0 items-center gap-3">
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
