import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Layers,
  Waves,
  Flame,
  CircleDot,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Leaf = { label: string; to: string };
type Group = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  to?: string;
  children?: Leaf[];
};

const nav: Group[] = [
  {
    key: "trafila",
    label: "Trafila",
    icon: Layers,
    count: 2,
    children: [
      { label: "Categorías", to: "/trafila/categorias" },
      { label: "Modelos", to: "/trafila/modelos" },
    ],
  },
  { key: "bandas", label: "Bandas", icon: Waves, to: "/bandas" },
  { key: "vulcanizado", label: "Vulcanizado", icon: Flame, to: "/vulcanizado" },
  {
    key: "neumaticos",
    label: "Neumáticos",
    icon: CircleDot,
    count: 1,
    children: [{ label: "Modelos", to: "/neumaticos/modelos" }],
  },
];

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => pathname === to;

  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const g of nav) {
      if (g.children?.some((c) => pathname.startsWith(c.to))) initial[g.key] = true;
    }
    // default: keep Trafila open like the reference
    if (initial.trafila === undefined) initial.trafila = true;
    return initial;
  });

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground/95 text-background">
          <Command className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold tracking-tight">Trazabilidad</span>
          <span className="text-[11px] text-muted-foreground">Panel administrador</span>
        </div>
      </div>

      {/* Search item */}
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
          <span>Búsqueda de dependencias</span>
        </Link>
      </div>

      {/* Section label */}
      <div className="mt-5 mb-1 px-4 text-[10.5px] font-medium uppercase tracking-[0.09em] text-muted-foreground/80">
        Datos maestros
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-6">
        {nav.map((g) => {
          const Icon = g.icon;
          const hasChildren = !!g.children?.length;
          const isOpen = open[g.key];
          const groupActive =
            (g.to && isActive(g.to)) ||
            (hasChildren && g.children!.some((c) => isActive(c.to)));

          const rowClass = cn(
            "group flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
            groupActive
              ? "bg-sidebar-accent text-foreground"
              : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-foreground",
          );

          const content = (
            <>
              <Icon className="h-[15px] w-[15px]" />
              <span className="flex-1 truncate text-left">{g.label}</span>
              {typeof g.count === "number" && (
                <span className="rounded-md bg-background/60 px-1.5 py-[1px] text-[10.5px] font-medium text-muted-foreground ring-1 ring-inset ring-border/70">
                  {g.count}
                </span>
              )}
              {hasChildren &&
                (isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                ))}
            </>
          );

          return (
            <div key={g.key}>
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => setOpen((s) => ({ ...s, [g.key]: !s[g.key] }))}
                  className={rowClass}
                >
                  {content}
                </button>
              ) : (
                <Link to={g.to!} className={rowClass}>
                  {content}
                </Link>
              )}

              {hasChildren && isOpen && (
                <div className="relative ml-[19px] mt-0.5 mb-1 pl-3">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-0 top-1 bottom-1 border-l border-tree-guide"
                  />
                  {g.children!.map((c) => {
                    const active = isActive(c.to);
                    return (
                      <div key={c.to} className="relative">
                        <span
                          aria-hidden
                          className="pointer-events-none absolute left-0 top-1/2 h-px w-2.5 -translate-y-1/2 bg-tree-guide"
                        />
                        <Link
                          to={c.to}
                          className={cn(
                            "flex items-center rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors ml-3",
                            active
                              ? "bg-sidebar-accent text-foreground"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-foreground",
                          )}
                        >
                          {c.label}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-foreground">
            AD
          </div>
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-[12.5px] font-medium">Admin</span>
            <span className="truncate text-[11px] text-muted-foreground">Planta Sur</span>
          </div>
          <div className="h-1.5 w-1.5 rounded-full bg-success" aria-label="En línea" />
        </div>
      </div>
    </aside>
  );
}
