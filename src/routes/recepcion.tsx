import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  CalendarDays,
  Check,
  ChevronRight,
  Factory,
  FileText,
  Layers3,
  LogOut,
  Moon,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Sun,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RfidScanModal } from "@/components/hmi/RfidScanModal";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  createReceptionSummary,
  getLotBatchCount,
  getMaterialBatchCount,
  getMaterialPalletCount,
  useReceptionData,
  type ReceptionMaterialEntry,
  type ReceptionSummary,
  type ReceptionTraceLot,
} from "@/lib/reception-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recepcion")({
  component: ReceptionDashboardRoute,
});

type DateFilterValue =
  | "today"
  | "yesterday"
  | "this-month"
  | "last-7-days"
  | "last-30-days"
  | "last-3-months"
  | "last-12-months";

type ReceptionFilterKey = "date" | "materials" | "provider";

type ThemeMode = "dark" | "light";

const THEME_STORAGE_KEY = "na-carrera-recepcion-theme";

function getStoredTheme() {
  if (typeof window === "undefined") return undefined;

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "light" || storedTheme === "dark" ? storedTheme : undefined;
}

const dateFilterOptions: { value: DateFilterValue; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "yesterday", label: "Ayer" },
  { value: "this-month", label: "Este mes" },
  { value: "last-7-days", label: "Últimos 7 días" },
  { value: "last-30-days", label: "Últimos 30 días" },
  { value: "last-3-months", label: "Últimos 3 meses" },
  { value: "last-12-months", label: "Últimos 12 meses" },
];

