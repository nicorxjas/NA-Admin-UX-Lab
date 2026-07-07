import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { bandas, type Banda } from "@/lib/mock-data";

export const Route = createFileRoute("/bandas")({
  component: Page,
});

const columns: Column<Banda>[] = [
  { key: "codigo", header: "Código", mono: true, className: "w-32" },
  { key: "nombre", header: "Nombre" },
  {
    key: "ancho",
    header: "Ancho (mm)",
    className: "w-32 text-right",
    render: (r) => <span className="font-mono">{r.ancho}</span>,
  },
  {
    key: "largo",
    header: "Largo (mm)",
    className: "w-32 text-right",
    render: (r) => <span className="font-mono">{r.largo}</span>,
  },
];

function Page() {
  return (
    <div>
      <PageHeader
        eyebrow="Estación"
        title="Bandas"
        description="Datos maestros de bandas de rodamiento."
      />
      <DataTable columns={columns} data={bandas} />
    </div>
  );
}
