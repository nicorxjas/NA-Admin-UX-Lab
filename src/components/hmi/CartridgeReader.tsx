import { useEffect, useRef, useState } from "react";
import { Radio, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ScanError = { title: string; message: string };

export function CartridgeReader({
  onScan,
  samples,
}: {
  onScan: (code: string) => ScanError | null;
  samples: string[];
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<ScanError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const accept = (code = value) => {
    if (!code.trim()) return;
    setValue(code);
    const result = onScan(code);
    setError(result);
    if (result) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  };
  return (
    <section
      aria-labelledby="cartridge-reader-heading"
      className="overflow-hidden rounded-xl border border-border/80 bg-card"
    >
      <div
        className={cn(
          "border-b border-border bg-background/40 px-6 py-5 text-left",
          error && "border-destructive/40 bg-destructive/10",
        )}
      >
        <h2
          id="cartridge-reader-heading"
          className={cn("text-xl font-semibold", error && "text-destructive")}
        >
          {error?.title ?? "Escaneá el cartucho"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error
            ? "La lectura no permite continuar con este cartucho."
            : "Acercá el lector al ID del cartucho."}
        </p>
      </div>
      <form
        className="p-6"
        onSubmit={(event) => {
          event.preventDefault();
          accept();
        }}
      >
        <div className="mb-7 flex justify-center">
          <div
            className={cn(
              "relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-primary/5",
              error && "border-destructive/60 bg-destructive/10",
            )}
          >
            <Radio
              className={cn(
                "h-10 w-10 text-primary motion-safe:animate-pulse dark:text-[#A8B1FF]",
                error && "text-destructive dark:text-destructive",
              )}
            />
            {!error && (
              <span className="absolute inset-0 rounded-full border-2 border-primary/30 motion-safe:animate-ping" />
            )}
          </div>
        </div>
        <Label htmlFor="cartridge-reader">ID del cartucho</Label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Input
            ref={inputRef}
            id="cartridge-reader"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "cartridge-reader-error" : undefined}
            placeholder="Código del cartucho"
            autoComplete="off"
            className={cn(
              "h-14 min-w-0 flex-1 border-2 text-center font-mono text-xl tracking-widest",
              error && "border-destructive bg-destructive/10 text-destructive",
            )}
          />
          <Button
            type="submit"
            disabled={!value.trim() || !!error}
            className="h-14 min-w-36 gap-2 text-sm font-semibold"
          >
            <ScanLine className="h-5 w-5" />
            Aceptar
          </Button>
        </div>
        {error && (
          <div
            id="cartridge-reader-error"
            role="alert"
            className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error.message}
          </div>
        )}
        <details className="mt-4 text-xs text-muted-foreground">
          <summary className="cursor-pointer py-2">Cartuchos de prueba</summary>
          <div className="flex flex-wrap gap-2">
            {[...samples, "CAR-999"].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => accept(code)}
                className="min-h-10 rounded-md border border-border px-3 font-mono"
              >
                {code}
              </button>
            ))}
          </div>
          <p className="mt-2">CAR-010: componentes rechazados · CAR-999: inexistente</p>
        </details>
      </form>
    </section>
  );
}
