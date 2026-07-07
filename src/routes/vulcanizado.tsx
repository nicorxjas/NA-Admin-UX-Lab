import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";

export const Route = createFileRoute("/vulcanizado")({
  component: Page,
});

function Page() {
  return (
    <div>
      <PageHeader
        eyebrow="Ruta anterior"
        title="Vulcanizado ahora es estación Fase 1"
        description="La pantalla real registra máquina de vulcanizado, cavidad, molde, modelo/neumático, operario, turno e ID Quemado. Temperatura, presión, tiempo y PLC quedan diferidos."
      />
      <div className="flex flex-wrap gap-2 px-8 py-6">
        <a
          href="/maestros/maquinas?area=vulcanizado"
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Ir a Vulcanizado
        </a>
        <a
          href="/maestros/cavidades"
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground hover:bg-accent"
        >
          Ver cavidades
        </a>
        <a
          href="/maestros/moldes"
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground hover:bg-accent"
        >
          Ver moldes
        </a>
      </div>
    </div>
  );
}
