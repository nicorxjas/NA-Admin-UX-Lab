import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { neumaticoModelos, type Neumatico } from "@/lib/mock-data";

export const Route = createFileRoute("/neumaticos/modelos")({
  component: Page,
});

const columns: Column<Neumatico>[] = [
  { key: "codigo", header: "Código", mono: true, className: "w-32" },
  { key: "modelo", header: "Modelo" },
  { key: "medida", header: "Medida", mono: true, className: "w-40" },
  { key: "construccion", header: "Construcción", className: "w-40" },
];

function Page() {
  return (
    <div>
      <PageHeader
        eyebrow="Neumáticos"
        title="Modelos"
        description="Catálogo de modelos de neumático producidos en la planta."
      />
      <DataTable columns={columns} data={neumaticoModelos} />
    </div>
  );
}
