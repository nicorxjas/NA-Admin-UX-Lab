// Mock data for the traceability admin panel. In-memory only.
export type TrafilaCategoria = { id: string; codigo: string; nombre: string; descripcion: string };
export type TrafilaModelo = { id: string; codigo: string; categoria: string; compuesto: string; diametroMm: number };
export type Banda = { id: string; codigo: string; nombre: string; ancho: number; largo: number };
export type Vulcanizado = { id: string; codigo: string; molde: string; temperatura: number; tiempoMin: number };
export type Neumatico = { id: string; codigo: string; modelo: string; medida: string; construccion: string };

export const trafilaCategorias: TrafilaCategoria[] = [
  { id: "TC-01", codigo: "TC-01", nombre: "Banda de rodamiento", descripcion: "Compuestos para tread" },
  { id: "TC-02", codigo: "TC-02", nombre: "Sidewall", descripcion: "Lateral del neumático" },
  { id: "TC-03", codigo: "TC-03", nombre: "Inner liner", descripcion: "Capa interna estanca" },
];

export const trafilaModelos: TrafilaModelo[] = [
  { id: "TM-1001", codigo: "TM-1001", categoria: "TC-01", compuesto: "SBR-2340", diametroMm: 180 },
  { id: "TM-1002", codigo: "TM-1002", categoria: "TC-01", compuesto: "SBR-2410", diametroMm: 200 },
  { id: "TM-1003", codigo: "TM-1003", categoria: "TC-02", compuesto: "NR-1102", diametroMm: 90 },
];

export const bandas: Banda[] = [
  { id: "BD-5001", codigo: "BD-5001", nombre: "Tread 195/65R15", ancho: 195, largo: 2100 },
  { id: "BD-5002", codigo: "BD-5002", nombre: "Tread 205/55R16", ancho: 205, largo: 2250 },
];

export const vulcanizados: Vulcanizado[] = [
  { id: "VL-9001", codigo: "VL-9001", molde: "M-15-A", temperatura: 170, tiempoMin: 14 },
  { id: "VL-9002", codigo: "VL-9002", molde: "M-16-B", temperatura: 172, tiempoMin: 16 },
];

export const neumaticoModelos: Neumatico[] = [
  { id: "NM-2201", codigo: "NM-2201", modelo: "Aventra HP", medida: "195/65R15", construccion: "Radial" },
  { id: "NM-2202", codigo: "NM-2202", modelo: "Aventra SUV", medida: "215/60R17", construccion: "Radial" },
];

// Dependency tree example. Keyed by any code.
export type StationEvent = {
  estacion: string;
  operario: string;
  maquina: string;
  timestamp: string;
  loteInsumo?: string;
  notas?: string;
};

export type DependencyNode = {
  codigo: string;
  tipo: string;
  descripcion: string;
  evento: StationEvent;
  hijos?: DependencyNode[];
};

export const dependencyDB: Record<string, DependencyNode> = {
  "NEU-778812": {
    codigo: "NEU-778812",
    tipo: "Neumático",
    descripcion: "Aventra HP 195/65R15",
    evento: {
      estacion: "Vulcanizado",
      operario: "María González",
      maquina: "PRENSA-04",
      timestamp: "2026-07-06 14:32:11",
      loteInsumo: "LOT-VL-9001-A",
      notas: "Ciclo OK. Enfriamiento 8 min.",
    },
    hijos: [
      {
        codigo: "BD-5001-778",
        tipo: "Banda",
        descripcion: "Tread 195/65R15",
        evento: {
          estacion: "Bandas",
          operario: "Julián Ferrari",
          maquina: "EXT-02",
          timestamp: "2026-07-06 09:14:47",
          loteInsumo: "LOT-TM-1001-C",
        },
        hijos: [
          {
            codigo: "TM-1001-C",
            tipo: "Trafila / Modelo",
            descripcion: "SBR-2340 · diámetro 180mm",
            evento: {
              estacion: "Trafila",
              operario: "Andrés Palacio",
              maquina: "TRAF-01",
              timestamp: "2026-07-05 22:03:20",
              loteInsumo: "MIX-338",
            },
          },
        ],
      },
      {
        codigo: "CARC-4471",
        tipo: "Carcasa",
        descripcion: "Carcasa radial 15\"",
        evento: {
          estacion: "Confección",
          operario: "Lucía Romero",
          maquina: "CONF-03",
          timestamp: "2026-07-06 11:02:05",
        },
      },
    ],
  },
  "BD-5001-778": {
    codigo: "BD-5001-778",
    tipo: "Banda",
    descripcion: "Tread 195/65R15",
    evento: {
      estacion: "Bandas",
      operario: "Julián Ferrari",
      maquina: "EXT-02",
      timestamp: "2026-07-06 09:14:47",
      loteInsumo: "LOT-TM-1001-C",
    },
    hijos: [
      {
        codigo: "TM-1001-C",
        tipo: "Trafila / Modelo",
        descripcion: "SBR-2340 · diámetro 180mm",
        evento: {
          estacion: "Trafila",
          operario: "Andrés Palacio",
          maquina: "TRAF-01",
          timestamp: "2026-07-05 22:03:20",
        },
      },
    ],
  },
};
