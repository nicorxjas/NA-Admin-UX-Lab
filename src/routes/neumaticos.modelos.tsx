import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";

export const Route = createFileRoute("/neumaticos/modelos")({
  component: Page,
});

function Page() {
  return (
    <div>
      <PageHeader
        eyebrow="Ruta anterior"
        title="Modelos de Neumáticos fue reemplazado"
        description="Los modelos de neumático ahora forman parte de modelos_producto junto con Banda, Tela Cortada y Cartucho."
      />
      <div className="flex flex-wrap gap-2 px-8 py-6">
        <a
          href="/maestros/modelos_producto"
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Ver modelos de producto
        </a>
        <a
          href="/"
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground hover:bg-accent"
        >
          Buscar trazabilidad
        </a>
      </div>
    </div>
  );
}
