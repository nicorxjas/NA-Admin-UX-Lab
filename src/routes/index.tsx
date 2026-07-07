import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ArrowRight, User, Clock, Factory, Package, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { dependencyDB, type DependencyNode } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: DependencySearch,
});

const EXAMPLE = "NEU-778812";

function DependencySearch() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const result: DependencyNode | undefined = submitted ? dependencyDB[submitted] : undefined;

  const onSearch = (val?: string) => {
    const v = (val ?? query).trim();
    if (!v) return;
    setQuery(v);
    setSubmitted(v);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader
        eyebrow="Trazabilidad"
        title="Búsqueda de dependencias"
        description="Ingresá el código de un componente o neumático para reconstruir su árbol completo: operario, máquina, timestamp y estación en cada paso."
      />

      <div className="px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              placeholder="Ej: NEU-778812, BD-5001-778, TM-1001-C…"
              className="h-10 pl-9 pr-3 text-[13.5px] font-mono bg-card border-border/70 focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <Button
            onClick={() => onSearch()}
            className="h-10 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
          >
            Trazar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {!submitted && (
          <div className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
            Prueba con
            <button
              onClick={() => onSearch(EXAMPLE)}
              className="rounded-md border border-border/70 bg-card px-2 py-0.5 font-mono text-[11.5px] text-foreground/90 transition hover:bg-accent"
            >
              {EXAMPLE}
            </button>
          </div>
        )}

        {submitted && !result && (
          <div className="mt-8 rounded-lg border border-border/70 bg-card p-6 text-center">
            <div className="text-[13.5px] font-medium text-foreground">
              No se encontraron dependencias para{" "}
              <span className="font-mono">{submitted}</span>
            </div>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Verificá el código o probá el ejemplo{" "}
              <button
                onClick={() => onSearch(EXAMPLE)}
                className="font-mono text-foreground/90 underline underline-offset-2"
              >
                {EXAMPLE}
              </button>
              .
            </p>
          </div>
        )}

        {result && (
          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
              <div className="flex items-center justify-between border-b border-border/70 px-5 py-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Árbol de dependencias
                  </span>
                </div>
                <span className="rounded-md bg-info/15 px-2 py-0.5 text-[11px] font-medium text-info">
                  trace-id · {result.codigo}
                </span>
              </div>
              <div className="p-5">
                <DepNode node={result} depth={0} />
              </div>
            </div>

            <SummaryCard node={result} />
          </div>
        )}
      </div>
    </div>
  );
}

function DepNode({ node, depth }: { node: DependencyNode; depth: number }) {
  return (
    <div className={cn("relative", depth > 0 && "pl-6")}>
      {depth > 0 && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 h-full border-l border-tree-guide"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-5 h-px w-5 bg-tree-guide"
          />
        </>
      )}

      <div className="group rounded-lg border border-border/70 bg-background/40 p-4 transition hover:border-border">
        <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-accent px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.06em] text-foreground/90">
              {node.tipo}
            </span>
            <span className="font-mono text-[13px] font-medium text-foreground">
              {node.codigo}
            </span>
          </div>
          <span className="text-[13px] text-muted-foreground">{node.descripcion}</span>
          <span className="ml-auto flex items-center gap-1 rounded-md bg-info/10 px-2 py-0.5 text-[11px] font-medium text-info">
            {node.evento.estacion}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12.5px] sm:grid-cols-4">
          <Meta icon={User} label="Operario" value={node.evento.operario} />
          <Meta icon={Factory} label="Máquina" value={node.evento.maquina} mono />
          <Meta icon={Clock} label="Timestamp" value={node.evento.timestamp} mono />
          {node.evento.loteInsumo && (
            <Meta icon={Package} label="Lote insumo" value={node.evento.loteInsumo} mono />
          )}
        </div>

        {node.evento.notas && (
          <div className="mt-3 border-t border-border/60 pt-3 text-[12px] text-muted-foreground">
            {node.evento.notas}
          </div>
        )}
      </div>

      {node.hijos && node.hijos.length > 0 && (
        <div className="mt-3 space-y-3">
          {node.hijos.map((h) => (
            <DepNode key={h.codigo} node={h} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span
        className={cn(
          "truncate text-foreground/90",
          mono && "font-mono text-[12px]",
        )}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function SummaryCard({ node }: { node: DependencyNode }) {
  // flatten for path summary
  const path: DependencyNode[] = [];
  const walk = (n: DependencyNode) => {
    path.push(n);
    n.hijos?.forEach(walk);
  };
  walk(node);

  const stations = Array.from(new Set(path.map((p) => p.evento.estacion)));

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="border-b border-border/70 px-5 py-3">
        <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Resumen de trazabilidad
        </span>
      </div>
      <div className="space-y-4 p-5 text-[13px]">
        <Row label="Componente raíz" value={node.codigo} mono />
        <Row label="Nodos en el árbol" value={String(path.length)} />
        <Row label="Estaciones tocadas" value={String(stations.length)} />

        <div>
          <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Recorrido
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {stations.map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className="rounded-md bg-accent px-2 py-0.5 text-[11.5px] font-medium text-foreground">
                  {s}
                </span>
                {i < stations.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-foreground", mono && "font-mono text-[12.5px]")}>{value}</span>
    </div>
  );
}
