import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Boxes, ChevronRight, FileText, Layers3, Plus, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recepcion")({
  component: ReceptionDashboardRoute,
});

type TracePallet = {
  code: string;
  batches: string[];
};

type TraceLot = {
  code: string;
  pallets: TracePallet[];
};

type ReceptionMaterialTrace = {
  code: string;
  provider: string;
  lots: TraceLot[];
  rolls: string[];
};

type ReceptionSeed = {
  id: string;
  remito: string;
  dateTime: string;
  traceMaterials: ReceptionMaterialTrace[];
};

type ReceptionSummary = ReceptionSeed & {
  materials: string[];
  provider: string;
  rolls: number;
  lots: number;
  pallets: number;
  batch: number;
};

const rawReceptionRows: ReceptionSeed[] = [
  {
    id: "REC-20260805-001",
    remito: "R-0087421",
    dateTime: "05/08/2026 09:24",
    traceMaterials: [
      {
        code: "2006/1",
        provider: "Química del Sur",
        lots: [createLot("1001", 1, 1), createLot("1002", 4, 10)],
        rolls: [],
      },
      {
        code: "2008/1",
        provider: "Química del Sur",
        lots: [createLot("2001", 7, 19), createLot("2002", 10, 28)],
        rolls: [],
      },
      {
        code: "Tela Flux",
        provider: "Telas S.A.",
        lots: [],
        rolls: createCodeRange(101, 18),
      },
    ],
  },
  {
    id: "REC-20260805-002",
    remito: "R-0087422",
    dateTime: "05/08/2026 11:10",
    traceMaterials: [
      {
        code: "2006/1",
        provider: "Química del Sur",
        lots: [createLot("3001", 21, 1), createLot("3002", 24, 10)],
        rolls: [],
      },
    ],
  },
  {
    id: "REC-20260805-003",
    remito: "R-0087423",
    dateTime: "05/08/2026 14:42",
    traceMaterials: [
      {
        code: "Tela Flux",
        provider: "Telas S.A.",
        lots: [],
        rolls: createCodeRange(201, 24),
      },
    ],
  },
];

const receptionRows: ReceptionSummary[] = rawReceptionRows.map(createReceptionSummary);

const dashboardCards = [
  { label: "Remitos", value: receptionRows.length },
  { label: "Rollos", value: sumReceptionValue("rolls") },
  { label: "Lotes", value: sumReceptionValue("lots") },
  { label: "Pallets", value: sumReceptionValue("pallets") },
  { label: "Batch", value: sumReceptionValue("batch") },
];

