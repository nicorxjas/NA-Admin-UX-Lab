import { StepItem } from "@/components/hmi/StepItem";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  LogOut,
  Clock,
  Flame,
  History,
  Moon,
  ScanLine,
  ShieldCheck,
  Sun,
  UserRound,
  XCircle,
} from "lucide-react";
import { CartridgeReader } from "@/components/hmi/CartridgeReader";
import { RfidScanModal } from "@/components/hmi/RfidScanModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  CYCLES_KEY,
  cartridgeChecks,
  cavityOccupied,
  demoCartridges,
  models,
  presses,
  readCycles,
  validateCycle,
  waitingTime,
  type Cartridge,
  type Cavity,
  type Cycle,
} from "@/lib/vulcanization";

export const Route = createFileRoute("/vulcanizado")({ component: VulcanizationRoute });
const accent = "text-[#5E6AD2] dark:text-[#A8B1FF]";
const primary =
  "h-14 rounded-xl bg-[#5E6AD2] px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#6875E8]";
const steps = ["Cartucho", "Prensa y cavidad", "Confirmación"];
const dateTime = (value: string) =>
  new Date(value).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });

function VulcanizationRoute() {
  const [theme, setTheme] = useState("dark");
  const [ready, setReady] = useState(false);
  const [operator, setOperator] = useState("");
  const [step, setStep] = useState(0);
  const [cartridges, setCartridges] = useState<Cartridge[]>([]);
  const [cartridge, setCartridge] = useState<Cartridge>();
  const [press, setPress] = useState("");
  const [cavity, setCavity] = useState<Cavity>();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [completed, setCompleted] = useState<Cycle>();
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [clock, setClock] = useState(Date.now());
  const [readerKey, setReaderKey] = useState(0);

  useEffect(() => {
    setCartridges(demoCartridges());
    try {
      setCycles(readCycles());
      setTheme(localStorage.getItem("na-carrera-vulcanizado-theme") === "light" ? "light" : "dark");
    } catch {
      setStorageError(
        "No se pudo leer el registro local. Recargá la página o revisá el almacenamiento del navegador antes de continuar.",
      );
    }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key === CYCLES_KEY || event.key === null) {
        try {
          setCycles(readCycles());
        } catch {
          setStorageError("No se pudieron actualizar los ciclos guardados.");
        }
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("na-carrera-vulcanizado-theme", theme);
    } catch {
      /* Theme remains usable without persistence. */
    }
  }, [theme, ready]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const checks = cartridge ? cartridgeChecks(cartridge, cycles, clock) : [];
  const validCartridge = !!cartridge && checks.every((c) => c.ok);
  const compatiblePress =
    !!cartridge && presses.some((p) => p.id === press && p.model === cartridge.model);
  const validPosition = compatiblePress && !!cavity && !cavityOccupied(press, cavity, cycles);
  const wait = cartridge ? waitingTime(cartridge, clock) : null;

  function selectPress(value: string) {
    setPress(value);
    setCavity(undefined);
    setError("");
  }

  function scan(value: string) {
    const code = value.trim().toUpperCase();
    setCartridge(undefined);
    setPress("");
    setCavity(undefined);
    setError("");
    const found = cartridges.find((c) => c.code === code);
    if (!found)
      return {
        title: "Cartucho inexistente",
        message: `No encontramos el cartucho ${code}. Verificá el ID o escaneá otro cartucho.`,
      };
    if (found.rejectedComponents?.length)
      return {
        title: "Cartucho con componentes rechazados",
        message: `No se puede utilizar ${code}. Componentes rechazados: ${found.rejectedComponents.join(", ")}. Escaneá otro cartucho.`,
      };
    setClock(Date.now());
    setCartridge(found);
    return null;
  }

  async function confirm() {
    if (savingRef.current || !cartridge || !cavity || !operator || storageError) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    const commit = () => {
      const latest = readCycles();
      const issue = validateCycle(cartridge, press, cavity, latest);
      if (issue) {
        setCycles(latest);
        throw new Error(issue);
      }
      const selectedPress = presses.find((p) => p.id === press)!;
      const cycle: Cycle = {
        id: crypto.randomUUID(),
        cartridgeCode: cartridge.code,
        tireCode: cartridge.code,
        model: models[cartridge.model].name,
        press: selectedPress.id,
        cavity,
        operator,
        station: "Vulcanizado",
        createdAt: new Date().toISOString(),
        assembledAt: cartridge.assembledAt!,
        status: "pending-final-control",
      };
      localStorage.setItem(CYCLES_KEY, JSON.stringify([cycle, ...latest]));
      setCycles([cycle, ...latest]);
      setCompleted(cycle);
    };
    try {
      // Serialize writes across tabs when the browser supports Web Locks.
      if (navigator.locks) await navigator.locks.request(CYCLES_KEY, commit);
      else commit();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "No se pudo guardar el ciclo. Reintentá.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function nextCycle() {
    setReaderKey((key) => key + 1);
    setCompleted(undefined);
    setPress("");
    setCartridge(undefined);
    setCavity(undefined);
    setStep(0);
    setError("");
  }

  function closeTurn() {
    nextCycle();
    setOperator("");
    setHistoryOpen(false);
  }

  return (
    <section className="vulcanization min-h-screen bg-background px-3 py-4 text-foreground sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1320px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_24px_80px_rgb(15_23_42/0.1)] dark:shadow-2xl dark:shadow-black/35">
        <header className="border-b border-border/70 px-5 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div
                className={cn(
                  "mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em]",
                  accent,
                )}
              >
                <Flame className="h-3.5 w-3.5" /> Vulcanizado
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
                Registro de vulcanizado
              </h1>
              <p className="mt-1 text-[13.5px] text-muted-foreground">
                Identificá el cartucho, asigná la prensa y registrá el vulcanizado.
              </p>
            </div>
            <button
              type="button"
              aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 shrink-0 items-center gap-2 rounded-md border border-border/80 bg-background/70 px-2 text-muted-foreground"
            >
              <Sun className={cn("h-4 w-4", theme === "light" && accent)} />
              <Moon className={cn("h-4 w-4", theme === "dark" && accent)} />
            </button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {operator && (
              <button
                className="flex min-h-9 items-center gap-2 hover:text-foreground"
                onClick={() => {
                  setOperator("");
                  setError("");
                }}
              >
                <UserRound className="h-3.5 w-3.5" />
                {operator}
                <span className="underline underline-offset-4">Cambiar</span>
              </button>
            )}
            <span className="rounded border border-border px-2 py-1 text-[11px]">
              Demostración · datos locales
            </span>
            {operator && (
              <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
                <Button variant="ghost" onClick={() => setHistoryOpen(true)}>
                  <History className="h-4 w-4" />
                  Ciclos registrados <span className="font-mono">{cycles.length}</span>
                </Button>
              </div>
            )}
          </div>
        </header>

        {storageError && (
          <div
            role="alert"
            className="m-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {storageError}
          </div>
        )}
        {!ready ? (
          <div className="p-12 text-center text-muted-foreground">Preparando estación…</div>
        ) : !operator ? (
          <div className="min-h-[500px]" />
        ) : completed ? (
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-5 py-12 text-center sm:px-8">
            <div className="mb-5 rounded-full bg-emerald-500/10 p-5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h2 className="text-2xl font-semibold">Vulcanizado registrado</h2>
            <div className="my-7 w-full rounded-lg border border-border/80 bg-background/35 p-6 text-left">
              <div className="text-xs text-muted-foreground">ID del neumático · sin cambios</div>
              <div className="mt-1 font-mono text-2xl font-semibold">{completed.tireCode}</div>
              <p className="mt-2 text-sm">{completed.model}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                Pendiente de Control Final
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {completed.press} · {completed.cavity} · {dateTime(completed.createdAt)}
              </p>
            </div>
            <Button className={cn(primary, "w-full")} onClick={nextCycle}>
              Escanear siguiente cartucho
              <ArrowRight />
            </Button>
          </div>
        ) : (
          <>
            <div className="border-b border-border/70 px-5 py-5 sm:px-8">
              <ol aria-label="Pasos de vulcanizado" className="linear-scrollbar flex w-full items-center overflow-x-auto pb-1">
                {steps.map((label, i) => (
                  <StepItem
                    key={label}
                    step={{ number: i + 1, label: `Paso ${i + 1}`, title: label, icon: [ScanLine, Flame, ShieldCheck][i] }}
                    activeStep={step + 1}
                    showLine={i < steps.length - 1}
                    disabled={i > step || saving}
                    onSelect={() => {
                      setStep(i);
                      setError("");
                    }}
                  />
                ))}
              </ol>
            </div>
            <div className={cn("vulc-workspace flex-1", step > 0 && "has-context")}>
              <div key={step} className="vulc-stage min-w-0 px-5 py-7 sm:px-8">
                {step > 0 && step < 2 && cartridge && (
                  <div className="mb-5 min-[1100px]:hidden">
                    <CartridgeStrip cartridge={cartridge} />
                  </div>
                )}
                {error && (
                  <div
                    role="alert"
                    className="mb-5 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
                  >
                    <XCircle className="h-5 w-5 shrink-0" />
                    {error}
                  </div>
                )}
                {step === 0 && (
                  <div className="mx-auto w-full max-w-2xl">
                    {!cartridge ? (
                      <CartridgeReader
                        key={readerKey}
                        onScan={scan}
                        samples={cartridges.map((c) => c.code)}
                      />
                    ) : (
                      <>
                        <StepHeading
                          title="Revisá el cartucho"
                          subtitle="Confirmá los datos de la pieza para continuar con la prensa."
                        />
                        <div
                          className="overflow-hidden rounded-xl border border-border/80 bg-background/35"
                          aria-live="polite"
                        >
                          <div className="p-5 sm:p-6">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                Cartucho identificado
                              </span>
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-1 text-[11px] font-medium",
                                  validCartridge
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                    : wait &&
                                        wait.totalHours > 0 &&
                                        checks.slice(0, -1).every((c) => c.ok)
                                      ? "bg-amber-500/10 text-amber-800 dark:text-amber-300"
                                      : "bg-destructive/10 text-destructive",
                                )}
                              >
                                {validCartridge
                                  ? "Listo para vulcanizar"
                                  : wait &&
                                      wait.totalHours > 0 &&
                                      checks.slice(0, -1).every((c) => c.ok)
                                    ? `Faltan ${wait.days} ${wait.days === 1 ? "día" : "días"} y ${wait.hours} ${wait.hours === 1 ? "hora" : "horas"} para vulcanizar`
                                    : "No habilitado"}
                              </span>
                            </div>
                            <div className="font-mono text-xl font-semibold">{cartridge.code}</div>
                            <p className="mt-1 text-sm">{models[cartridge.model].name}</p>
                            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              Armado:{" "}
                              {cartridge.assembledAt
                                ? dateTime(cartridge.assembledAt)
                                : "Sin registro"}
                            </p>
                          </div>
                          {checks.slice(0, -1).some((c) => !c.ok) && (
                            <p role="alert" className="mx-5 mb-5 text-sm text-destructive sm:mx-6">
                              {cycles.some((c) => c.cartridgeCode === cartridge.code) ||
                              cartridge.consumed
                                ? "Este cartucho ya fue consumido. Escaneá otro para continuar."
                                : cartridge.status === "rejected"
                                  ? "Este cartucho está rechazado."
                                  : cartridge.status === "blocked"
                                    ? "Este cartucho está bloqueado."
                                    : cartridge.status === "vulcanized"
                                      ? "Este cartucho ya fue vulcanizado."
                                      : !cartridge.assembledAt
                                        ? "El cartucho no tiene registro de Armado."
                                        : "Todavía no cumplió la espera mínima del modelo."}
                            </p>
                          )}
                        </div>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                          <Button variant="outline" className="h-14 rounded-xl" onClick={nextCycle}>
                            <ScanLine />
                            Escanear otro cartucho
                          </Button>
                          <Button
                            className={cn(primary, "flex-1")}
                            disabled={!validCartridge || !!storageError}
                            onClick={() => {
                              setStep(1);
                              setError("");
                            }}
                          >
                            Seleccionar prensa
                            <ArrowRight />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {step === 1 && (
                  <div className="mx-auto w-full max-w-4xl">
                    <StepHeading
                      title="Seleccioná prensa y cavidad"
                      subtitle="Elegí dónde se va a procesar el cartucho."
                    />

                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {presses.map((p) => {
                        const compatible = p.model === cartridge?.model;
                        const count = (["Izquierda", "Derecha"] as Cavity[]).filter((c) =>
                          cavityOccupied(p.id, c, cycles),
                        ).length;
                        return (
                          <button
                            key={p.id}
                            disabled={!compatible || count === 2}
                            aria-pressed={press === p.id}
                            onClick={() => selectPress(p.id)}
                            className={cn(
                              "vulc-press relative rounded-xl border p-4 text-left disabled:cursor-not-allowed",
                              press === p.id
                                ? "border-[#5E6AD2] bg-[#5E6AD2]/10 ring-1 ring-[#5E6AD2]"
                                : "border-border/80 enabled:hover:border-[#5E6AD2]/60",
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-2xl font-semibold">{p.id}</span>
                              {press === p.id ? (
                                <CheckCircle2 className={cn("h-5 w-5", accent)} />
                              ) : (
                                <span className="vulc-radio" />
                              )}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {models[p.model].name}
                            </p>
                            <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                              {compatible ? (
                                <>
                                  <span className="flex gap-1">
                                    {(["Izquierda", "Derecha"] as Cavity[]).map((c) => (
                                      <span
                                        key={c}
                                        className={cn(
                                          "h-2 w-2 rounded-full",
                                          cavityOccupied(p.id, c, cycles)
                                            ? "bg-amber-500"
                                            : "bg-emerald-500",
                                        )}
                                      />
                                    ))}
                                  </span>
                                  {count === 2
                                    ? "Sin cavidades libres"
                                    : `${2 - count} de 2 cavidades libres`}
                                </>
                              ) : (
                                <>
                                  <LockKeyhole className="h-3 w-3" />
                                  Otro modelo
                                </>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mb-3 mt-6 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Seleccioná la cavidad</h3>
                      <span className="text-xs text-muted-foreground">
                        {compatiblePress ? `Prensa ${press}` : "Elegí primero una prensa"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {(["Izquierda", "Derecha"] as Cavity[]).map((c) => {
                        const occupied = cavityOccupied(press, c, cycles);
                        return (
                          <button
                            key={c}
                            aria-pressed={cavity === c}
                            disabled={!compatiblePress || occupied}
                            onClick={() => {
                              setCavity(c);
                              setError("");
                            }}
                            className={cn(
                              "vulc-cavity flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border disabled:cursor-not-allowed",
                              cavity === c
                                ? "border-[#5E6AD2] bg-[#5E6AD2]/10 ring-1 ring-[#5E6AD2]"
                                : "border-border/80 bg-background/35",
                            )}
                          >
                            <span className="flex items-center gap-2 text-lg font-semibold">
                              {c === "Izquierda" ? (
                                <ArrowLeft className="h-7 w-7" aria-hidden="true" />
                              ) : (
                                <ArrowRight className="h-7 w-7" aria-hidden="true" />
                              )}
                              {c}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {!compatiblePress
                                ? "Seleccioná una prensa compatible"
                                : occupied
                                  ? "Operación abierta"
                                  : "Disponible"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <Navigation
                      onBack={() => {
                        setStep(0);
                        setError("");
                      }}
                      onNext={() => {
                        setStep(2);
                        setError("");
                      }}
                      disabled={!validPosition || !validCartridge}
                      label="Revisar y confirmar"
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="mx-auto w-full max-w-3xl">
                    <StepHeading
                      title="Confirmá el vulcanizado"
                      subtitle="Revisá los datos del ciclo antes de registrarlo."
                    />
                    <section
                      aria-label="Resumen del ciclo"
                      className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm"
                    >
                      <div className="px-6 py-7 sm:px-8 sm:py-8">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                            Cartucho / neumático
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {validCartridge && validPosition ? "Verificado" : "Requiere revisión"}
                          </span>
                        </div>
                        <div className="font-mono text-3xl font-semibold tracking-tight sm:text-4xl">
                          {cartridge!.code}
                        </div>
                        <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
                          {models[cartridge!.model].name}
                        </p>
                      </div>
                      <div className="mx-4 mb-5 flex items-center gap-5 rounded-xl bg-background/70 px-5 py-5 sm:mx-6 sm:gap-8 sm:px-6">
                        <div className="shrink-0">
                          <div className="text-xs text-muted-foreground">Prensa</div>
                          <div className="mt-1.5 font-mono text-3xl font-semibold tracking-tight">
                            {press}
                          </div>
                        </div>
                        <div aria-hidden="true" className="h-12 w-px bg-border/80" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-muted-foreground">Cavidad</div>
                          <div className="mt-2 flex items-center gap-2.5 text-lg font-semibold">
                            {cavity === "Izquierda" ? (
                              <ArrowLeft className={cn("h-6 w-6 shrink-0", accent)} />
                            ) : (
                              <ArrowRight className={cn("h-6 w-6 shrink-0", accent)} />
                            )}
                            {cavity}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 border-t border-border/60 px-6 py-4 sm:px-8">
                        <div
                          aria-hidden="true"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground"
                        >
                          <UserRound className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] text-muted-foreground">Operario</div>
                          <div className="mt-0.5 text-sm font-medium">{operator}</div>
                        </div>
                      </div>
                    </section>
                    <Navigation
                      onBack={() => {
                        setStep(1);
                        setError("");
                      }}
                      onNext={confirm}
                      disabled={saving || !!storageError || !validCartridge || !validPosition}
                      label={saving ? "Registrando…" : "Confirmar vulcanizado"}
                      confirm
                    />
                  </div>
                )}
              </div>
              {step > 0 && (
                <aside className="vulc-context">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Ciclo en preparación
                    </span>
                    <Flame className={cn("h-4 w-4", accent)} />
                  </div>
                  <div className="my-6">
                    <div className="mb-2 text-xs text-muted-foreground">
                      ID cartucho / neumático
                    </div>
                    <div className="font-mono text-2xl font-semibold tracking-tight">
                      {cartridge?.code}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {cartridge && models[cartridge.model].name}
                    </p>
                  </div>
                  <div className="vulc-context-status">
                    <ShieldCheck className="h-4 w-4" />
                    {validCartridge ? "Cartucho habilitado" : "Requiere revisión"}
                  </div>
                  <dl className="vulc-context-list">
                    <div>
                      <dt>Prensa</dt>
                      <dd>{compatiblePress ? press : "Por seleccionar"}</dd>
                    </div>
                    <div>
                      <dt>Cavidad</dt>
                      <dd>{cavity ?? "Por seleccionar"}</dd>
                    </div>
                    <div>
                      <dt>Operario</dt>
                      <dd>{operator}</dd>
                    </div>
                  </dl>
                  <div className="mt-6 pt-5 text-xs text-muted-foreground">
                    <span className="block text-[10px] uppercase tracking-wider">Armado</span>
                    <span className="mt-2 block font-mono">
                      {cartridge?.assembledAt ? dateTime(cartridge.assembledAt) : "Sin registro"}
                    </span>
                  </div>
                </aside>
              )}
            </div>
          </>
        )}
        {operator && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-5 py-3 text-[11px] text-muted-foreground sm:px-8">
            <span>NA Carrera · Trazabilidad de producción</span>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-4">
              <span>
                Estación Vulcanizado{!completed && ` · Paso ${step + 1} de 3`}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 border-border/70 bg-card text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                onClick={closeTurn}
                disabled={saving}
              >
                <LogOut className="h-3.5 w-3.5" />
                Finalizar turno
              </Button>
            </div>
          </footer>
        )}
      </div>
      <RfidScanModal
        open={ready && !operator && !storageError}
        onAuth={setOperator}
        title="Vulcanizado · identificación"
        heading="Acercá tu tarjeta NFC"
        helperText="Identificate para habilitar la estación y registrar tu participación en cada ciclo."
      />
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ciclos de vulcanizado</DialogTitle>
            <DialogDescription>
              Registros guardados en este navegador. Las cavidades registradas conservan su
              operación abierta.
            </DialogDescription>
          </DialogHeader>
          {cycles.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Todavía no hay ciclos registrados.
            </p>
          ) : (
            cycles.map((c) => (
              <div key={c.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <strong className="font-mono">{c.tireCode}</strong>
                  <span className="text-xs text-muted-foreground">{dateTime(c.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm">{c.model}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {c.press} / {c.cavity} · {c.operator}
                </p>
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                  Pendiente de Control Final
                </p>
                {c.manualReason && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Contingencia: {c.manualReason}
                  </p>
                )}
              </div>
            ))
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
function CartridgeStrip({ cartridge }: { cartridge: Cartridge }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border/80 bg-background/35 px-4 py-3">
      <span className={cn("font-mono text-sm font-semibold", accent)}>{cartridge.code}</span>
      <span className="text-sm text-muted-foreground">{models[cartridge.model].name}</span>
    </div>
  );
}
function Navigation({
  onBack,
  onNext,
  disabled,
  label,
  confirm,
}: {
  onBack: () => void;
  onNext: () => void;
  disabled?: boolean;
  label: string;
  confirm?: boolean;
}) {
  return (
    <div className="vulc-actions mt-7 flex flex-col-reverse gap-3 sm:flex-row">
      <Button variant="outline" className="h-14" onClick={onBack}>
        <ArrowLeft />
        Volver
      </Button>
      <Button
        className={cn(primary, "flex-1", confirm && "bg-emerald-600 hover:bg-emerald-500")}
        disabled={disabled}
        onClick={onNext}
      >
        {confirm && <CheckCircle2 />}
        {label}
        {!confirm && <ArrowRight />}
      </Button>
    </div>
  );
}
