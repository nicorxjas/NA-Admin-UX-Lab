import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Boxes,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileSearch,
  FileText,
  Layers3,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";

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

export const Route = createFileRoute("/calidad")({
  component: QualityRoute,
});

const bandMaterials = [
  {
    code: "2006/1",
    provider: "Química del Sur",
    description: "Banda slick A",
  },
  {
    code: "2008/1",
    provider: "Química del Sur",
    description: "Banda lluvia B",
  },
];

const receivedBandLots: Record<string, ReceivedLot[]> = {
  "2006/1": [
    {
      id: "lot-2006-24",
      code: "24",
      remito: "R-0087421",
      receivedAt: "2026-08-04",
      palets: [
        {
          id: "palet-2006-24-1",
          code: "1",
          batches: createBatchList(1, 6),
        },
        {
          id: "palet-2006-24-2",
          code: "2",
          batches: createBatchList(7, 12),
        },
        {
          id: "palet-2006-24-3",
          code: "3",
          batches: createBatchList(13, 18),
        },
      ],
    },
    {
      id: "lot-2006-25",
      code: "25",
      remito: "R-0087459",
      receivedAt: "2026-08-04",
      palets: [
        {
          id: "palet-2006-25-1",
          code: "1",
          batches: createBatchList(1, 5),
        },
        {
          id: "palet-2006-25-2",
          code: "2",
          batches: createBatchList(6, 10),
        },
      ],
    },
  ],
  "2008/1": [
    {
      id: "lot-2008-31",
      code: "31",
      remito: "R-0087480",
      receivedAt: "2026-08-04",
      palets: [
        {
          id: "palet-2008-31-1",
          code: "1",
          batches: createBatchList(1, 4),
        },
        {
          id: "palet-2008-31-2",
          code: "2",
          batches: createBatchList(5, 8),
        },
      ],
    },
  ],
};

type ReceivedBatch = {
  id: string;
  code: string;
};

type ReceivedPalet = {
  id: string;
  code: string;
  batches: ReceivedBatch[];
};

type ReceivedLot = {
  id: string;
  code: string;
  remito: string;
  receivedAt: string;
  palets: ReceivedPalet[];
};

type BatchStatus = "accepted" | "rejected";
type RollupStatus = "pending" | "partial" | "accepted" | "rejected";

type BatchDecision = {
  status?: BatchStatus;
  observation: string;
};

type BatchDecisionMap = Record<string, BatchDecision>;

type SelectedBatch = {
  lotId: string;
  paletId: string;
  batchId: string;
};