function ReceptionDashboardRoute() {
  const currentPath = useRouterState({ select: (state) => state.location.pathname });
  const [selectedReceptionId, setSelectedReceptionId] = useState<string | null>(null);
  const selectedReception = receptionRows.find((row) => row.id === selectedReceptionId);

  if (currentPath !== "/recepcion" && currentPath !== "/recepcion/") {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/70">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
            Dashboard Recepción
          </h1>
          <Button
            asChild
            size="sm"
            className="h-8 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
          >
            <Link to="/recepcion/nueva">
              <Plus className="h-3.5 w-3.5" />
              Nueva recepción
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-6 sm:px-8 lg:px-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {dashboardCards.map((card) => (
            <div key={card.label} className="rounded-lg border border-border/70 bg-card p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {card.label}
              </div>
              <div className="mt-2 font-mono text-[26px] font-semibold tracking-tight text-foreground">
                {card.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-border/70 bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] table-fixed border-collapse text-[13px]">
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[25%]" />
                <col className="w-[19%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border/70 bg-background/40">
                  <HeaderCell className="whitespace-nowrap">Fecha y hora</HeaderCell>
                  <HeaderCell>Materiales</HeaderCell>
                  <HeaderCell>Proveedor</HeaderCell>
                  <HeaderCell>Rollos</HeaderCell>
                  <HeaderCell>Lotes</HeaderCell>
                  <HeaderCell>Pallets</HeaderCell>
                  <HeaderCell>Batch</HeaderCell>
                </tr>
              </thead>
              <tbody>
                {receptionRows.map((row) => (
                  <tr
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver detalle de recepción ${row.remito}`}
                    className={cn(
                      "cursor-pointer border-b border-border/50 outline-none transition-colors last:border-0 hover:bg-accent/40 focus-visible:bg-accent/45 focus-visible:ring-1 focus-visible:ring-ring",
                      selectedReceptionId === row.id && "bg-accent/35",
                    )}
                    onClick={() => setSelectedReceptionId(row.id)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      setSelectedReceptionId(row.id);
                    }}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] text-foreground">
                      {row.dateTime}
                    </td>
                    <td className="px-4 py-3 text-foreground/90">
                      <div className="flex flex-wrap gap-1.5">
                        {row.materials.map((material) => (
                          <span
                            key={`${row.id}-${material}`}
                            className="rounded-md border border-border/70 bg-background/40 px-2 py-0.5 font-mono text-[11.5px] text-foreground"
                          >
                            {material}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="truncate px-4 py-3 text-foreground/90" title={row.provider}>
                      {row.provider}
                    </td>
                    <MetricCell value={row.rolls} />
                    <MetricCell value={row.lots} />
                    <MetricCell value={row.pallets} />
                    <MetricCell value={row.batch} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedReception ? (
        <ReceptionDetailSheet
          reception={selectedReception}
          open={Boolean(selectedReception)}
          onOpenChange={(open) => {
            if (!open) setSelectedReceptionId(null);
          }}
        />
      ) : null}
    </div>
  );
}

function ReceptionDetailSheet({
  reception,
  open,
  onOpenChange,
}: {
  reception: ReceptionSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-none overflow-visible border-border/80 bg-[#0e0f11] p-0 shadow-2xl [&>button:first-child]:hidden sm:w-[760px] sm:max-w-[760px]"
      >
        <SheetClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-7 top-6 z-[70] h-8 w-8 bg-[#0e0f11] text-muted-foreground hover:bg-accent/70 hover:text-foreground"
            title="Cerrar"
            aria-label="Cerrar detalle"
          >
            <X className="h-4 w-4" />
          </Button>
        </SheetClose>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute left-3 top-1/2 z-[60] h-9 w-9 -translate-y-1/2 rounded-full border border-border/80 bg-card text-muted-foreground shadow-lg hover:bg-accent/70 hover:text-foreground sm:-left-5"
          title="Minimizar"
          aria-label="Minimizar detalle"
          onClick={() => onOpenChange(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="h-full overflow-y-auto px-6 pb-8 pt-6">
          <SheetHeader className="pr-8">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8B1FF]">
              <FileText className="h-3.5 w-3.5" />
              Detalle Recepción
            </div>
            <SheetTitle className="text-[24px] font-semibold tracking-tight text-foreground">
              Remito Número {reception.remito}
            </SheetTitle>
            <SheetDescription className="text-[13px] leading-relaxed text-muted-foreground">
              Fecha de recepción · {reception.dateTime}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <DetailMeta label="Remito" value={reception.remito} mono />
            <DetailMeta label="Proveedor" value={reception.provider} />
            <DetailMeta label="Materiales" value={String(reception.materials.length)} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <PanelMetric label="Rollos" value={String(reception.rolls)} />
            <PanelMetric label="Lotes" value={String(reception.lots)} />
            <PanelMetric label="Pallets" value={String(reception.pallets)} />
            <PanelMetric label="Batch" value={String(reception.batch)} />
          </div>

          <DetailSection
            icon={<Boxes className="h-4 w-4 text-[#A8B1FF]" />}
            title="Trazabilidad"
          >
            <TraceMaterialsSummary materials={reception.traceMaterials} />
          </DetailSection>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TraceMaterialsSummary({ materials }: { materials: ReceptionMaterialTrace[] }) {
  if (materials.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/80 bg-background/30 px-3 py-3 text-[12.5px] text-muted-foreground">
        Sin materiales registrados.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {materials.map((material) => {
        const totalPallets = getMaterialPalletCount(material);
        const totalBatches = getMaterialBatchCount(material);
        const isRollMaterial = material.rolls.length > 0;

        return (
          <div key={material.code} className="rounded-md border border-border/70 bg-card/60 px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <div className="flex min-w-0 items-center gap-2">
                <Boxes className="h-3.5 w-3.5 shrink-0 text-[#A8B1FF]" />
                <span className="text-[15px] font-semibold text-foreground">
                  Recepción Material {material.code}
                </span>
              </div>
              {isRollMaterial ? (
                <span className="text-[12.5px] text-muted-foreground">
                  ({material.rolls.length} {pluralize(material.rolls.length, "rollo", "rollos")})
                </span>
              ) : (
                <span className="text-[12.5px] text-muted-foreground">
                  ({material.lots.length} {pluralize(material.lots.length, "lote", "lotes")},{" "}
                  {totalPallets} {pluralize(totalPallets, "pallet", "pallets")}, {totalBatches}{" "}
                  batches)
                </span>
              )}
            </div>

            {isRollMaterial ? (
              <RollsTraceabilitySummary rolls={material.rolls} />
            ) : (
              <LotsTraceabilitySummary lots={material.lots} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function LotsTraceabilitySummary({ lots }: { lots: TraceLot[] }) {
  if (lots.length === 0) {
    return (
      <div className="mt-4 rounded-md border border-dashed border-border/80 bg-background/30 px-3 py-3 text-[12.5px] text-muted-foreground">
        Sin lotes registrados.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {lots.map((lot) => (
        <div key={lot.code} className="rounded-md border border-border/70 bg-background/35 px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-3.5 w-3.5 shrink-0 text-[#A8B1FF]" />
              <span className="font-mono text-[15px] font-semibold text-foreground">
                Lote {lot.code}
              </span>
            </div>
            <span className="text-[12.5px] text-muted-foreground">
              ({lot.pallets.length} {pluralize(lot.pallets.length, "pallet", "pallets")},{" "}
              {getLotBatchCount(lot)} batches)
            </span>
          </div>

          <div className="mt-4 space-y-4 border-l border-border/80 pl-4">
            {lot.pallets.map((pallet) => (
              <div key={pallet.code}>
                <div className="flex flex-wrap items-center gap-2">
                  <Layers3 className="h-4 w-4 text-[#A8B1FF]" />
                  <span className="font-mono text-[13px] font-semibold text-foreground">
                    Pallet {pallet.code}
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    ({pallet.batches.length} batches)
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {pallet.batches.map((batch) => (
                    <span
                      key={`${pallet.code}-${batch}`}
                      className="flex h-7 min-w-8 items-center justify-center rounded-md border border-border/80 bg-card/60 px-2 font-mono text-[12px] text-foreground"
                    >
                      {batch}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RollsTraceabilitySummary({ rolls }: { rolls: string[] }) {
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

function DetailSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-6 rounded-lg border border-border/80 bg-background/35 p-5">
      <div className="mb-4 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-foreground">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

function DetailMeta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border/80 bg-background/35 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 truncate text-[13.5px] font-semibold text-foreground",
          mono && "font-mono",
        )}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function PanelMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/80 bg-background/35 p-3">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-[17px] font-semibold text-[#A8B1FF]">{value}</div>
    </div>
  );
}

function HeaderCell({ children, className }: { children: string; className?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  );
}

function MetricCell({ value }: { value: number }) {
  return <td className="px-4 py-3 font-mono text-[12.5px] text-foreground">{value}</td>;
}

function createReceptionSummary(seed: ReceptionSeed): ReceptionSummary {
  const providers = Array.from(new Set(seed.traceMaterials.map((material) => material.provider)));

  return {
    ...seed,
    materials: seed.traceMaterials.map((material) => material.code),
    provider: providers.join(", "),
    rolls: getReceiptTotalRolls(seed.traceMaterials),
    lots: getReceiptTotalLots(seed.traceMaterials),
    pallets: getReceiptTotalPallets(seed.traceMaterials),
    batch: getReceiptTotalBatches(seed.traceMaterials),
  };
}

function createLot(code: string, firstPallet: number, firstBatch: number): TraceLot {
  return {
    code,
    pallets: Array.from({ length: 3 }, (_, index) => ({
      code: String(firstPallet + index).padStart(2, "0"),
      batches: createCodeRange(firstBatch + index * 3, 3),
    })),
  };
}

function createCodeRange(start: number, count: number) {
  return Array.from({ length: count }, (_, index) => String(start + index));
}

function getReceiptTotalRolls(materials: ReceptionMaterialTrace[]) {
  return materials.reduce((total, material) => total + material.rolls.length, 0);
}

function getReceiptTotalLots(materials: ReceptionMaterialTrace[]) {
  return materials.reduce((total, material) => total + material.lots.length, 0);
}

function getReceiptTotalPallets(materials: ReceptionMaterialTrace[]) {
  return materials.reduce((total, material) => total + getMaterialPalletCount(material), 0);
}

function getReceiptTotalBatches(materials: ReceptionMaterialTrace[]) {
  return materials.reduce((total, material) => total + getMaterialBatchCount(material), 0);
}

function getMaterialPalletCount(material: ReceptionMaterialTrace) {
  return material.lots.reduce((total, lot) => total + lot.pallets.length, 0);
}

function getMaterialBatchCount(material: ReceptionMaterialTrace) {
  return material.lots.reduce((total, lot) => total + getLotBatchCount(lot), 0);
}

function getLotBatchCount(lot: TraceLot) {
  return lot.pallets.reduce((total, pallet) => total + pallet.batches.length, 0);
}

function sumReceptionValue(key: "rolls" | "lots" | "pallets" | "batch") {
  return receptionRows.reduce((total, row) => total + row[key], 0);
}

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}
