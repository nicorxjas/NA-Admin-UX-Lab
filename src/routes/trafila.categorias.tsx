import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { trafilaCategorias, type TrafilaCategoria } from "@/lib/mock-data";

export const Route = createFileRoute("/trafila/categorias")({
  component: Page,
});

const columns: Column<TrafilaCategoria>[] = [
  { key: "codigo", header: "Código", mono: true, className: "w-32" },
  { key: "nombre", header: "Nombre" },
  { key: "descripcion", header: "Descripción" },
];

function Page() {
  return (
    <div>
      <PageHeader
        eyebrow="Trafila"
        title="Categorías"
        description="Datos maestros de categorías de compuestos para trafila."
      />
      <DataTable columns={columns} data={trafilaCategorias} />
    </div>
  );
}
