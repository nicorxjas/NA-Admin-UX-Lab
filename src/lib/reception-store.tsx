import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export const receptionMaterialOptions = [
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
  {
    code: "Tela Flux",
    provider: "Telas S.A.",
    traceability: ["Rollo"],
  },
] as const;

export type ReceptionMaterialOption = (typeof receptionMaterialOptions)[number];

export type ReceptionTracePalet = {
  id: string;
  code: string;
  batches: string[];
  expanded: boolean;
};

export type ReceptionTraceLot = {
  id: string;
  code: string;
  palets: ReceptionTracePalet[];
  expanded: boolean;
};

export type ReceptionMaterialEntry = {
  id: string;
  materialCode: string;
  lots: ReceptionTraceLot[];
  rolls: string[];
  expanded: boolean;
};

export type ReceptionRecord = {
  id: string;
  remito: string;
  receptionDate: string;
  dateTime: string;
  materials: ReceptionMaterialEntry[];
};

export type ReceptionInput = {
  remito: string;
  receptionDate: string;
  materials: ReceptionMaterialEntry[];
};

export type ReceptionSummary = {
  id: string;
  remito: string;
  receptionDate: string;
  dateTime: string;
  traceMaterials: ReceptionMaterialEntry[];
  materials: string[];
  provider: string;
  rolls: number;
  lots: number;
  pallets: number;
  batch: number;
};

type ReceptionStore = {
  receptions: ReceptionRecord[];
  createReception: (input: ReceptionInput) => string;
  updateReception: (id: string, input: ReceptionInput) => void;
  deleteReception: (id: string) => void;
};

const ReceptionStoreContext = createContext<ReceptionStore | null>(null);

const initialReceptionRecords: ReceptionRecord[] = [
  {
    id: "REC-20260805-001",
    remito: "R-0087421",
    receptionDate: "2026-08-05",
    dateTime: "05/08/2026 09:24",
    materials: [
      {
        id: "material-rec-001-2006-1",
        materialCode: "2006/1",
        lots: [createLot("1001", 1, 1), createLot("1002", 4, 10)],
        rolls: [],
        expanded: false,
      },
      {
        id: "material-rec-001-2008-1",
        materialCode: "2008/1",
        lots: [createLot("2001", 7, 19), createLot("2002", 10, 28)],
        rolls: [],
        expanded: false,
      },
      {
        id: "material-rec-001-tela-flux",
        materialCode: "Tela Flux",
        lots: [],
        rolls: createCodeRange(101, 18),
        expanded: false,
      },
    ],
  },
  {
    id: "REC-20260805-002",
    remito: "R-0087422",
    receptionDate: "2026-08-05",
    dateTime: "05/08/2026 11:10",
    materials: [
      {
        id: "material-rec-002-2006-1",
        materialCode: "2006/1",
        lots: [createLot("3001", 21, 1), createLot("3002", 24, 10)],
        rolls: [],
        expanded: false,
      },
    ],
  },
  {
    id: "REC-20260805-003",
    remito: "R-0087423",
    receptionDate: "2026-08-05",
    dateTime: "05/08/2026 14:42",
    materials: [
      {
        id: "material-rec-003-tela-flux",
        materialCode: "Tela Flux",
        lots: [],
        rolls: createCodeRange(201, 24),
        expanded: false,
      },
    ],
  },
];

function makeReceptionId() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(
    2,
    "0",
  )}${String(now.getSeconds()).padStart(2, "0")}`;
  return `REC-${date}-${time}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function createLot(code: string, firstPalet: number, firstBatch: number): ReceptionTraceLot {
  return {
    id: `lot-${code}`,
    code,
    palets: Array.from({ length: 3 }, (_, index) => ({
      id: `palet-${code}-${firstPalet + index}`,
      code: String(firstPalet + index).padStart(2, "0"),
      batches: createCodeRange(firstBatch + index * 3, 3),
      expanded: false,
    })),
    expanded: false,
  };
}

function createCodeRange(start: number, count: number) {
  return Array.from({ length: count }, (_, index) => String(start + index));
}

