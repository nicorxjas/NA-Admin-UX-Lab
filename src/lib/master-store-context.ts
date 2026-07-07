import { createContext, useContext } from "react";
import type { MasterKey, MasterRecord, MasterState, PrimitiveValue } from "@/lib/mock-data";

export type MasterInput = Record<string, PrimitiveValue>;

export type MasterStore = {
  masters: MasterState;
  createRecord: (key: MasterKey, values: MasterInput) => void;
  updateRecord: (key: MasterKey, id: string, values: MasterInput) => void;
  setRecordActive: (key: MasterKey, id: string, activo: boolean) => void;
};

export const MasterStoreContext = createContext<MasterStore | null>(null);

export function useMasterData() {
  const context = useContext(MasterStoreContext);
  if (!context) {
    throw new Error("useMasterData must be used inside MasterDataProvider");
  }
  return context;
}

export type MasterSystemFields = Pick<
  MasterRecord,
  | "id"
  | "activo"
  | "created_at"
  | "updated_at"
  | "origin"
  | "synced_at"
  | "created_by"
  | "updated_by"
>;
