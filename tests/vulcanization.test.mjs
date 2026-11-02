import assert from "node:assert/strict";
import test from "node:test";
import {
  cartridgeChecks,
  cavityOccupied,
  demoCartridges,
  validateCycle,
  parseCycles,
  waitingTime,
} from "../src/lib/vulcanization.ts";

const now = Date.now();
const cartridges = demoCartridges(now);
const valid = cartridges[0];

test("accepts an assembled cartridge after its model's minimum wait", () => {
  assert.ok(cartridgeChecks(valid, [], now).every((check) => check.ok));
  assert.equal(validateCycle(valid, "B1", "Izquierda", []), null);
});

test("blocks insufficient waiting, blocked, unassembled, rejected and vulcanized cartridges", () => {
  for (const cartridge of cartridges.slice(4)) {
    assert.ok(
      cartridgeChecks(cartridge, [], now).some((check) => !check.ok),
      cartridge.code,
    );
    assert.ok(validateCycle(cartridge, "B1", "Izquierda", []));
  }
});

test("enforces the exact minimum waiting boundary", () => {
  const boundary = { ...valid, assembledAt: new Date(now - 2 * 86400000).toISOString() };
  assert.ok(cartridgeChecks(boundary, [], now).every((check) => check.ok));
  assert.equal(cartridgeChecks(boundary, [], now - 1).at(-1).ok, false);
});

test("rejects incompatible presses", () => {
  assert.match(validateCycle(valid, "B3", "Izquierda", []), /prensa/);
});

test("rejects previously consumed cartridges and occupied cavities", () => {
  const cycle = { cartridgeCode: cartridges[3].code, press: "B1", cavity: "Izquierda" };
  assert.match(validateCycle(cartridges[3], "B1", "Derecha", [cycle]), /cartucho/);
  assert.match(validateCycle(valid, "B1", "Izquierda", [cycle]), /cavidad/);
  assert.equal(cavityOccupied("B2", "Derecha", []), true);
  assert.equal(cavityOccupied("B2", "Izquierda", []), false);
});

test("keeps CAR-001 reusable in the same cavity across demo cycles", () => {
  const cycles = Array.from({ length: 5 }, () => ({
    cartridgeCode: "CAR-001",
    press: "B1",
    cavity: "Izquierda",
  }));
  assert.ok(cartridgeChecks(valid, cycles, now).every((check) => check.ok));
  assert.equal(validateCycle(valid, "B1", "Izquierda", cycles), null);
  assert.equal(cavityOccupied("B1", "Izquierda", cycles), false);
  assert.equal(validateCycle(cartridges[3], "B1", "Izquierda", cycles), null);
  assert.match(validateCycle(valid, "B3", "Izquierda", cycles), /prensa/);
  assert.match(validateCycle(valid, "B2", "Derecha", cycles), /cavidad/);
});

test("preserves the cartridge ID and normalizes legacy generated tire IDs", () => {
  const legacy = {
    id: "cycle-1",
    cartridgeCode: "CAR-001",
    tireCode: "NEU-V-001",
    model: "Urbana",
    press: "B1",
    cavity: "Izquierda",
    mold: "MOL-001",
    operator: "Mondino, J.",
    station: "Vulcanizado",
    createdAt: new Date().toISOString(),
    assembledAt: valid.assembledAt,
    manualReason: "",
    status: "pending-final-control",
  };
  const [normalized] = parseCycles([legacy]);
  assert.equal(normalized.tireCode, legacy.cartridgeCode);
  assert.equal(normalized.id, legacy.id);
  assert.equal(normalized.createdAt, legacy.createdAt);
  assert.deepEqual(parseCycles([normalized]), [normalized]);
});

test("reports remaining waiting time in days and hours and reaches zero", () => {
  assert.deepEqual(waitingTime(cartridges[4], now), { totalHours: 36, days: 1, hours: 12 });
  assert.deepEqual(waitingTime(cartridges[4], now + 36 * 3600000), {
    totalHours: 0,
    days: 0,
    hours: 0,
  });
  assert.equal(waitingTime(cartridges[6], now), null);
});

test("blocks cartridges with rejected components independently of cartridge status", () => {
  const rejected = cartridges.find((c) => c.code === "CAR-010");
  assert.equal(rejected.status, "ready");
  assert.ok(validateCycle(rejected, "B1", "Izquierda", []));
});

test("reads new cycles without mold data", () => {
  const cycle = {
    id: "cycle-new",
    cartridgeCode: "CAR-004",
    tireCode: "CAR-004",
    model: "Urbana",
    press: "B1",
    cavity: "Derecha",
    operator: "Mondino, J.",
    station: "Vulcanizado",
    createdAt: new Date().toISOString(),
    assembledAt: valid.assembledAt,
    status: "pending-final-control",
  };
  assert.equal(parseCycles([cycle])[0].tireCode, "CAR-004");
});
