import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { vulcanizados, type Vulcanizado } from "@/lib/mock-data";

export const Route = createFileRoute("/vulcanizado")({
  component: Page,
});

const columns: Column<Vulcanizado>[] = [
  { key: "codigo", header: "Código", mono: true, className: "w-32" },
  { key: "molde", header: "Molde", mono: true, className: "w-32" },
  {
    key: "temperatura",
    header: "Temperatura (°C)",
    className: "w-40 text-right",
    render: (r) => <span className="font-mono">{r.temperatura}</span>,
  },
  {
    key: "tiempoMin",
    header: "Tiempo (min)",
    className: "w-32 text-right",
    render: (r) => <span className="font-mono">{r.tiempoMin}</span>,
  },
];

function Page() {
  return (
    <div>
      <PageHeader
        eyebrow="Estación"
        title="Vulcanizado"
        description="Recetas y parámetros de vulcanizado."
      />
      <DataTable columns={columns} data={vulcanizados} />
    </div>
  );
}