export function ReceptionDataProvider({ children }: { children: ReactNode }) {
  const [receptions, setReceptions] = useState<ReceptionRecord[]>(() => initialReceptionRecords);

  const value = useMemo<ReceptionStore>(
    () => ({
      receptions,
      createReception: (input) => {
        const id = makeReceptionId();
        setReceptions((current) => [
          {
            id,
            remito: input.remito,
            receptionDate: input.receptionDate,
            dateTime: mergeReceptionDateTime(input.receptionDate),
            materials: createReceptionMaterialSnapshot(input.materials),
          },
          ...current,
        ]);
        return id;
      },
      updateReception: (id, input) => {
        setReceptions((current) =>
          current.map((reception) =>
            reception.id === id
              ? {
                  ...reception,
                  remito: input.remito,
                  receptionDate: input.receptionDate,
                  dateTime: mergeReceptionDateTime(input.receptionDate, reception.dateTime),
                  materials: createReceptionMaterialSnapshot(input.materials),
                }
              : reception,
          ),
        );
      },
      deleteReception: (id) => {
        setReceptions((current) => current.filter((reception) => reception.id !== id));
      },
    }),
    [receptions],
  );

  return <ReceptionStoreContext.Provider value={value}>{children}</ReceptionStoreContext.Provider>;
}

export function useReceptionData() {
  const context = useContext(ReceptionStoreContext);
  if (!context) {
    throw new Error("useReceptionData must be used inside ReceptionDataProvider");
  }
  return context;
}

export function createReceptionSummary(reception: ReceptionRecord): ReceptionSummary {
  const providers = Array.from(
    new Set(
      reception.materials
        .map((material) => getReceptionMaterialProvider(material.materialCode))
        .filter((provider): provider is string => Boolean(provider)),
    ),
  );

  return {
    id: reception.id,
    remito: reception.remito,
    receptionDate: reception.receptionDate,
    dateTime: reception.dateTime,
    traceMaterials: reception.materials,
    materials: reception.materials.map((material) => material.materialCode),
    provider: providers.join(", "),
    rolls: getReceiptTotalRolls(reception.materials),
    lots: getReceiptTotalLots(reception.materials),
    pallets: getReceiptTotalPallets(reception.materials),
    batch: getReceiptTotalBatches(reception.materials),
  };
}

export function createReceptionMaterialDrafts(
  materials: ReceptionMaterialEntry[],
  expandFirst = false,
) {
  return materials.map((material, materialIndex) => ({
    ...material,
    expanded: expandFirst && materialIndex === 0,
    lots: material.lots.map((lot, lotIndex) => ({
      ...lot,
      expanded: expandFirst && materialIndex === 0 && lotIndex === 0,
      palets: lot.palets.map((palet, paletIndex) => ({
        ...palet,
        batches: [...palet.batches],
        expanded: expandFirst && materialIndex === 0 && lotIndex === 0 && paletIndex === 0,
      })),
    })),
    rolls: [...material.rolls],
  }));
}

function createReceptionMaterialSnapshot(materials: ReceptionMaterialEntry[]) {
  return materials.map((material) => ({
    ...material,
    expanded: false,
    lots: material.lots.map((lot) => ({
      ...lot,
      expanded: false,
      palets: lot.palets.map((palet) => ({
        ...palet,
        batches: [...palet.batches],
        expanded: false,
      })),
    })),
    rolls: [...material.rolls],
  }));
}

export function getReceptionMaterialProvider(materialCode: string) {
  return receptionMaterialOptions.find((material) => material.code === materialCode)?.provider;
}

export function getReceiptTotalRolls(materials: ReceptionMaterialEntry[]) {
  return materials.reduce((total, material) => total + material.rolls.length, 0);
}

export function getReceiptTotalLots(materials: ReceptionMaterialEntry[]) {
  return materials.reduce((total, material) => total + material.lots.length, 0);
}

export function getReceiptTotalPallets(materials: ReceptionMaterialEntry[]) {
  return materials.reduce((total, material) => total + getMaterialPalletCount(material), 0);
}

export function getReceiptTotalBatches(materials: ReceptionMaterialEntry[]) {
  return materials.reduce((total, material) => total + getMaterialBatchCount(material), 0);
}

export function getMaterialPalletCount(material: ReceptionMaterialEntry) {
  return material.lots.reduce((total, lot) => total + lot.palets.length, 0);
}

export function getMaterialBatchCount(material: ReceptionMaterialEntry) {
  return material.lots.reduce((total, lot) => total + getLotBatchCount(lot), 0);
}

export function getLotBatchCount(lot: ReceptionTraceLot) {
  return lot.palets.reduce((total, palet) => total + palet.batches.length, 0);
}

function mergeReceptionDateTime(receptionDate: string, currentDateTime?: string) {
  const time = currentDateTime?.match(/\d{1,2}:\d{2}/)?.[0] ?? formatCurrentTime();
  return `${formatReceptionDate(receptionDate)} ${time}`;
}

function formatReceptionDate(receptionDate: string) {
  const [year, month, day] = receptionDate.split("-");
  if (!year || !month || !day) return receptionDate;
  return `${day}/${month}/${year}`;
}

function formatCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}
