import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";

export const Route = createFileRoute("/trafila/categorias")({
  component: Page,
});

function Page() {
  return (
    <div>
      <PageHeader
        eyebrow="Ruta anterior"
        title="Categorías de Trafila fue reemplazado"
        description="El modelo real no usa categorías de trafila como maestro principal. Usá materiales, modelos de producto y compatibilidades por etapa."
      />
      <div className="flex flex-wrap gap-2 px-8 py-6">
        <a
          href="/maestros/modelos_producto?area=trafila"
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Ir a Trafila
        </a>
        <a
          href="/maestros/materiales"
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground hover:bg-accent"
        >
          Ver materiales
        </a>
        <a
          href="/maestros/modelo_etapa_materiales"
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground hover:bg-accent"
        >
          Ver compatibilidades
        </a>
      </div>
    </div>
  );
}