function ReceptionDashboardRoute() {
  const currentPath = useRouterState({ select: (state) => state.location.pathname });
  const { receptions, deleteReception } = useReceptionData();
  const receptionRows = receptions.map(createReceptionSummary);
  const dashboardCards = [
    { label: "Remitos", value: receptionRows.length },
    { label: "Rollos", value: sumReceptionValue(receptionRows, "rolls") },
    { label: "Lotes", value: sumReceptionValue(receptionRows, "lots") },
    { label: "Pallets", value: sumReceptionValue(receptionRows, "pallets") },
    { label: "Batch", value: sumReceptionValue(receptionRows, "batch") },
  ];
  const [selectedReceptionId, setSelectedReceptionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterValue | null>(null);
  const [materialFilters, setMaterialFilters] = useState<string[]>([]);
  const [providerFilters, setProviderFilters] = useState<string[]>([]);
  const [isPanelAuthenticated, setIsPanelAuthenticated] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [isThemeReady, setIsThemeReady] = useState(false);
  const selectedReception = receptionRows.find((row) => row.id === selectedReceptionId);
  const materialFilterOptions = useMemo(
    () => Array.from(new Set(receptionRows.flatMap((row) => row.materials))).sort(),
    [receptionRows],
  );
  const providerFilterOptions = useMemo(
    () =>
      Array.from(
        new Set(
          receptionRows.flatMap((row) =>
            row.provider
              .split(",")
              .map((provider) => provider.trim())
              .filter(Boolean),
          ),
        ),
      ).sort(),
    [receptionRows],
  );
  const filteredReceptionRows = useMemo(
    () =>
      receptionRows.filter((row) => {
        const needle = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !needle ||
          row.remito.toLowerCase().includes(needle) ||
          row.provider.toLowerCase().includes(needle) ||
          row.materials.some((material) => material.toLowerCase().includes(needle));
        const matchesDate = !dateFilter || matchesDateFilter(row.receptionDate, dateFilter);
        const matchesMaterial =
          materialFilters.length === 0 ||
          materialFilters.some((material) => row.materials.includes(material));
        const rowProviders = row.provider
          .split(",")
          .map((provider) => provider.trim())
          .filter(Boolean);
        const matchesProvider =
          providerFilters.length === 0 ||
          providerFilters.some((provider) => rowProviders.includes(provider));

        return matchesSearch && matchesDate && matchesMaterial && matchesProvider;
      }),
    [dateFilter, materialFilters, providerFilters, receptionRows, searchQuery],
  );
  const activeFilterCount = [
    Boolean(dateFilter),
    materialFilters.length > 0,
    providerFilters.length > 0,
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;
  const dateFilterLabel = dateFilter
    ? dateFilterOptions.find((option) => option.value === dateFilter)?.label
    : undefined;

  useEffect(() => {
    setTheme(getStoredTheme() ?? "dark");
    setIsThemeReady(true);
  }, []);

  useEffect(() => {
    if (!isThemeReady) return;

    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [isThemeReady, theme]);

  const clearFilters = () => {
    setDateFilter(null);
    setMaterialFilters([]);
    setProviderFilters([]);
  };

  const toggleMaterialFilter = (material: string) => {
    setMaterialFilters((current) =>
      current.includes(material)
        ? current.filter((value) => value !== material)
        : [...current, material],
    );
  };

  const toggleProviderFilter = (provider: string) => {
    setProviderFilters((current) =>
      current.includes(provider)
        ? current.filter((value) => value !== provider)
        : [...current, provider],
    );
  };

  const handleLogout = () => {
    setSelectedReceptionId(null);
    setIsPanelAuthenticated(false);
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  if (!isPanelAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <RfidScanModal
          open
          title="Acceso Recepción"
          heading="Acerque su tarjeta NFC"
          helperText="Escanee la tarjeta para acceder al panel de recepción."
          placeholder="Código NFC..."
          onAuth={() => setIsPanelAuthenticated(true)}
        />
      </div>
    );
  }

  if (currentPath !== "/recepcion" && currentPath !== "/recepcion/") {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/70">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-4 px-6 py-6 sm:flex sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
            Dashboard Recepción
          </h1>
          <div className="contents sm:flex sm:items-center sm:gap-2">
            <div className="justify-self-end sm:justify-self-auto">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
            <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:justify-end">
              <Button
                asChild
                size="sm"
                className="h-8 gap-1.5 bg-[#5E6AD2] text-white hover:bg-[#6875E8]"
              >
                <Link to="/recepcion/nueva">
                  <Plus className="h-3.5 w-3.5" />
                  Nueva recepción
                </Link>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 border-border/70 bg-card text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-6 sm:px-8 lg:px-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {dashboardCards.map((card) => (
            <div key={card.label} className="rounded-lg border border-border/70 bg-card p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {card.label}
              </div>
              <div className="mt-2 font-mono text-[26px] font-semibold tracking-tight text-foreground">
                {card.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[260px] flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar remito, materiales o proveedor"
                className="h-9 border-border/70 bg-card pl-9 pr-9 text-[13px]"
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-9 gap-2 border-border/70 bg-card px-3 text-[13px] hover:bg-accent/60",
                filtersOpen && "border-border/80 bg-accent/65 text-foreground",
              )}
              onClick={() => setFiltersOpen((current) => !current)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-semibold text-foreground">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
            <div className="ml-auto text-[12px] text-muted-foreground">
              {filteredReceptionRows.length} de {receptionRows.length}
            </div>
          </div>

          {filtersOpen ? (
            <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2">
              {dateFilter && dateFilterLabel ? (
                <ReceptionFilterPill
                  label="Fecha"
                  operator="es"
                  value={dateFilterLabel}
                  onClear={() => setDateFilter(null)}
                />
              ) : null}
              {materialFilters.length > 0 ? (
                <ReceptionFilterPill
                  label="Materiales"
                  operator="contiene"
                  value={formatMultiFilterValue(materialFilters)}
                  onClear={() => setMaterialFilters([])}
                />
              ) : null}
              {providerFilters.length > 0 ? (
                <ReceptionFilterPill
                  label="Proveedor"
                  operator="es"
                  value={formatMultiFilterValue(providerFilters)}
                  onClear={() => setProviderFilters([])}
                />
              ) : null}

              <ReceptionAddFilterPopover
                dateFilter={dateFilter}
                materialFilters={materialFilters}
                providerFilters={providerFilters}
                materialOptions={materialFilterOptions}
                providerOptions={providerFilterOptions}
                onDateFilterChange={setDateFilter}
                onMaterialFilterToggle={toggleMaterialFilter}
                onProviderFilterToggle={toggleProviderFilter}
              />

              <Button
                type="button"
                variant="ghost"
                className="ml-auto h-8 px-3 text-[12.5px] text-muted-foreground hover:text-foreground"
                disabled={!hasActiveFilters}
                onClick={clearFilters}
              >
                Limpiar filtros
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-3 overflow-hidden rounded-lg border border-border/70 bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] table-fixed border-collapse text-[13px]">
              <colgroup>
                <col className="w-[15%]" />
                <col className="w-[14%]" />
                <col className="w-[22%]" />
                <col className="w-[17%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border/70 bg-background/40">
                  <HeaderCell className="whitespace-nowrap">Fecha y hora</HeaderCell>
                  <HeaderCell>Remito</HeaderCell>
                  <HeaderCell>Materiales</HeaderCell>
                  <HeaderCell>Proveedor</HeaderCell>
                  <HeaderCell>Rollos</HeaderCell>
                  <HeaderCell>Lotes</HeaderCell>
                  <HeaderCell>Pallets</HeaderCell>
                  <HeaderCell>Batch</HeaderCell>
                </tr>
              </thead>
              <tbody>
                {filteredReceptionRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      Sin recepciones para la búsqueda o filtros actuales.
                    </td>
                  </tr>
                ) : (
                  filteredReceptionRows.map((row) => (
                    <tr
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Ver detalle de recepción ${row.remito}`}
                      className={cn(
                        "cursor-pointer border-b border-border/50 outline-none transition-colors last:border-0 hover:bg-accent/40 focus-visible:bg-accent/45 focus-visible:ring-1 focus-visible:ring-ring",
                        selectedReceptionId === row.id && "bg-accent/35",
                      )}
                      onClick={() => setSelectedReceptionId(row.id)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        setSelectedReceptionId(row.id);
                      }}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] text-foreground">
                        {row.dateTime}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] text-foreground">
                        {row.remito}
                      </td>
                      <td className="px-4 py-3 text-foreground/90">
                        <div className="flex flex-wrap gap-1.5">
                          {row.materials.map((material) => (
                            <span
                              key={`${row.id}-${material}`}
                              className="rounded-md border border-border/70 bg-background/40 px-2 py-0.5 font-mono text-[11.5px] text-foreground"
                            >
                              {material}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="truncate px-4 py-3 text-foreground/90" title={row.provider}>
                        {row.provider}
                      </td>
                      <MetricCell value={row.rolls} />
                      <MetricCell value={row.lots} />
                      <MetricCell value={row.pallets} />
                      <MetricCell value={row.batch} />
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedReception ? (
        <ReceptionDetailSheet
          reception={selectedReception}
          open={Boolean(selectedReception)}
          onOpenChange={(open) => {
            if (!open) setSelectedReceptionId(null);
          }}
          onDelete={() => {
            deleteReception(selectedReception.id);
            setSelectedReceptionId(null);
          }}
        />
      ) : null}
    </div>
  );
}

function ThemeToggle({ theme, onToggle }: { theme: ThemeMode; onToggle: () => void }) {
  const isLight = theme === "light";

  return (
    <button
      type="button"
      aria-label={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      aria-pressed={theme === "dark"}
      title={isLight ? "Modo claro" : "Modo oscuro"}
      onClick={onToggle}
      className="group inline-grid h-8 shrink-0 grid-cols-2 rounded-md border border-border/80 bg-background/70 p-0.5 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <span
        className={cn(
          "grid h-7 w-7 place-items-center rounded-[6px] transition-all",
          isLight
            ? "bg-card text-foreground shadow-[0_1px_2px_rgb(15_23_42/0.08)] ring-1 ring-border/70"
            : "text-muted-foreground/80 group-hover:text-foreground",
        )}
      >
        <Sun className="h-3.5 w-3.5" strokeWidth={1.8} />
      </span>
      <span
        className={cn(
          "grid h-7 w-7 place-items-center rounded-[6px] transition-all",
          !isLight
            ? "bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.28)] ring-1 ring-border/70"
            : "text-muted-foreground/80 group-hover:text-foreground",
        )}
      >
        <Moon className="h-3.5 w-3.5" strokeWidth={1.8} />
      </span>
    </button>
  );
}

function ReceptionFilterPill({
  label,
  operator,
  value,
  onClear,
}: {
  label: string;
  operator: string;
  value: string;
  onClear: () => void;
}) {
  return (
    <div className="inline-flex h-8 max-w-full items-center overflow-hidden rounded-full border border-border/70 bg-background/45 text-[12.5px] shadow-sm">
      <span className="px-3 font-medium text-foreground">{label}</span>
      <span className="border-l border-border/70 bg-card/70 px-2.5 text-muted-foreground">
        {operator}
      </span>
      <span className="max-w-[180px] truncate border-l border-border/70 px-3 font-medium text-foreground">
        {value}
      </span>
      <button
        type="button"
        className="flex h-full w-8 items-center justify-center border-l border-border/70 text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
        aria-label={`Quitar filtro ${label}`}
        onClick={onClear}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ReceptionAddFilterPopover({
  dateFilter,
  materialFilters,
  providerFilters,
  materialOptions,
  providerOptions,
  onDateFilterChange,
  onMaterialFilterToggle,
  onProviderFilterToggle,
}: {
  dateFilter: DateFilterValue | null;
  materialFilters: string[];
  providerFilters: string[];
  materialOptions: string[];
  providerOptions: string[];
  onDateFilterChange: (value: DateFilterValue) => void;
  onMaterialFilterToggle: (value: string) => void;
  onProviderFilterToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<ReceptionFilterKey | null>(null);
  const [showOptionsOnRight, setShowOptionsOnRight] = useState(true);
  const availableFilters = [
    {
      key: "date" as const,
      label: "Fecha",
      icon: CalendarDays,
      disabled: false,
    },
    {
      key: "materials" as const,
      label: "Materiales",
      icon: Factory,
      disabled: materialOptions.length === 0,
    },
    {
      key: "provider" as const,
      label: "Proveedor",
      icon: UserRound,
      disabled: providerOptions.length === 0,
    },
  ];
  const canAddFilter = availableFilters.some((filter) => !filter.disabled);

  const close = () => {
    setOpen(false);
    setSelectedFilter(null);
  };

  useEffect(() => {
    if (!open) return;

    const updatePlacement = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      if (!triggerRect) return;

      const menuWidth = 288;
      const optionsWidth = 288;
      const panelGap = 8;
      const viewportGutter = 16;
      const spaceToRight = window.innerWidth - triggerRect.left - viewportGutter;

      setShowOptionsOnRight(spaceToRight >= menuWidth + optionsWidth + panelGap);
    };

    updatePlacement();
    window.addEventListener("resize", updatePlacement);

    return () => {
      window.removeEventListener("resize", updatePlacement);
    };
  }, [open]);

  const menuPanel = (
    <div className="w-72 rounded-lg border border-border/80 bg-card p-1 shadow-xl">
      {availableFilters.map((filter) => (
        <FilterMenuButton
          key={filter.key}
          icon={filter.icon}
          label={filter.label}
          active={selectedFilter === filter.key}
          disabled={filter.disabled}
          onActivate={() => setSelectedFilter(filter.key)}
        />
      ))}
    </div>
  );

  const optionPanel = selectedFilter ? (
    <div className="w-72 rounded-lg border border-border/80 bg-card p-1 shadow-xl">
      <FilterOptionPanel
        filterKey={selectedFilter}
        dateFilter={dateFilter}
        materialFilters={materialFilters}
        providerFilters={providerFilters}
        materialOptions={materialOptions}
        providerOptions={providerOptions}
        onSelectDate={(value) => {
          onDateFilterChange(value);
          close();
        }}
        onToggleMaterial={onMaterialFilterToggle}
        onToggleProvider={onProviderFilterToggle}
      />
    </div>
  ) : null;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSelectedFilter(null);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="ghost"
          className="h-8 gap-2 px-3 text-[12.5px] text-foreground hover:bg-accent/60"
          disabled={!canAddFilter}
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar filtro
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={showOptionsOnRight ? "start" : "end"}
        className="flex w-auto items-start gap-2 border-0 bg-transparent p-0 shadow-none"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {showOptionsOnRight ? (
          <>
            {menuPanel}
            {optionPanel}
          </>
        ) : (
          <>
            {optionPanel}
            {menuPanel}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

function FilterOptionPanel({
  filterKey,
  dateFilter,
  materialFilters,
  providerFilters,
  materialOptions,
  providerOptions,
  onSelectDate,
  onToggleMaterial,
  onToggleProvider,
}: {
  filterKey: ReceptionFilterKey;
  dateFilter: DateFilterValue | null;
  materialFilters: string[];
  providerFilters: string[];
  materialOptions: string[];
  providerOptions: string[];
  onSelectDate: (value: DateFilterValue) => void;
  onToggleMaterial: (value: string) => void;
  onToggleProvider: (value: string) => void;
}) {
  const title =
    filterKey === "date" ? "Fecha" : filterKey === "materials" ? "Materiales" : "Proveedor";
  const options =
    filterKey === "date"
      ? dateFilterOptions
      : filterKey === "materials"
        ? materialOptions.map((value) => ({ value, label: value }))
        : providerOptions.map((value) => ({ value, label: value }));

  return (
    <div>
      <div className="mb-1 flex h-8 items-center px-3 text-[12.5px] font-medium text-muted-foreground">
        {title}
      </div>
      <div className="space-y-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              "flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-[13px] text-foreground transition-colors hover:bg-accent/60",
              isFilterOptionSelected({
                filterKey,
                value: option.value,
                dateFilter,
                materialFilters,
                providerFilters,
              }) && "bg-accent/45",
            )}
            onClick={() => {
              if (filterKey === "date") {
                onSelectDate(option.value as DateFilterValue);
                return;
              }
              if (filterKey === "materials") {
                onToggleMaterial(option.value);
                return;
              }
              onToggleProvider(option.value);
            }}
          >
            <span className="flex h-4 w-4 items-center justify-center">
              {isFilterOptionSelected({
                filterKey,
                value: option.value,
                dateFilter,
                materialFilters,
                providerFilters,
              }) ? (
                <Check className="h-3.5 w-3.5 text-[#A8B1FF]" />
              ) : null}
            </span>
            <span className="min-w-0 truncate">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterMenuButton({
  icon: Icon,
  label,
  active,
  disabled,
  onActivate,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  disabled: boolean;
  onActivate: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-[13px] transition-colors",
        disabled
          ? "cursor-not-allowed text-muted-foreground/50"
          : active
            ? "bg-accent/55 text-foreground"
            : "text-foreground hover:bg-accent/60",
      )}
      disabled={disabled}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={onActivate}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span>{label}</span>
      {!disabled ? <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" /> : null}
    </button>
  );
}

function ReceptionDetailSheet({
  reception,
  open,
  onOpenChange,
  onDelete,
}: {
  reception: ReceptionSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-none overflow-visible border-border/80 bg-card p-0 shadow-2xl dark:bg-[#0e0f11] [&>button:first-child]:hidden sm:w-[760px] sm:max-w-[760px]"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute left-3 top-1/2 z-[60] h-9 w-9 -translate-y-1/2 rounded-full border border-border/80 bg-card text-muted-foreground shadow-lg hover:bg-card hover:text-foreground sm:-left-5"
          title="Minimizar"
          aria-label="Minimizar detalle"
          onClick={() => onOpenChange(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="h-full overflow-y-auto px-6 pb-24 pt-6 [scrollbar-gutter:stable]">
          <SheetHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5E6AD2] dark:text-[#A8B1FF]">
                  <FileText className="h-3.5 w-3.5" />
                  Detalle Recepción
                </div>
                <SheetTitle className="text-[24px] font-semibold tracking-tight text-foreground">
                  Remito Número {reception.remito}
                </SheetTitle>
              </div>
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 bg-card text-muted-foreground hover:bg-accent/70 hover:text-foreground dark:bg-[#0e0f11]"
                  title="Cerrar"
                  aria-label="Cerrar detalle"
                >
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <DetailMeta label="Fecha de recepción" value={reception.dateTime} mono />
            <DetailMeta label="Proveedor" value={reception.provider} />
            <DetailMeta label="Materiales" value={String(reception.materials.length)} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <PanelMetric label="Rollos" value={String(reception.rolls)} />
            <PanelMetric label="Lotes" value={String(reception.lots)} />
            <PanelMetric label="Pallets" value={String(reception.pallets)} />
            <PanelMetric label="Batch" value={String(reception.batch)} />
          </div>

          <DetailSection
            icon={<Boxes className="h-4 w-4 text-[#5E6AD2] dark:text-[#A8B1FF]" />}
            title="Trazabilidad"
          >
            <TraceMaterialsSummary materials={reception.traceMaterials} />
          </DetailSection>
        </div>
        <div className="absolute bottom-0 left-0 right-4 z-[65] flex justify-end gap-2 border-t border-border/80 bg-card/95 px-6 py-4 backdrop-blur dark:bg-[#0e0f11]/95">
          <Button asChild type="button" variant="secondary" className="h-9 gap-2">
            <Link to="/recepcion/nueva" search={{ editId: reception.id }}>
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" className="h-9 gap-2">
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="z-[90] border-border/80 bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar recepción</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción elimina directamente el remito {reception.remito} del panel.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={onDelete}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TraceMaterialsSummary({ materials }: { materials: ReceptionMaterialEntry[] }) {
  if (materials.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/80 bg-background/30 px-3 py-3 text-[12.5px] text-muted-foreground">
        Sin materiales registrados.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {materials.map((material) => {
        const totalPallets = getMaterialPalletCount(material);
        const totalBatches = getMaterialBatchCount(material);
        const isRollMaterial = material.rolls.length > 0;

        return (
          <div
            key={material.id}
            className="rounded-md border border-border/70 bg-card/60 px-4 py-3"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <div className="flex min-w-0 items-center gap-2">
                <Boxes className="h-3.5 w-3.5 shrink-0 text-[#5E6AD2] dark:text-[#A8B1FF]" />
                <span className="text-[15px] font-semibold text-foreground">
                  Recepción Material {material.materialCode}
                </span>
              </div>
              {isRollMaterial ? (
                <span className="text-[12.5px] text-muted-foreground">
                  ({material.rolls.length} {pluralize(material.rolls.length, "rollo", "rollos")})
                </span>
              ) : (
                <span className="text-[12.5px] text-muted-foreground">
                  ({material.lots.length} {pluralize(material.lots.length, "lote", "lotes")},{" "}
                  {totalPallets} {pluralize(totalPallets, "pallet", "pallets")}, {totalBatches}{" "}
                  batches)
                </span>
              )}
            </div>

            {isRollMaterial ? (
              <RollsTraceabilitySummary rolls={material.rolls} />
            ) : (
              <LotsTraceabilitySummary lots={material.lots} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function LotsTraceabilitySummary({ lots }: { lots: ReceptionTraceLot[] }) {
  if (lots.length === 0) {
    return (
      <div className="mt-4 rounded-md border border-dashed border-border/80 bg-background/30 px-3 py-3 text-[12.5px] text-muted-foreground">
        Sin lotes registrados.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {lots.map((lot) => (
        <div
          key={lot.code}
          className="rounded-md border border-border/70 bg-background/35 px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-3.5 w-3.5 shrink-0 text-[#5E6AD2] dark:text-[#A8B1FF]" />
              <span className="font-mono text-[15px] font-semibold text-foreground">
                Lote {lot.code}
              </span>
            </div>
            <span className="text-[12.5px] text-muted-foreground">
              ({lot.palets.length} {pluralize(lot.palets.length, "pallet", "pallets")},{" "}
              {getLotBatchCount(lot)} batches)
            </span>
          </div>

          <div className="mt-4 space-y-4 border-l border-border/80 pl-4">
            {lot.palets.map((pallet) => (
              <div key={pallet.code}>
                <div className="flex flex-wrap items-center gap-2">
                  <Layers3 className="h-4 w-4 text-[#5E6AD2] dark:text-[#A8B1FF]" />
                  <span className="font-mono text-[13px] font-semibold text-foreground">
                    Pallet {pallet.code}
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    ({pallet.batches.length} batches)
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {pallet.batches.map((batch) => (
                    <span
                      key={`${pallet.code}-${batch}`}
                      className="flex h-7 min-w-8 items-center justify-center rounded-md border border-border/80 bg-card/60 px-2 font-mono text-[12px] text-foreground"
                    >
                      {batch}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RollsTraceabilitySummary({ rolls }: { rolls: string[] }) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <Layers3 className="h-4 w-4 text-[#5E6AD2] dark:text-[#A8B1FF]" />
        <span className="font-mono text-[13.5px] font-semibold text-foreground">Rollos</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {rolls.map((roll) => (
          <span
            key={roll}
            className="flex h-7 min-w-8 items-center justify-center rounded-md border border-border/80 bg-background/45 px-2 font-mono text-[12px] text-foreground"
          >
            {roll}
          </span>
        ))}
      </div>
    </div>
  );
}

function DetailSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-6 rounded-lg border border-border/80 bg-background/35 p-5">
      <div className="mb-4 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-foreground">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

function DetailMeta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border/80 bg-background/35 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 truncate text-[13.5px] font-semibold text-foreground",
          mono && "font-mono",
        )}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function PanelMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/80 bg-background/35 p-3">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-[17px] font-semibold text-[#5E6AD2] dark:text-[#A8B1FF]">
        {value}
      </div>
    </div>
  );
}

function HeaderCell({ children, className }: { children: string; className?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  );
}

function MetricCell({ value }: { value: number }) {
  return <td className="px-4 py-3 font-mono text-[12.5px] text-foreground">{value}</td>;
}

function sumReceptionValue(rows: ReceptionSummary[], key: "rolls" | "lots" | "pallets" | "batch") {
  return rows.reduce((total, row) => total + row[key], 0);
}

function formatMultiFilterValue(values: string[]) {
  if (values.length <= 2) return values.join(", ");
  return `${values[0]}, ${values[1]} +${values.length - 2}`;
}

function isFilterOptionSelected({
  filterKey,
  value,
  dateFilter,
  materialFilters,
  providerFilters,
}: {
  filterKey: ReceptionFilterKey;
  value: string;
  dateFilter: DateFilterValue | null;
  materialFilters: string[];
  providerFilters: string[];
}) {
  if (filterKey === "date") return dateFilter === value;
  if (filterKey === "materials") return materialFilters.includes(value);
  return providerFilters.includes(value);
}

function matchesDateFilter(receptionDate: string, filter: DateFilterValue) {
  const date = parseLocalDate(receptionDate);
  if (!date) return false;

  const today = startOfDay(new Date());
  const yesterday = addDays(today, -1);

  if (filter === "today") return isSameDay(date, today);
  if (filter === "yesterday") return isSameDay(date, yesterday);
  if (filter === "this-month") {
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
  }

  const rangeStart =
    filter === "last-7-days"
      ? addDays(today, -6)
      : filter === "last-30-days"
        ? addDays(today, -29)
        : filter === "last-3-months"
          ? addMonths(today, -3)
          : addMonths(today, -12);

  return date >= rangeStart && date <= today;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return startOfDay(new Date(year, month - 1, day));
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}
