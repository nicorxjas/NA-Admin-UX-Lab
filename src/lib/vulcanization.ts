import { z } from "zod";

export const CYCLES_KEY = "na-carrera-vulcanizado-cycles-v1";
export const models = {
  urbana: { name: "205/55 R16 Carrera Urbana", waitDays: 2 },
  plus: { name: "195/65 R15 Carrera Plus", waitDays: 3 },
  ruta: { name: "215/60 R16 Ruta Reforzada", waitDays: 2 },
};
export type Model = keyof typeof models;
export type Cartridge = {
  code: string;
  model: Model;
  assembledAt: string | null;
  status: "ready" | "rejected" | "blocked" | "vulcanized";
  consumed: boolean;
  rejectedComponents?: string[];
};
export const presses = [
  { id: "B1", model: "urbana" },
  { id: "B2", model: "urbana" },
  { id: "B3", model: "plus" },
  { id: "B4", model: "plus" },
  { id: "B5", model: "ruta" },
  { id: "B6", model: "ruta" },
] as const;
export function demoCartridges(now = Date.now()): Cartridge[] {
  const daysAgo = (days: number) => new Date(now - days * 86400000).toISOString();
  return [
    { code: "CAR-001", model: "urbana", assembledAt: daysAgo(4), status: "ready", consumed: false },
    { code: "CAR-002", model: "plus", assembledAt: daysAgo(5), status: "ready", consumed: false },
    { code: "CAR-003", model: "ruta", assembledAt: daysAgo(4), status: "ready", consumed: false },
    { code: "CAR-004", model: "urbana", assembledAt: daysAgo(3), status: "ready", consumed: false },
    {
      code: "CAR-005",
      model: "urbana",
      assembledAt: daysAgo(0.5),
      status: "ready",
      consumed: false,
    },
    {
      code: "CAR-006",
      model: "urbana",
      assembledAt: daysAgo(4),
      status: "blocked",
      consumed: false,
    },
    { code: "CAR-007", model: "plus", assembledAt: null, status: "ready", consumed: false },
    {
      code: "CAR-008",
      model: "ruta",
      assembledAt: daysAgo(4),
      status: "rejected",
      consumed: false,
    },
    {
      code: "CAR-009",
      model: "urbana",
      assembledAt: daysAgo(4),
      status: "vulcanized",
      consumed: true,
    },
    {
      code: "CAR-010",
      model: "urbana",
      assembledAt: daysAgo(4),
      status: "ready",
      consumed: false,
      rejectedComponents: ["Banda BAN-042", "Tela TEL-017"],
    },
  ];
}

const cycleSchema = z.object({
  id: z.string(),
  cartridgeCode: z.string(),
  tireCode: z.string(),
  model: z.string(),
  press: z.enum(["B1", "B2", "B3", "B4", "B5", "B6"]),
  cavity: z.enum(["Izquierda", "Derecha"]),
  mold: z.string().optional(),
  operator: z.string(),
  station: z.string(),
  createdAt: z.string().datetime(),
  assembledAt: z.string(),
  manualReason: z.string().optional(),
  status: z.literal("pending-final-control"),
});
export type Cycle = z.infer<typeof cycleSchema>;
export type Cavity = Cycle["cavity"];

export function readCycles(): Cycle[] {
  const raw = window.localStorage.getItem(CYCLES_KEY);
  return raw ? parseCycles(JSON.parse(raw)) : [];
}

export function parseCycles(value: unknown): Cycle[] {
  // Earlier demo records generated a second ID. The piece retains its Armado ID.
  return z
    .array(cycleSchema)
    .parse(value)
    .map((cycle) => ({
      ...cycle,
      tireCode: cycle.cartridgeCode,
    }));
}

export function cartridgeChecks(cartridge: Cartridge, cycles: Cycle[], now = Date.now()) {
  const elapsed = cartridge.assembledAt ? now - Date.parse(cartridge.assembledAt) : -1;
  return [
    { label: "Cartucho registrado en Armado", ok: !!cartridge.assembledAt },
    {
      label: "Sin rechazo ni bloqueo",
      ok:
        !["rejected", "blocked"].includes(cartridge.status) &&
        !cartridge.rejectedComponents?.length,
    },
    { label: "Sin vulcanizado previo", ok: cartridge.status !== "vulcanized" },
    {
      label: "Cartucho sin consumir",
      ok: !cartridge.consumed && !cycles.some((c) => c.cartridgeCode === cartridge.code),
    },
    {
      label: `Espera mínima: ${models[cartridge.model].waitDays} días`,
      ok: elapsed >= models[cartridge.model].waitDays * 86400000,
    },
  ];
}

export function cavityOccupied(press: string, cavity: Cavity, cycles: Cycle[]) {
  // An open operation in the demonstration station.
  return (
    (press === "B2" && cavity === "Derecha") ||
    cycles.some((c) => c.press === press && c.cavity === cavity)
  );
}

export function validateCycle(
  cartridge: Cartridge,
  pressId: string,
  cavity: Cavity,
  cycles: Cycle[],
) {
  if (cartridgeChecks(cartridge, cycles).some((check) => !check.ok))
    return "El cartucho no cumple las validaciones. Revisá su estado.";
  const press = presses.find((p) => p.id === pressId);
  if (!press || press.model !== cartridge.model)
    return "La prensa no está programada para este modelo.";
  if (cavityOccupied(pressId, cavity, cycles))
    return "La cavidad tiene una operación abierta. Seleccioná otra.";
  return null;
}

export function waitingTime(cartridge: Cartridge, now = Date.now()) {
  if (!cartridge.assembledAt) return null;
  const remaining =
    Date.parse(cartridge.assembledAt) + models[cartridge.model].waitDays * 86400000 - now;
  const totalHours = Math.max(0, Math.ceil(remaining / 3600000));
  return { totalHours, days: Math.floor(totalHours / 24), hours: totalHours % 24 };
}
