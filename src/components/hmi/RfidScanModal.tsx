import { useEffect, useRef, useState } from "react";
import { Radio, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RfidScanModalProps {
  open: boolean;
  onAuth: (operario: string) => void;
  onClose?: () => void;
  title?: string;
  heading?: string;
  helperText?: string;
  placeholder?: string;
}

const KNOWN_CARDS: Record<string, string> = {
  "1042-A": "Mondino, J.",
  "2871-B": "Pereyra, S.",
  "3390-C": "Gomez, R.",
  "4156-D": "Acosta, M.",
};

export function RfidScanModal({
  open,
  onAuth,
  onClose,
  title = "Identificacion de Operario",
  heading = "Acerque su tarjeta RFID",
  helperText = "Escanee la tarjeta o ingrese el codigo manualmente",
  placeholder = "Codigo de tarjeta...",
}: RfidScanModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    setCode("");
    setError(null);
    setScanning(true);
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  if (!open) return null;

  const tryAuth = (value: string) => {
    const operario = KNOWN_CARDS[value.toUpperCase().trim()];
    if (operario) {
      onAuth(operario);
      return;
    }

    setError(`Tarjeta no reconocida: ${value}`);
    setScanning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rfid-scan-heading"
        className="relative w-full max-w-[440px] overflow-hidden rounded-lg border border-border/80 bg-card shadow-2xl shadow-black/45"
      >
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 z-10 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}

        <div className="border-b border-border/70 bg-background/35 px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A8B1FF]">
            {title}
          </div>
          <div id="rfid-scan-heading" className="mt-1 pr-8 text-base font-semibold text-foreground">
            {heading}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-5 flex flex-col items-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-[#A8B1FF]/45 bg-[#5E6AD2]/10 shadow-[0_18px_60px_rgba(94,106,210,0.24)]">
                <Radio className="h-10 w-10 animate-pulse text-[#A8B1FF]" />
              </div>
              {scanning ? (
                <span className="absolute inset-0 animate-ping rounded-full border border-[#A8B1FF]/30" />
              ) : null}
            </div>
            <div className="mt-4 max-w-xs text-center text-[12.5px] leading-relaxed text-muted-foreground">
              {helperText}
            </div>
          </div>

          <input
            ref={inputRef}
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setError(null);
              setScanning(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                tryAuth(code);
              }
            }}
            placeholder={placeholder}
            className="h-12 w-full rounded-md border border-border/80 bg-background/45 px-3 text-center font-mono text-lg font-semibold tracking-widest text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[#A8B1FF] focus:ring-2 focus:ring-[#5E6AD2]/25"
          />

          {error ? (
            <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
              {error}
            </div>
          ) : null}

          <div className="mt-4">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Tarjetas de prueba
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(KNOWN_CARDS).map(([cardCode, name]) => (
                <button
                  key={cardCode}
                  type="button"
                  onClick={() => onAuth(name)}
                  className={cn(
                    "rounded-md border border-border/80 bg-background/45 px-3 py-2 text-left transition-colors",
                    "hover:border-[#A8B1FF]/70 hover:bg-[#5E6AD2]/10",
                  )}
                >
                  <div className="font-mono text-[11px] font-semibold text-[#A8B1FF]">
                    {cardCode}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
