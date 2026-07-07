import { useMemo, useState, type ReactNode } from "react";
import {
  MasterStoreContext,
  type MasterInput,
  type MasterStore,
  type MasterSystemFields,
} from "@/lib/master-store-context";
import {
  initialMasterState,
  type MasterKey,
  type MasterRecord,
  type MasterState,
} from "@/lib/mock-data";

function makeId(key: MasterKey) {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && "randomUUID" in cryptoApi) {
    return `${key}-${cryptoApi.randomUUID()}`;
  }
  return `${key}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function systemFields(id: string): MasterSystemFields {
  const now = new Date().toISOString();
  return {
    id,
    activo: true,
    created_at: now,
    updated_at: now,
    origin: "ui-local",
    synced_at: null,
    created_by: "admin-ui",
    updated_by: "admin-ui",
  };
}

export function MasterDataProvider({ children }: { children: ReactNode }) {
  const [masters, setMasters] = useState<MasterState>(() => initialMasterState);

  const value = useMemo<MasterStore>(
    () => ({
      masters,
      createRecord: (key, values) => {
        setMasters((current) => {
          const id = makeId(key);
          const nextRecord = { ...systemFields(id), ...values } as MasterRecord;
          return { ...current, [key]: [...current[key], nextRecord] };
        });
      },
      updateRecord: (key, id, values) => {
        setMasters((current) => ({
          ...current,
          [key]: current[key].map((record) =>
            record.id === id
              ? {
                  ...record,
                  ...values,
                  updated_at: new Date().toISOString(),
                  updated_by: "admin-ui",
                }
              : record,
          ),
        }));
      },
      setRecordActive: (key, id, activo) => {
        setMasters((current) => ({
          ...current,
          [key]: current[key].map((record) =>
            record.id === id
              ? {
                  ...record,
                  activo,
                  updated_at: new Date().toISOString(),
                  updated_by: "admin-ui",
                }
              : record,
          ),
        }));
      },
    }),
    [masters],
  );

  return <MasterStoreContext.Provider value={value}>{children}</MasterStoreContext.Provider>;
}
