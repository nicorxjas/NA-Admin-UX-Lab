import { createFileRoute, Link } from "@tanstack/react-router";
import { MasterCrudPage } from "@/components/admin/MasterCrudPage";
import { MASTER_KEYS, masterConfigs, type MasterKey } from "@/lib/mock-data";

export const Route = createFileRoute("/maestros/$masterKey")({
  component: MasterRoute,
});

function isMasterKey(value: string): value is MasterKey {
  return (MASTER_KEYS as readonly string[]).includes(value);
}

function MasterRoute() {
  const { masterKey } = Route.useParams();

  if (!isMasterKey(masterKey)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Maestro no encontrado
        </div>
        <h1 className="mt-2 text-[22px] font-semibold text-foreground">
          No existe el maestro solicitado
        </h1>
        <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
          Revisá la navegación lateral o volvé a la búsqueda de trazabilidad.
        </p>
        <Link
          to="/"
          className="mt-5 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return <MasterCrudPage masterKey={masterConfigs[masterKey].key} />;
}
