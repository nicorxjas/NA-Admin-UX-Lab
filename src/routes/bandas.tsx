import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";

export const Route = createFileRoute("/bandas")({
  component: Page,
});

function Page() {
  return (
    <div>
      <PageHeader
        eyebrow="Ruta anterior"
        title="Bandas fue reemplazado"
        description="La administración ahora usa el modelo real Fase 1. La Banda se gestiona como salida de Trafila Grande y como modelo/material dentro de los maestros operativos."
      />
      <div className="flex flex-wrap gap-2 px-8 py-6">
        <a
          href="/maestros/modelos_producto?area=trafila"
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Ir a Trafila
        </a>
        <a
          href="/maestros/modelos_producto"
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground hover:bg-accent"
        >
          Ver modelos de producto
        </a>
      </div>
    </div>
  );
}