function QualityRoute() {
  const [materialCode, setMaterialCode] = useState(bandMaterials[0]?.code ?? "");
  const [lotQuery, setLotQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<SelectedBatch | undefined>();
  const [batchDecisions, setBatchDecisions] = useState<BatchDecisionMap>({});
  const [finishedInspectionKey, setFinishedInspectionKey] = useState<string | undefined>();

  const selectedMaterial = getMaterialByCode(materialCode);
  const currentLot = useMemo(
    () => findReceivedLot(materialCode, lotQuery),
    [materialCode, lotQuery],
  );
  const currentBatch = selectedBatch ? findBatchInLot(currentLot, selectedBatch) : undefined;
  const selectedPalet = selectedBatch
    ? findPaletInLot(currentLot, selectedBatch.paletId)
    : undefined;
  const selectedDecision = selectedBatch
    ? batchDecisions[getBatchDecisionKey(selectedBatch)]
    : undefined;
  const totals = currentLot ? getQualityTotals(currentLot, batchDecisions) : undefined;
  const currentInspectionKey = currentLot
    ? getInspectionKey(materialCode, currentLot.id)
    : undefined;
  const isInspectionComplete = Boolean(
    totals && totals.pending === 0 && totals.accepted + totals.rejected > 0,
  );
  const isInspectionFinished = Boolean(
    currentInspectionKey && finishedInspectionKey === currentInspectionKey,
  );
  const isLotRequested = lotQuery.trim().length > 0;

  useEffect(() => {
    if (!currentLot) {
      setSelectedBatch(undefined);
      return;
    }

    setSelectedBatch((current) => {
      if (current && current.lotId === currentLot.id && findBatchInLot(currentLot, current)) {
        return current;
      }

      return getFirstBatchSelection(currentLot);
    });
  }, [currentLot]);

  const updateMaterial = (value: string) => {
    setMaterialCode(value);
    setLotQuery("");
    setSelectedBatch(undefined);
    setFinishedInspectionKey(undefined);
  };

  const selectPalet = (palet: ReceivedPalet) => {
    const firstBatch = palet.batches[0];
    if (!currentLot || !firstBatch) return;

    setSelectedBatch({
      lotId: currentLot.id,
      paletId: palet.id,
      batchId: firstBatch.id,
    });
  };

  const selectBatch = (palet: ReceivedPalet, batch: ReceivedBatch) => {
    if (!currentLot) return;

    setSelectedBatch({
      lotId: currentLot.id,
      paletId: palet.id,
      batchId: batch.id,
    });
  };

  const moveSelectedBatch = (direction: -1 | 1) => {
    if (!currentLot || !selectedBatch) return;

    const nextSelection = getAdjacentBatchSelection(currentLot, selectedBatch, direction);
    if (nextSelection) {
      setSelectedBatch(nextSelection);
    }
  };

  const updateBatchStatus = (status: BatchStatus) => {
    if (!selectedBatch) return;

    const key = getBatchDecisionKey(selectedBatch);
    setFinishedInspectionKey(undefined);
    setBatchDecisions((current) => ({
      ...current,
      [key]: {
        observation: current[key]?.observation ?? "",
        status,
      },
    }));
  };

  const updateObservation = (observation: string) => {
    if (!selectedBatch) return;

    const key = getBatchDecisionKey(selectedBatch);
    setFinishedInspectionKey(undefined);
    setBatchDecisions((current) => ({
      ...current,
      [key]: {
        observation,
        status: current[key]?.status,
      },
    }));
  };

  useEffect(() => {
    if (!currentLot || !selectedBatch) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isQualityShortcutBlocked(event.target)) return;

      if (event.key === "ArrowRight") {
        const nextSelection = getAdjacentBatchSelection(currentLot, selectedBatch, 1);
        if (!nextSelection) return;

        event.preventDefault();
        setSelectedBatch(nextSelection);
        return;
      }

      if (event.key === "ArrowLeft") {
        const nextSelection = getAdjacentBatchSelection(currentLot, selectedBatch, -1);
        if (!nextSelection) return;

        event.preventDefault();
        setSelectedBatch(nextSelection);
        return;
      }

      const normalizedKey = event.key.toLowerCase();
      if (normalizedKey !== "a" && normalizedKey !== "r") return;

      event.preventDefault();
      const key = getBatchDecisionKey(selectedBatch);
      const status: BatchStatus = normalizedKey === "a" ? "accepted" : "rejected";

      setFinishedInspectionKey(undefined);
      setBatchDecisions((current) => ({
        ...current,
        [key]: {
          observation: current[key]?.observation ?? "",
          status,
        },
      }));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentLot, selectedBatch]);

  const canMoveBackward = Boolean(
    currentLot && selectedBatch && getAdjacentBatchSelection(currentLot, selectedBatch, -1),
  );
  const canMoveForward = Boolean(
    currentLot && selectedBatch && getAdjacentBatchSelection(currentLot, selectedBatch, 1),
  );

  const finishInspection = () => {
    if (!currentLot || !selectedMaterial || !totals || !isInspectionComplete) return;

    const payload = buildQualityInspectionPayload({
      materialCode,
      materialDescription: selectedMaterial.description,
      lot: currentLot,
      decisions: batchDecisions,
      totals,
    });

    console.info("quality-inspection-ready-for-db", payload);
    setFinishedInspectionKey(getInspectionKey(materialCode, currentLot.id));
  };

  return (
    <section className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl items-center justify-center">
        <div className="flex min-h-[calc(100vh-2.5rem)] w-full flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-2xl shadow-black/35">
          <header className="border-b border-border/70 px-5 py-5 sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#A8B1FF]">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Calidad
                </div>
                <h1 className="text-[24px] font-semibold tracking-tight text-foreground sm:text-[28px]">
                  Nuevo control de calidad
                </h1>
                <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
                  Seleccioná una banda recibida, buscá el lote y aceptá o rechazá cada batch.
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
          </header>

          <form
            className="flex flex-1 flex-col"
            autoComplete="off"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="flex-1 px-5 py-7 sm:px-8 lg:px-10">
              <div className="mx-auto grid max-w-6xl gap-6 lg:min-h-[640px] lg:grid-cols-2 lg:items-stretch">
                <div className="min-w-0 overflow-hidden rounded-lg border border-border/80 bg-background/35 lg:min-h-[640px]">
                  <QualityLookup
                    lotQuery={lotQuery}
                    materialCode={materialCode}
                    onLotQueryChange={setLotQuery}
                    onMaterialChange={updateMaterial}
                  />

                  <QualityTracePanel
                    lot={currentLot}
                    lotQuery={lotQuery}
                    material={selectedMaterial}
                    isLotRequested={isLotRequested}
                    batchDecisions={batchDecisions}
                    selectedBatch={selectedBatch}
                    onSelectPalet={selectPalet}
                    onSelectBatch={selectBatch}
                  />
                </div>

                <BatchDecisionPanel
                  batch={currentBatch}
                  palet={selectedPalet}
                  lot={currentLot}
                  decision={selectedDecision}
                  totals={totals}
                  isInspectionComplete={isInspectionComplete}
                  isInspectionFinished={isInspectionFinished}
                  canMoveBackward={canMoveBackward}
                  canMoveForward={canMoveForward}
                  onMoveBackward={() => moveSelectedBatch(-1)}
                  onMoveForward={() => moveSelectedBatch(1)}
                  onStatusChange={updateBatchStatus}
                  onObservationChange={updateObservation}
                  onFinishInspection={finishInspection}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function QualityLookup({
  lotQuery,
  materialCode,
  onLotQueryChange,
  onMaterialChange,
}: {
  lotQuery: string;
  materialCode: string;
  onLotQueryChange: (value: string) => void;
  onMaterialChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-4 border-b border-border/70 px-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <FieldBlock id="material-calidad" label="Material">
        <Select value={materialCode} onValueChange={onMaterialChange}>
          <SelectTrigger className="reception-select-trigger h-11 text-left text-[13px] data-[placeholder]:text-muted-foreground">
            <SelectValue placeholder="Seleccionar material" />
          </SelectTrigger>
          <SelectContent>
            {bandMaterials.map((material) => (
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
      </FieldBlock>

      <FieldBlock id="lote-calidad" label="N° de lote">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8B1FF]" />
          <Input
            id="lote-calidad"
            value={lotQuery}
            onChange={(event) => onLotQueryChange(event.target.value)}
            placeholder="Ej: 24"
            inputMode="numeric"
            autoComplete="off"
            className="reception-field h-11 pl-9 font-mono text-[13.5px]"
          />
        </div>
      </FieldBlock>
    </div>
  );
}

function QualityTracePanel({
  lot,
  lotQuery,
  material,
  isLotRequested,
  batchDecisions,
  selectedBatch,
  onSelectPalet,
  onSelectBatch,
}: {
  lot?: ReceivedLot;
  lotQuery: string;
  material?: (typeof bandMaterials)[number];
  isLotRequested: boolean;
  batchDecisions: BatchDecisionMap;
  selectedBatch?: SelectedBatch;
  onSelectPalet: (palet: ReceivedPalet) => void;
  onSelectBatch: (palet: ReceivedPalet, batch: ReceivedBatch) => void;
}) {
  if (!isLotRequested) {
    return (
      <div className="p-4">
        <EmptyQualityState
          icon={FileSearch}
          title="Sin lote seleccionado"
          message="Ingresá el número de lote para ver los palets y batches recibidos."
          className="min-h-[440px]"
        />
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="p-4">
        <EmptyQualityState
          icon={FileSearch}
          title="Lote no encontrado"
          message={`No hay recepción cargada para el lote ${lotQuery.trim()} de ${material?.code ?? "este material"}.`}
          className="min-h-[440px]"
        />
      </div>
    );
  }

  const lotStatus = getLotQualityStatus(lot, batchDecisions);
  const batchCount = getLotBatchCount(lot);

  return (
    <section className="min-w-0">
      <div className="grid gap-3 border-b border-border/70 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <FileText className="h-4 w-4 shrink-0 text-[#A8B1FF]" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[16px] font-semibold text-foreground">
                Lote {lot.code}
              </span>
              <StatusBadge status={lotStatus} />
            </div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              Remito {lot.remito} · {formatDate(lot.receivedAt)}
            </div>
          </div>
        </div>

        <TraceCountSummary palets={lot.palets.length} batches={batchCount} />
      </div>

      <div className="space-y-3 px-4 py-4 sm:px-5">
        {lot.palets.map((palet) => (
          <QualityPaletCard
            key={palet.id}
            lot={lot}
            palet={palet}
            batchDecisions={batchDecisions}
            selectedBatch={selectedBatch}
            onSelectPalet={() => onSelectPalet(palet)}
            onSelectBatch={(batch) => onSelectBatch(palet, batch)}
          />
        ))}
      </div>
    </section>
  );
}

function QualityPaletCard({
  lot,
  palet,
  batchDecisions,
  selectedBatch,
  onSelectPalet,
  onSelectBatch,
}: {
  lot: ReceivedLot;
  palet: ReceivedPalet;
  batchDecisions: BatchDecisionMap;
  selectedBatch?: SelectedBatch;
  onSelectPalet: () => void;
  onSelectBatch: (batch: ReceivedBatch) => void;
}) {
  const paletStatus = getPaletQualityStatus(palet, lot.id, batchDecisions);
  const isSelectedPalet = selectedBatch?.lotId === lot.id && selectedBatch.paletId === palet.id;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-card/70 transition-colors",
        isSelectedPalet ? "border-[#A8B1FF]/70" : "border-border/80",
      )}
    >
      <button
        type="button"
        className="grid w-full gap-3 px-4 py-3 text-left sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
        onClick={onSelectPalet}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Layers3 className="h-4 w-4 shrink-0 text-[#A8B1FF]" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[13.5px] font-semibold text-foreground">
                Palet {palet.code}
              </span>
              <StatusBadge status={paletStatus} compact />
            </div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              {palet.batches.length} batches
            </div>
          </div>
        </div>
      </button>

      <div className="border-t border-border/70 px-4 py-4">
        <div className="flex flex-wrap gap-1.5">
          {palet.batches.map((batch) => {
            const key = getBatchDecisionKey({
              lotId: lot.id,
              paletId: palet.id,
              batchId: batch.id,
            });
            const decision = batchDecisions[key];
            const isSelected =
              selectedBatch?.lotId === lot.id &&
              selectedBatch.paletId === palet.id &&
              selectedBatch.batchId === batch.id;

            return (
              <BatchTile
                key={batch.id}
                batch={batch}
                status={decision?.status}
                isSelected={isSelected}
                onClick={() => onSelectBatch(batch)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BatchTile({
  batch,
  status,
  isSelected,
  onClick,
}: {
  batch: ReceivedBatch;
  status?: BatchStatus;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={`Batch ${batch.code}`}
      className={cn(
        "flex h-8 min-w-8 items-center justify-center rounded-md border px-2 font-mono text-[12px] font-semibold transition-colors",
        status === "accepted" &&
          "border-emerald-400/70 bg-emerald-400/18 text-emerald-200 hover:bg-emerald-400/24",
        status === "rejected" && "border-red-400/75 bg-red-400/18 text-red-200 hover:bg-red-400/24",
        !status &&
          "border-border/80 bg-background/45 text-foreground hover:border-[#A8B1FF]/60 hover:bg-[#5E6AD2]/10",
        isSelected && "ring-2 ring-[#A8B1FF]/70 ring-offset-2 ring-offset-card",
      )}
      onClick={onClick}
    >
      {batch.code}
    </button>
  );
}

function BatchDecisionPanel({
  batch,
  palet,
  lot,
  decision,
  totals,
  isInspectionComplete,
  isInspectionFinished,
  canMoveBackward,
  canMoveForward,
  onMoveBackward,
  onMoveForward,
  onStatusChange,
  onObservationChange,
  onFinishInspection,
}: {
  batch?: ReceivedBatch;
  palet?: ReceivedPalet;
  lot?: ReceivedLot;
  decision?: BatchDecision;
  totals?: QualityTotals;
  isInspectionComplete: boolean;
  isInspectionFinished: boolean;
  canMoveBackward: boolean;
  canMoveForward: boolean;
  onMoveBackward: () => void;
  onMoveForward: () => void;
  onStatusChange: (status: BatchStatus) => void;
  onObservationChange: (value: string) => void;
  onFinishInspection: () => void;
}) {
  return (
    <aside className="flex min-w-0 lg:min-h-[640px]">
      <div className="flex w-full flex-col overflow-hidden rounded-lg border border-border/80 bg-background/35 lg:min-h-[640px]">
        <div className="border-b border-border/70 px-4 py-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-foreground">
            <Boxes className="h-4 w-4 text-[#A8B1FF]" />
            Batch
          </div>
          {lot && palet ? (
            <div className="mt-1 text-[12px] text-muted-foreground">
              Lote {lot.code} · Palet {palet.code}
            </div>
          ) : null}
        </div>

        {batch ? (
          <div className="flex flex-1 flex-col px-5 py-6">
            <div className="flex flex-1 flex-col justify-center">
              <div className="grid w-full grid-cols-[64px_minmax(0,1fr)_64px] items-center gap-6">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-16 w-16 rounded-md border-border/80 bg-card/70"
                  onClick={onMoveBackward}
                  disabled={!canMoveBackward}
                  title="Batch anterior"
                >
                  <ChevronLeft className="!h-6 !w-6" />
                </Button>

                <div className="min-w-0 text-center">
                  <div
                    className={cn(
                      "mx-auto flex h-36 w-36 items-center justify-center rounded-lg border border-[#A8B1FF]/40 bg-[#5E6AD2]/12 font-mono text-[72px] font-semibold leading-none text-foreground shadow-inner shadow-black/20",
                      decision?.status === "accepted" &&
                        "border-emerald-300/80 bg-emerald-400/22 text-emerald-100",
                      decision?.status === "rejected" &&
                        "border-red-300/85 bg-red-400/22 text-red-100",
                    )}
                  >
                    {batch.code}
                  </div>
                  <StatusLine status={decision?.status} />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-16 w-16 rounded-md border-border/80 bg-card/70"
                  onClick={onMoveForward}
                  disabled={!canMoveForward}
                  title="Batch siguiente"
                >
                  <ChevronRight className="!h-6 !w-6" />
                </Button>
              </div>

              <div className="mt-8 flex justify-center gap-8">
                <Button
                  type="button"
                  className={cn(
                    "h-20 w-20 rounded-lg bg-emerald-500 text-emerald-950 hover:bg-emerald-400 [&_svg]:!h-7 [&_svg]:!w-7",
                    decision?.status === "accepted" && "ring-2 ring-emerald-200/80",
                  )}
                  onClick={() => onStatusChange("accepted")}
                  title="Aceptar batch"
                >
                  <Check />
                </Button>
                <Button
                  type="button"
                  className={cn(
                    "h-20 w-20 rounded-lg bg-red-500 text-white hover:bg-red-400 [&_svg]:!h-7 [&_svg]:!w-7",
                    decision?.status === "rejected" && "ring-2 ring-red-200/80",
                  )}
                  onClick={() => onStatusChange("rejected")}
                  title="Rechazar batch"
                >
                  <XCircle />
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <Label
                htmlFor="batch-observaciones"
                className="text-[12px] font-semibold text-muted-foreground"
              >
                Observaciones
              </Label>
              <Textarea
                id="batch-observaciones"
                value={decision?.observation ?? ""}
                onChange={(event) => onObservationChange(event.target.value)}
                placeholder="Observaciones del control"
                className="reception-field mt-2 min-h-32 resize-none text-[13px]"
              />
            </div>

            {totals ? (
              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/70 pt-4">
                <QualityMetric label="Aprobados" value={totals.accepted} tone="accepted" />
                <QualityMetric label="Rechazados" value={totals.rejected} tone="rejected" />
                <QualityMetric label="Pendientes" value={totals.pending} />
              </div>
            ) : null}

            <div className="mt-4 border-t border-border/70 pt-4">
              <Button
                type="button"
                className={cn(
                  "h-12 w-full rounded-lg border text-[13px] font-semibold transition-colors",
                  isInspectionComplete
                    ? "border-[#5E6AD2] bg-[#5E6AD2] text-white hover:bg-[#6875E8]"
                    : "border-border/80 bg-card/45 text-muted-foreground hover:bg-card/45",
                  isInspectionFinished && "border-emerald-400 bg-emerald-500 text-emerald-950",
                )}
                disabled={!isInspectionComplete}
                onClick={onFinishInspection}
              >
                <ClipboardCheck className="h-4 w-4" />
                {isInspectionFinished ? "Inspección terminada" : "Terminar inspección"}
              </Button>
              {!isInspectionComplete ? (
                <p className="mt-2 text-center text-[12px] text-muted-foreground">
                  Tratá todos los batches para habilitar el cierre.
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-4">
            <EmptyQualityState
              icon={ClipboardCheck}
              title="Sin batch activo"
              message="Seleccioná un lote y un palet para iniciar el control."
              className="w-full"
            />
          </div>
        )}
      </div>
    </aside>
  );
}

function FieldBlock({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <Label htmlFor={id} className="text-[12px] font-semibold text-muted-foreground">
        {label}
      </Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function EmptyQualityState({
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
        "rounded-lg border border-dashed border-border/80 bg-background/25 px-4 py-10 text-center",
        className,
      )}
    >
      <Icon className="mx-auto h-7 w-7 text-[#A8B1FF]" />
      <div className="mt-4 text-[14px] font-semibold text-foreground">{title}</div>
      <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function StatusBadge({ status, compact }: { status: RollupStatus; compact?: boolean }) {
  const labels: Record<RollupStatus, string> = {
    pending: "Pendiente",
    partial: "Parcial",
    accepted: "Aprobado",
    rejected: "Rechazado",
  };

  return (
    <span
      className={cn(
        "rounded-md border px-2 py-0.5 font-medium",
        compact ? "text-[10.5px]" : "text-[11px]",
        status === "pending" && "border-border/80 bg-background/40 text-muted-foreground",
        status === "partial" && "border-amber-400/50 bg-amber-400/12 text-amber-200",
        status === "accepted" && "border-emerald-400/50 bg-emerald-400/12 text-emerald-200",
        status === "rejected" && "border-red-400/60 bg-red-400/14 text-red-200",
      )}
    >
      {labels[status]}
    </span>
  );
}

function StatusLine({ status }: { status?: BatchStatus }) {
  if (status === "accepted") {
    return (
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-emerald-200">
        <CheckCircle2 className="h-4 w-4" />
        Aprobado
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-red-200">
        <XCircle className="h-4 w-4" />
        Rechazado
      </div>
    );
  }

  return <div className="mt-3 text-center text-[12.5px] text-muted-foreground">Pendiente</div>;
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

function QualityMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: BatchStatus;
}) {
  return (
    <div className="rounded-md border border-border/70 bg-card/60 px-3 py-2 text-center">
      <div
        className={cn(
          "font-semibold",
          tone === "accepted" && "text-emerald-200",
          tone === "rejected" && "text-red-200",
          !tone && "text-foreground",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function getMaterialByCode(code: string) {
  return bandMaterials.find((material) => material.code === code);
}

function findReceivedLot(materialCode: string, lotQuery: string) {
  const normalizedLot = normalizeTraceCode(lotQuery);
  if (!normalizedLot) return undefined;

  return receivedBandLots[materialCode]?.find(
    (lot) => normalizeTraceCode(lot.code) === normalizedLot,
  );
}

function findPaletInLot(lot: ReceivedLot | undefined, paletId: string) {
  return lot?.palets.find((palet) => palet.id === paletId);
}

function findBatchInLot(lot: ReceivedLot | undefined, selectedBatch: SelectedBatch) {
  return findPaletInLot(lot, selectedBatch.paletId)?.batches.find(
    (batch) => batch.id === selectedBatch.batchId,
  );
}

function getFirstBatchSelection(lot: ReceivedLot): SelectedBatch | undefined {
  return getOrderedBatchSelections(lot)[0];
}

function getAdjacentBatchSelection(
  lot: ReceivedLot,
  selectedBatch: SelectedBatch,
  direction: -1 | 1,
) {
  const selections = getOrderedBatchSelections(lot);
  const currentIndex = selections.findIndex(
    (selection) =>
      selection.lotId === selectedBatch.lotId &&
      selection.paletId === selectedBatch.paletId &&
      selection.batchId === selectedBatch.batchId,
  );
  if (currentIndex < 0) return undefined;

  const nextIndex = (currentIndex + direction + selections.length) % selections.length;
  return selections[nextIndex];
}

function getOrderedBatchSelections(lot: ReceivedLot): SelectedBatch[] {
  return lot.palets.flatMap((palet) =>
    palet.batches.map((batch) => ({
      lotId: lot.id,
      paletId: palet.id,
      batchId: batch.id,
    })),
  );
}

function getBatchDecisionKey(selection: SelectedBatch) {
  return `${selection.lotId}:${selection.paletId}:${selection.batchId}`;
}

function getBatchDecisionStatus(
  lotId: string,
  paletId: string,
  batchId: string,
  decisions: BatchDecisionMap,
) {
  return decisions[getBatchDecisionKey({ lotId, paletId, batchId })]?.status;
}

function getPaletQualityStatus(
  palet: ReceivedPalet,
  lotId: string,
  decisions: BatchDecisionMap,
): RollupStatus {
  if (palet.batches.length === 0) return "pending";

  const statuses = palet.batches.map((batch) =>
    getBatchDecisionStatus(lotId, palet.id, batch.id, decisions),
  );

  if (statuses.every((status) => status === "rejected")) return "rejected";
  if (statuses.every((status) => status === "accepted")) return "accepted";
  if (statuses.some(Boolean)) return "partial";

  return "pending";
}

function getLotQualityStatus(lot: ReceivedLot, decisions: BatchDecisionMap): RollupStatus {
  if (lot.palets.length === 0) return "pending";

  const statuses = lot.palets.map((palet) => getPaletQualityStatus(palet, lot.id, decisions));

  if (statuses.every((status) => status === "rejected")) return "rejected";
  if (statuses.every((status) => status === "accepted")) return "accepted";
  if (statuses.some((status) => status !== "pending")) return "partial";

  return "pending";
}

type QualityTotals = {
  accepted: number;
  rejected: number;
  pending: number;
};

type QualityInspectionPayload = {
  materialCode: string;
  materialDescription: string;
  lotId: string;
  lotCode: string;
  remito: string;
  receivedAt: string;
  finishedAt: string;
  status: RollupStatus;
  totals: QualityTotals;
  palets: Array<{
    paletId: string;
    paletCode: string;
    status: RollupStatus;
    batches: Array<{
      batchId: string;
      batchCode: string;
      status: BatchStatus | "pending";
      observation: string;
    }>;
  }>;
};

function getQualityTotals(lot: ReceivedLot, decisions: BatchDecisionMap): QualityTotals {
  return lot.palets.reduce(
    (totals, palet) => {
      palet.batches.forEach((batch) => {
        const status = getBatchDecisionStatus(lot.id, palet.id, batch.id, decisions);
        if (status === "accepted") {
          totals.accepted += 1;
          return;
        }

        if (status === "rejected") {
          totals.rejected += 1;
          return;
        }

        totals.pending += 1;
      });

      return totals;
    },
    { accepted: 0, rejected: 0, pending: 0 },
  );
}

function buildQualityInspectionPayload({
  materialCode,
  materialDescription,
  lot,
  decisions,
  totals,
}: {
  materialCode: string;
  materialDescription: string;
  lot: ReceivedLot;
  decisions: BatchDecisionMap;
  totals: QualityTotals;
}): QualityInspectionPayload {
  return {
    materialCode,
    materialDescription,
    lotId: lot.id,
    lotCode: lot.code,
    remito: lot.remito,
    receivedAt: lot.receivedAt,
    finishedAt: new Date().toISOString(),
    status: getLotQualityStatus(lot, decisions),
    totals,
    palets: lot.palets.map((palet) => ({
      paletId: palet.id,
      paletCode: palet.code,
      status: getPaletQualityStatus(palet, lot.id, decisions),
      batches: palet.batches.map((batch) => {
        const key = getBatchDecisionKey({
          lotId: lot.id,
          paletId: palet.id,
          batchId: batch.id,
        });
        const decision = decisions[key];

        return {
          batchId: batch.id,
          batchCode: batch.code,
          status: decision?.status ?? "pending",
          observation: decision?.observation ?? "",
        };
      }),
    })),
  };
}

function getInspectionKey(materialCode: string, lotId: string) {
  return `${materialCode}:${lotId}`;
}

function isQualityShortcutBlocked(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const tagName = target.tagName.toLowerCase();
  if (tagName === "textarea" || tagName === "select") return true;

  return tagName === "input" && target.id !== "lote-calidad";
}

function getLotBatchCount(lot: ReceivedLot) {
  return lot.palets.reduce((total, palet) => total + palet.batches.length, 0);
}

function createBatchList(from: number, to: number): ReceivedBatch[] {
  return Array.from({ length: to - from + 1 }, (_, index) => {
    const code = String(from + index);
    return {
      id: `batch-${code}`,
      code,
    };
  });
}

function normalizeTraceCode(value: string) {
  return value.trim().replace(/\s+/g, "-").toUpperCase();
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function materialLabel(material: (typeof bandMaterials)[number]) {
  return `${material.code} · ${material.description}`;
}

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}
