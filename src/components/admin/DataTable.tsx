import { useMemo, useState, type ReactNode } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: keyof T & string;
  header: string;
  className?: string;
  render?: (row: T) => ReactNode;
  mono?: boolean;
};

export function DataTable<T extends { id: string }>({
  columns,
  data,
  searchKeys,
  onAdd,
  emptyLabel = "Sin registros",
}: {
  columns: Column<T>[];
  data: T[];
  searchKeys?: (keyof T & string)[];
  onAdd?: () => void;
  emptyLabel?: string;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return data;
    const needle = q.toLowerCase();
    const keys = searchKeys ?? (columns.map((c) => c.key) as (keyof T & string)[]);
    return data.filter((row) =>
      keys.some((k) => String(row[k] ?? "").toLowerCase().includes(needle)),
    );
  }, [q, data, columns, searchKeys]);

  return (
    <div className="px-8 py-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            className="h-8 pl-8 text-[13px] bg-card border-border/70"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">
            {filtered.length} de {data.length}
          </span>
          <Button
            size="sm"
            onClick={onAdd}
            className="h-8 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border/70 bg-background/40">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      "px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
                      c.className,
                    )}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-[13px] text-muted-foreground"
                  >
                    {emptyLabel}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/50 last:border-0 transition-colors hover:bg-accent/40"
                  >
                    {columns.map((c) => {
                      const val = c.render ? c.render(row) : (row[c.key] as ReactNode);
                      return (
                        <td
                          key={c.key}
                          className={cn(
                            "px-4 py-2.5 text-foreground/90",
                            c.mono && "font-mono text-[12.5px] text-foreground",
                            c.className,
                          )}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
