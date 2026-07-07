import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { trafilaModelos, type TrafilaModelo } from "@/lib/mock-data";

export const Route = createFileRoute("/trafila/modelos")({
  component: Page,
});

const columns: Column<TrafilaModelo>[] = [
  { key: "codigo", header: "Código", mono: true, className: "w-32" },
  { key: "categoria", header: "Categoría", mono: true, className: "w-32" },
  { key: "compuesto", header: "Compuesto" },
  {
    key: "diametroMm",
    header: "Diámetro (mm)",
    className: "w-40 text-right",
    render: (r) => <span className="font-mono">{r.diametroMm}</span>,
  },
];

function Page() {
  return (
    <div>
      <PageHeader
        eyebrow="Trafila"
        title="Modelos"
        description="Modelos de trafila configurados por compuesto y geometría."
      />
      <DataTable columns={columns} data={trafilaModelos} />
    </div>
  );
}
