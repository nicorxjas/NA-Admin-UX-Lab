import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import type { ComponentType } from "react";
import {
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Command,
  Factory,
  Flame,
  Scissors,
  Search,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MasterKey } from "@/lib/mock-data";

type Leaf = { label: string; href: string };
type Group = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  children: Leaf[];
};

function masterHref(masterKey: MasterKey, area: string) {
  return `/maestros/${masterKey}?area=${area}`;
}

const nav: Group[] = [
  {
    key: "trafila",
    label: "Trafila",
    icon: Factory,
    children: [
      { label: "Modelos", href: masterHref("modelos_producto", "trafila") },
      { label: "Materiales", href: masterHref("materiales", "trafila") },
      { label: "Compatibilidades", href: masterHref("modelo_etapa_materiales", "trafila") },
      { label: "Especificaciones", href: masterHref("especificaciones_modelo", "trafila") },
      { label: "Máquinas", href: masterHref("maquinas", "trafila") },
      { label: "Dispositivos", href: masterHref("dispositivos", "trafila") },
      { label: "Paradas", href: masterHref("motivos_parada", "trafila") },
    ],
  },
  {
    key: "corte-tela",
    label: "Corte de Tela",
    icon: Scissors,
    children: [
      { label: "Modelos", href: masterHref("modelos_producto", "corte-tela") },
      { label: "Materiales", href: masterHref("materiales", "corte-tela") },
      { label: "Proveedores", href: masterHref("proveedores", "corte-tela") },
      { label: "Compatibilidades", href: masterHref("modelo_etapa_materiales", "corte-tela") },
      { label: "Especificaciones", href: masterHref("especificaciones_modelo", "corte-tela") },
      { label: "Máquinas", href: masterHref("maquinas", "corte-tela") },
      { label: "Dispositivos", href: masterHref("dispositivos", "corte-tela") },
      { label: "Paradas", href: masterHref("motivos_parada", "corte-tela") },
    ],
  },
  {
    key: "armado",
    label: "Armado",
    icon: Wrench,
    children: [
      { label: "Modelos", href: masterHref("modelos_producto", "armado") },
      { label: "Materiales", href: masterHref("materiales", "armado") },
      { label: "Compatibilidades", href: masterHref("modelo_etapa_materiales", "armado") },
      { label: "Máquinas", href: masterHref("maquinas", "armado") },
      { label: "Dispositivos", href: masterHref("dispositivos", "armado") },
      { label: "Paradas", href: masterHref("motivos_parada", "armado") },
    ],
  },
  {
    key: "vulcanizado",
    label: "Vulcanizado",
    icon: Flame,
    children: [
      { label: "Modelos", href: masterHref("modelos_producto", "vulcanizado") },
      { label: "Prensas", href: masterHref("maquinas", "vulcanizado") },
      { label: "Cavidades", href: masterHref("cavidades", "vulcanizado") },
      { label: "Moldes", href: masterHref("moldes", "vulcanizado") },
      { label: "Dispositivos", href: masterHref("dispositivos", "vulcanizado") },
      { label: "Paradas", href: masterHref("motivos_parada", "vulcanizado") },
      { label: "Configuraciones", href: masterHref("configuraciones", "vulcanizado") },
    ],
  },
  {
    key: "control-final",
    label: "Control final",
    icon: ClipboardCheck,
    children: [
      { label: "Modelos", href: masterHref("modelos_producto", "control-final") },
      { label: "Motivos aceptación", href: masterHref("motivos_aceptacion", "control-final") },
      { label: "Motivos rechazo", href: masterHref("motivos_rechazo", "control-final") },
      { label: "Especificaciones", href: masterHref("especificaciones_modelo", "control-final") },
      { label: "Puestos", href: masterHref("estaciones", "control-final") },
      { label: "Dispositivos", href: masterHref("dispositivos", "control-final") },
    ],
  },
  {
    key: "rrhh",
    label: "RRHH",
    icon: Users,
    children: [
      { label: "Operarios", href: masterHref("operarios", "rrhh") },
      { label: "Turnos", href: masterHref("turnos", "rrhh") },
    ],
  },
];

export function AdminSidebar() {
  const currentHref = useRouterState({ select: (state) => state.location.href });
  const currentPath = useRouterState({ select: (state) => state.location.pathname });
  const isActive = (href: string) => currentHref === href || currentPath === href;

  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of nav) {
      initial[group.key] = group.children.some((child) => isActive(child.href));
    }
    if (!Object.values(initial).some(Boolean)) {
      initial.trafila = true;
      initial["corte-tela"] = true;
    }
    return initial;
  });

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 pt-5 pb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground/95 text-background">
          <Command className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold tracking-tight">Trazabilidad</span>
          <span className="text-[11px] text-muted-foreground">Panel administrador</span>
        </div>
      </div>

      <div className="px-2">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
            isActive("/")
              ? "bg-sidebar-accent text-foreground"
              : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-foreground",
          )}
        >
          <Search className="h-[15px] w-[15px]" />
          <span>Búsqueda de trazabilidad</span>
        </Link>
      </div>

      <div className="mt-5 mb-1 px-4 text-[10.5px] font-medium uppercase tracking-[0.09em] text-muted-foreground/80">
        Datos maestros
      </div>

      <nav className="linear-scrollbar flex-1 space-y-0.5 overflow-y-auto px-2 pb-6">
        {nav.map((group) => {
          const Icon = group.icon;
          const isOpen = open[group.key];
          const groupActive = group.children.some((child) => isActive(child.href));
          const rowClass = cn(
            "group flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
            groupActive
              ? "bg-sidebar-accent text-foreground"
              : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-foreground",
          );

          return (
            <div key={group.key}>
              <button
                type="button"
                onClick={() => setOpen((state) => ({ ...state, [group.key]: !state[group.key] }))}
                className={rowClass}
              >
                <Icon className="h-[15px] w-[15px]" />
                <span className="flex-1 truncate text-left">{group.label}</span>
                <span className="rounded-md bg-background/60 px-1.5 py-[1px] text-[10.5px] font-medium text-muted-foreground ring-1 ring-inset ring-border/70">
                  {group.children.length}
                </span>
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {isOpen && (
                <div className="relative ml-[19px] mt-0.5 mb-1 pl-3">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-0 top-1 bottom-1 border-l border-tree-guide"
                  />
                  {group.children.map((child) => {
                    const active = isActive(child.href);
                    return (
                      <div key={child.href} className="relative">
                        <span
                          aria-hidden
                          className="pointer-events-none absolute left-0 top-1/2 h-px w-2.5 -translate-y-1/2 bg-tree-guide"
                        />
                        <a
                          href={child.href}
                          className={cn(
                            "ml-3 flex items-center rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors",
                            active
                              ? "bg-sidebar-accent text-foreground"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-foreground",
                          )}
                        >
                          <span className="truncate">{child.label}</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-foreground">
            AD
          </div>
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-[12.5px] font-medium">Admin</span>
            <span className="truncate text-[11px] text-muted-foreground">NA Carrera</span>
          </div>
          <div className="h-1.5 w-1.5 rounded-full bg-success" aria-label="En línea" />
        </div>
      </div>
    </aside>
  );
}
