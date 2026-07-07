export type PrimitiveValue = string | number | boolean | null | undefined;

export type AuditFields = {
  created_at: string;
  updated_at: string;
  origin: string;
  synced_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

export type BaseMaster = AuditFields & {
  id: string;
};

export type ActiveMaster = BaseMaster & {
  activo: boolean;
};

export type MasterRecord = ActiveMaster & Record<string, PrimitiveValue>;

export const MASTER_KEYS = [
  "etapas_proceso",
  "estaciones",
  "maquinas",
  "dispositivos",
  "materiales",
  "modelos_producto",
  "cavidades",
  "moldes",
  "modelo_etapa_materiales",
  "especificaciones_modelo",
  "motivos_rechazo",
  "motivos_aceptacion",
  "motivos_parada",
  "proveedores",
  "configuraciones",
  "operarios",
  "turnos",
] as const;

export type MasterKey = (typeof MASTER_KEYS)[number];

export type FieldOption = {
  label: string;
  value: string;
};

export type FieldReference = {
  masterKey: MasterKey;
  valueKey?: string;
  labelKeys?: string[];
  includeInactive?: boolean;
};

export type MasterField = {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "select" | "textarea" | "date" | "time";
  required?: boolean;
  unique?: boolean;
  nullable?: boolean;
  options?: FieldOption[];
  reference?: FieldReference;
  placeholder?: string;
};

export type MasterColumn = {
  key: string;
  label: string;
  mono?: boolean;
  className?: string;
};

export type MasterConfig = {
  key: MasterKey;
  group: "operativo" | "rrhh";
  title: string;
  eyebrow: string;
  description: string;
  fields: MasterField[];
  columns: MasterColumn[];
  searchKeys: string[];
};

export type MasterState = Record<MasterKey, MasterRecord[]>;

const NOW = "2026-07-07T12:00:00.000Z";

function system(id: string): ActiveMaster {
  return {
    id,
    activo: true,
    created_at: NOW,
    updated_at: NOW,
    origin: "cloud",
    synced_at: NOW,
    created_by: "seed-admin",
    updated_by: "seed-admin",
  };
}

function record(id: string, values: Record<string, PrimitiveValue>): MasterRecord {
  return { ...system(id), ...values };
}

const maquinaVulcanizadoIds = [
  "maq-vul-01",
  "maq-vul-02",
  "maq-vul-03",
  "maq-vul-04",
  "maq-vul-05",
  "maq-vul-06",
];

export const initialMasterState: MasterState = {
  etapas_proceso: [
    record("etapa-trafila-grande", {
      codigo: "trafila_grande",
      nombre: "Trafila Grande",
      orden_flujo: 1,
    }),
    record("etapa-corte-tela", {
      codigo: "corte_tela",
      nombre: "Corte de Tela",
      orden_flujo: 2,
    }),
    record("etapa-armado", { codigo: "armado", nombre: "Armado", orden_flujo: 3 }),
    record("etapa-vulcanizado", {
      codigo: "vulcanizado",
      nombre: "Vulcanizado",
      orden_flujo: 4,
    }),
    record("etapa-control-final", {
      codigo: "control_final",
      nombre: "Control Final",
      orden_flujo: 5,
    }),
  ],
  maquinas: [
    record("maq-trafila-01", {
      codigo: "TRAF-GDE-01",
      nombre: "Trafila grande 01",
      tipo: "trafila",
      sector: "Preparacion",
    }),
    record("maq-corte-01", {
      codigo: "COR-TELA-01",
      nombre: "Cortadora de tela 01",
      tipo: "cortadora",
      sector: "Preparacion",
    }),
    record("maq-armado-01", {
      codigo: "ARM-01",
      nombre: "Puesto de armado 01",
      tipo: "armadora",
      sector: "Ensamble",
    }),
    ...maquinaVulcanizadoIds.map((id, index) =>
      record(id, {
        codigo: `PRENSA-${String(index + 1).padStart(2, "0")}`,
        nombre: `Prensa vulcanizado ${String(index + 1).padStart(2, "0")}`,
        tipo: "prensa_vulcanizado",
        sector: "Vulcanizado",
      }),
    ),
    record("maq-control-01", {
      codigo: "CTRL-FINAL-01",
      nombre: "Mesa de control final 01",
      tipo: "control_calidad",
      sector: "Calidad",
    }),
  ],
  estaciones: [
    record("est-trafila-grande", {
      codigo: "EST-TRAF-GDE",
      nombre: "Trafila Grande",
      etapa_id: "etapa-trafila-grande",
      maquina_id: "maq-trafila-01",
      sector: "Preparacion",
    }),
    record("est-corte-tela", {
      codigo: "EST-COR-TELA",
      nombre: "Corte de Tela",
      etapa_id: "etapa-corte-tela",
      maquina_id: "maq-corte-01",
      sector: "Preparacion",
    }),
    record("est-armado", {
      codigo: "EST-ARMADO",
      nombre: "Armado",
      etapa_id: "etapa-armado",
      maquina_id: "maq-armado-01",
      sector: "Ensamble",
    }),
    record("est-vulcanizado", {
      codigo: "EST-VULC",
      nombre: "Vulcanizado",
      etapa_id: "etapa-vulcanizado",
      maquina_id: "maq-vul-04",
      sector: "Vulcanizado",
    }),
    record("est-control-final", {
      codigo: "EST-CTRL-FIN",
      nombre: "Control Final",
      etapa_id: "etapa-control-final",
      maquina_id: "maq-control-01",
      sector: "Calidad",
    }),
  ],
  dispositivos: [
    record("dev-tablet-trafila", {
      codigo: "TAB-TRAF-01",
      nombre: "Tablet Trafila",
      tipo: "tablet",
      estacion_id: "est-trafila-grande",
      fingerprint: "fp-trafila-001",
      ultimo_contacto_at: "2026-07-07T10:42:00.000Z",
    }),
    record("dev-tablet-corte", {
      codigo: "TAB-CORTE-01",
      nombre: "Tablet Corte",
      tipo: "tablet",
      estacion_id: "est-corte-tela",
      fingerprint: "fp-corte-001",
      ultimo_contacto_at: "2026-07-07T10:39:00.000Z",
    }),
    record("dev-pc-armado", {
      codigo: "PC-ARM-01",
      nombre: "PC Armado",
      tipo: "pc",
      estacion_id: "est-armado",
      fingerprint: "fp-armado-001",
      ultimo_contacto_at: "2026-07-07T10:45:00.000Z",
    }),
    record("dev-lector-vulc", {
      codigo: "LECT-VULC-01",
      nombre: "Lector Vulcanizado",
      tipo: "lector_hid",
      estacion_id: "est-vulcanizado",
      fingerprint: "fp-vulc-001",
      ultimo_contacto_at: "2026-07-07T10:47:00.000Z",
    }),
    record("dev-pc-control", {
      codigo: "PC-CTRL-01",
      nombre: "PC Control Final",
      tipo: "pc",
      estacion_id: "est-control-final",
      fingerprint: "fp-control-001",
      ultimo_contacto_at: "2026-07-07T10:48:00.000Z",
    }),
  ],
  materiales: [
    record("mat-compuesto-slick", {
      codigo: "CMP-SLICK-A",
      nombre: "Compuesto slick A",
      tipo: "compuesto",
      unidad_medida: "kg",
    }),
    record("mat-compuesto-lluvia", {
      codigo: "CMP-RAIN-B",
      nombre: "Compuesto lluvia B",
      tipo: "compuesto",
      unidad_medida: "kg",
    }),
    record("mat-tela-nylon", {
      codigo: "TEL-NYL-120",
      nombre: "Tela nylon 120",
      tipo: "tela",
      unidad_medida: "m",
    }),
    record("mat-tela-poliester", {
      codigo: "TEL-POL-150",
      nombre: "Tela poliester 150",
      tipo: "tela",
      unidad_medida: "m",
    }),
    record("mat-cartucho", {
      codigo: "ENS-CART",
      nombre: "Ensamble cartucho",
      tipo: "cartucho",
      unidad_medida: "unidad",
    }),
  ],
  modelos_producto: [
    record("mod-banda-slick-13", {
      codigo: "BND-SLICK-13",
      nombre: "Banda slick 13",
      tipo_producto: "banda",
      version: "v1",
    }),
    record("mod-tela-slick-13", {
      codigo: "TELA-SLICK-13",
      nombre: "Tela cortada slick 13",
      tipo_producto: "tela_cortada",
      version: "v1",
    }),
    record("mod-cartucho-slick-13", {
      codigo: "CART-SLICK-13",
      nombre: "Cartucho slick 13",
      tipo_producto: "cartucho",
      version: "v1",
    }),
    record("mod-neu-slick-13", {
      codigo: "NEU-SLICK-13",
      nombre: "Neumatico competicion slick 13",
      tipo_producto: "neumatico",
      version: "v1",
    }),
    record("mod-neu-rain-13", {
      codigo: "NEU-RAIN-13",
      nombre: "Neumatico competicion lluvia 13",
      tipo_producto: "neumatico",
      version: "v1",
    }),
  ],
  cavidades: maquinaVulcanizadoIds.flatMap((maquinaId, index) => [
    record(`cav-${index + 1}-izq`, {
      maquina_id: maquinaId,
      codigo: "izquierda",
      posicion: 1,
    }),
    record(`cav-${index + 1}-der`, {
      maquina_id: maquinaId,
      codigo: "derecha",
      posicion: 2,
    }),
  ]),
  moldes: [
    record("molde-slick-13-a", {
      codigo: "MLD-SLICK-13-A",
      modelo_id: "mod-neu-slick-13",
      descripcion: "Molde principal para neumatico slick 13",
    }),
    record("molde-slick-13-b", {
      codigo: "MLD-SLICK-13-B",
      modelo_id: "mod-neu-slick-13",
      descripcion: "Molde alternativo para neumatico slick 13",
    }),
    record("molde-rain-13-a", {
      codigo: "MLD-RAIN-13-A",
      modelo_id: "mod-neu-rain-13",
      descripcion: "Molde para neumatico lluvia 13",
    }),
  ],
  modelo_etapa_materiales: [
    record("mem-banda-compuesto", {
      modelo_id: "mod-banda-slick-13",
      etapa_id: "etapa-trafila-grande",
      material_id: "mat-compuesto-slick",
      obligatorio: true,
      cantidad_teorica: 7.5,
      unidad_medida: "kg",
    }),
    record("mem-tela-nylon", {
      modelo_id: "mod-tela-slick-13",
      etapa_id: "etapa-corte-tela",
      material_id: "mat-tela-nylon",
      obligatorio: true,
      cantidad_teorica: 2.25,
      unidad_medida: "m",
    }),
    record("mem-cartucho-banda", {
      modelo_id: "mod-cartucho-slick-13",
      etapa_id: "etapa-armado",
      material_id: "mat-cartucho",
      obligatorio: true,
      cantidad_teorica: 1,
      unidad_medida: "unidad",
    }),
  ],
  especificaciones_modelo: [
    record("esp-banda-ancho", {
      modelo_id: "mod-banda-slick-13",
      etapa_id: "etapa-trafila-grande",
      variable: "ancho",
      valor_objetivo: 182,
      tolerancia_min: 180.5,
      tolerancia_max: 183.5,
      unidad_medida: "mm",
      version: "v1",
      vigente_desde: "2026-07-01",
      vigente_hasta: null,
    }),
    record("esp-banda-lomo", {
      modelo_id: "mod-banda-slick-13",
      etapa_id: "etapa-trafila-grande",
      variable: "lomo_centro",
      valor_objetivo: 6.4,
      tolerancia_min: 6.1,
      tolerancia_max: 6.7,
      unidad_medida: "mm",
      version: "v1",
      vigente_desde: "2026-07-01",
      vigente_hasta: null,
    }),
    record("esp-corte-angulo", {
      modelo_id: "mod-tela-slick-13",
      etapa_id: "etapa-corte-tela",
      variable: "angulo",
      valor_objetivo: 45,
      tolerancia_min: 44.5,
      tolerancia_max: 45.5,
      unidad_medida: "grados",
      version: "v1",
      vigente_desde: "2026-07-01",
      vigente_hasta: null,
    }),
  ],
  motivos_rechazo: [
    record("rech-medida-fuera", {
      codigo: "MED-FUERA-TOL",
      descripcion: "Medida fuera de tolerancia",
      aplica_a: "ambos",
      requiere_observacion: true,
    }),
    record("rech-defecto-visual", {
      codigo: "DEF-VISUAL",
      descripcion: "Defecto visual",
      aplica_a: "neumatico",
      requiere_observacion: true,
    }),
    record("rech-id-danado", {
      codigo: "ID-DANADO",
      descripcion: "Identificacion fisica danada",
      aplica_a: "ambos",
      requiere_observacion: false,
    }),
  ],
  motivos_aceptacion: [
    record("acept-control-visual", {
      codigo: "CTRL-VISUAL-OK",
      descripcion: "Control visual aprobado",
      aplica_a: "neumatico",
      requiere_observacion: false,
    }),
    record("acept-medidas-ok", {
      codigo: "MEDIDAS-OK",
      descripcion: "Mediciones dentro de tolerancia",
      aplica_a: "neumatico",
      requiere_observacion: false,
    }),
    record("acept-liberacion-supervisor", {
      codigo: "LIB-SUPERVISOR",
      descripcion: "Liberacion aprobada por supervisor",
      aplica_a: "neumatico",
      requiere_observacion: true,
    }),
  ],
  motivos_parada: [
    record("parada-cambio-molde", {
      codigo: "CAMBIO-MOLDE",
      descripcion: "Cambio de molde",
      categoria: "preparacion",
      planificada: true,
    }),
    record("parada-falta-material", {
      codigo: "FALTA-MATERIAL",
      descripcion: "Falta de material",
      categoria: "abastecimiento",
      planificada: false,
    }),
    record("parada-mecanica", {
      codigo: "MECANICA",
      descripcion: "Intervencion mecanica",
      categoria: "mantenimiento",
      planificada: false,
    }),
  ],
  proveedores: [
    record("prov-cauchos-sur", {
      codigo: "PRV-CAU-SUR",
      nombre: "Cauchos Sur",
    }),
    record("prov-textiles-racing", {
      codigo: "PRV-TEX-RAC",
      nombre: "Textiles Racing",
    }),
  ],
  configuraciones: [
    record("cfg-sync-batch", {
      clave: "sync.batch_size",
      valor: "100",
      ambito: "edge",
      ambito_id: null,
      descripcion: "Cantidad maxima de eventos por lote de sincronizacion",
      requiere_reinicio: false,
    }),
    record("cfg-print-timeout", {
      clave: "impresion.timeout_ms",
      valor: "8000",
      ambito: "estacion",
      ambito_id: "est-vulcanizado",
      descripcion: "Timeout de impresion o reimpresion de etiquetas",
      requiere_reinicio: false,
    }),
    record("cfg-offline-mode", {
      clave: "operacion.offline_habilitada",
      valor: "true",
      ambito: "planta",
      ambito_id: null,
      descripcion: "Habilita captura contra nodo edge cuando no hay conectividad cloud",
      requiere_reinicio: true,
    }),
  ],
  operarios: [
    record("op-1024", {
      usuario_id: null,
      legajo: "1024",
      nombre: "Maria Gonzalez",
      nfc_uid: "NFC-04A1-9982",
      sector: "Vulcanizado",
    }),
    record("op-1077", {
      usuario_id: null,
      legajo: "1077",
      nombre: "Julian Ferrari",
      nfc_uid: "NFC-11C9-3388",
      sector: "Preparacion",
    }),
    record("op-1142", {
      usuario_id: null,
      legajo: "1142",
      nombre: "Lucia Romero",
      nfc_uid: "NFC-23D0-5501",
      sector: "Ensamble",
    }),
    record("op-1210", {
      usuario_id: null,
      legajo: "1210",
      nombre: "Andres Palacio",
      nfc_uid: null,
      sector: "Calidad",
    }),
  ],
  turnos: [
    record("turno-a", { codigo: "A", nombre: "Turno A", hora_inicio: "06:00", hora_fin: "14:00" }),
    record("turno-b", { codigo: "B", nombre: "Turno B", hora_inicio: "14:00", hora_fin: "22:00" }),
    record("turno-noche", {
      codigo: "NOCHE",
      nombre: "Turno Noche",
      hora_inicio: "22:00",
      hora_fin: "06:00",
    }),
  ],
};

const yesNoOptions: FieldOption[] = [
  { value: "true", label: "Si" },
  { value: "false", label: "No" },
];

export const masterConfigs: Record<MasterKey, MasterConfig> = {
  etapas_proceso: {
    key: "etapas_proceso",
    group: "operativo",
    eyebrow: "Flujo Fase 1",
    title: "Etapas de proceso",
    description:
      "Catalogo canonico del flujo Trafila Grande, Corte de Tela, Armado, Vulcanizado y Control Final.",
    fields: [
      { key: "codigo", label: "Codigo", type: "text", required: true, unique: true },
      { key: "nombre", label: "Nombre", type: "text", required: true },
      { key: "orden_flujo", label: "Orden de flujo", type: "number", required: true },
    ],
    columns: [
      { key: "codigo", label: "Codigo", mono: true, className: "w-48" },
      { key: "nombre", label: "Nombre" },
      { key: "orden_flujo", label: "Orden", className: "w-24 text-right" },
    ],
    searchKeys: ["codigo", "nombre"],
  },
  estaciones: {
    key: "estaciones",
    group: "operativo",
    eyebrow: "Captura",
    title: "Estaciones",
    description: "Puestos fisicos o logicos donde se capturan operaciones de planta.",
    fields: [
      { key: "codigo", label: "Codigo", type: "text", required: true, unique: true },
      { key: "nombre", label: "Nombre", type: "text", required: true },
      {
        key: "etapa_id",
        label: "Etapa",
        type: "select",
        reference: { masterKey: "etapas_proceso" },
      },
      {
        key: "maquina_id",
        label: "Maquina principal",
        type: "select",
        reference: { masterKey: "maquinas" },
        nullable: true,
      },
      { key: "sector", label: "Sector", type: "text", nullable: true },
    ],
    columns: [
      { key: "codigo", label: "Codigo", mono: true, className: "w-40" },
      { key: "nombre", label: "Nombre" },
      { key: "etapa_id", label: "Etapa" },
      { key: "maquina_id", label: "Maquina" },
      { key: "sector", label: "Sector", className: "w-32" },
    ],
    searchKeys: ["codigo", "nombre", "sector"],
  },
  maquinas: {
    key: "maquinas",
    group: "operativo",
    eyebrow: "Planta",
    title: "Maquinas",
    description:
      "Equipos productivos, incluidas las prensas de vulcanizado con dos cavidades por maquina.",
    fields: [
      { key: "codigo", label: "Codigo", type: "text", required: true, unique: true },
      { key: "nombre", label: "Nombre", type: "text", required: true },
      {
        key: "tipo",
        label: "Tipo",
        type: "select",
        required: true,
        options: [
          { value: "trafila", label: "Trafila" },
          { value: "cortadora", label: "Cortadora" },
          { value: "armadora", label: "Armadora" },
          { value: "prensa_vulcanizado", label: "Prensa vulcanizado" },
          { value: "control_calidad", label: "Control calidad" },
        ],
      },
      { key: "sector", label: "Sector", type: "text", nullable: true },
    ],
    columns: [
      { key: "codigo", label: "Codigo", mono: true, className: "w-40" },
      { key: "nombre", label: "Nombre" },
      { key: "tipo", label: "Tipo", className: "w-44" },
      { key: "sector", label: "Sector", className: "w-36" },
    ],
    searchKeys: ["codigo", "nombre", "tipo", "sector"],
  },
  dispositivos: {
    key: "dispositivos",
    group: "operativo",
    eyebrow: "Edge",
    title: "Dispositivos",
    description: "Tablets, PCs, lectores e impresoras que originan capturas o impresiones.",
    fields: [
      { key: "codigo", label: "Codigo", type: "text", required: true, unique: true },
      { key: "nombre", label: "Nombre", type: "text", nullable: true },
      {
        key: "tipo",
        label: "Tipo",
        type: "select",
        required: true,
        options: [
          { value: "tablet", label: "Tablet" },
          { value: "pc", label: "PC" },
          { value: "lector_hid", label: "Lector HID" },
          { value: "bridge", label: "Bridge" },
          { value: "impresora", label: "Impresora" },
        ],
      },
      {
        key: "estacion_id",
        label: "Estacion",
        type: "select",
        reference: { masterKey: "estaciones" },
        nullable: true,
      },
      { key: "fingerprint", label: "Fingerprint", type: "text", nullable: true },
      { key: "ultimo_contacto_at", label: "Ultimo contacto", type: "text", nullable: true },
    ],
    columns: [
      { key: "codigo", label: "Codigo", mono: true, className: "w-40" },
      { key: "nombre", label: "Nombre" },
      { key: "tipo", label: "Tipo", className: "w-32" },
      { key: "estacion_id", label: "Estacion" },
      { key: "ultimo_contacto_at", label: "Ultimo contacto", mono: true, className: "w-48" },
    ],
    searchKeys: ["codigo", "nombre", "tipo", "fingerprint"],
  },
  materiales: {
    key: "materiales",
    group: "operativo",
    eyebrow: "Producto",
    title: "Materiales",
    description: "Materias primas y materiales productivos usados por trafila, corte y armado.",
    fields: [
      { key: "codigo", label: "Codigo", type: "text", required: true, unique: true },
      { key: "nombre", label: "Nombre", type: "text", required: true },
      {
        key: "tipo",
        label: "Tipo",
        type: "select",
        required: true,
        options: [
          { value: "compuesto", label: "Compuesto" },
          { value: "tela", label: "Tela" },
          { value: "banda", label: "Banda" },
          { value: "cartucho", label: "Cartucho" },
          { value: "materia_prima", label: "Materia prima" },
        ],
      },
      { key: "unidad_medida", label: "Unidad", type: "text", required: true },
    ],
    columns: [
      { key: "codigo", label: "Codigo", mono: true, className: "w-40" },
      { key: "nombre", label: "Nombre" },
      { key: "tipo", label: "Tipo", className: "w-36" },
      { key: "unidad_medida", label: "Unidad", className: "w-28" },
    ],
    searchKeys: ["codigo", "nombre", "tipo", "unidad_medida"],
  },
  modelos_producto: {
    key: "modelos_producto",
    group: "operativo",
    eyebrow: "Producto",
    title: "Modelos de producto",
    description:
      "Modelos de Banda, Tela Cortada, Cartucho y Neumatico que gobiernan compatibilidades.",
    fields: [
      { key: "codigo", label: "Codigo", type: "text", required: true, unique: true },
      { key: "nombre", label: "Nombre", type: "text", required: true },
      {
        key: "tipo_producto",
        label: "Tipo producto",
        type: "select",
        required: true,
        options: [
          { value: "neumatico", label: "Neumatico" },
          { value: "banda", label: "Banda" },
          { value: "tela_cortada", label: "Tela cortada" },
          { value: "cartucho", label: "Cartucho" },
        ],
      },
      { key: "version", label: "Version", type: "text", required: true },
    ],
    columns: [
      { key: "codigo", label: "Codigo", mono: true, className: "w-44" },
      { key: "nombre", label: "Nombre" },
      { key: "tipo_producto", label: "Tipo", className: "w-36" },
      { key: "version", label: "Version", className: "w-24" },
    ],
    searchKeys: ["codigo", "nombre", "tipo_producto", "version"],
  },
  cavidades: {
    key: "cavidades",
    group: "operativo",
    eyebrow: "Vulcanizado",
    title: "Cavidades",
    description: "Posiciones izquierda y derecha asociadas a cada prensa de vulcanizado.",
    fields: [
      {
        key: "maquina_id",
        label: "Maquina",
        type: "select",
        required: true,
        reference: { masterKey: "maquinas" },
      },
      {
        key: "codigo",
        label: "Codigo",
        type: "select",
        required: true,
        options: [
          { value: "izquierda", label: "Izquierda" },
          { value: "derecha", label: "Derecha" },
        ],
      },
      { key: "posicion", label: "Posicion", type: "number", nullable: true },
    ],
    columns: [
      { key: "maquina_id", label: "Maquina" },
      { key: "codigo", label: "Cavidad", className: "w-32" },
      { key: "posicion", label: "Posicion", className: "w-28 text-right" },
    ],
    searchKeys: ["codigo"],
  },
  moldes: {
    key: "moldes",
    group: "operativo",
    eyebrow: "Vulcanizado",
    title: "Moldes",
    description: "Matriceria usada en vulcanizado, asociada al modelo compatible principal.",
    fields: [
      { key: "codigo", label: "Codigo", type: "text", required: true, unique: true },
      {
        key: "modelo_id",
        label: "Modelo principal",
        type: "select",
        reference: { masterKey: "modelos_producto" },
        nullable: true,
      },
      { key: "descripcion", label: "Descripcion", type: "textarea", nullable: true },
    ],
    columns: [
      { key: "codigo", label: "Codigo", mono: true, className: "w-44" },
      { key: "modelo_id", label: "Modelo principal" },
      { key: "descripcion", label: "Descripcion" },
    ],
    searchKeys: ["codigo", "descripcion"],
  },
  modelo_etapa_materiales: {
    key: "modelo_etapa_materiales",
    group: "operativo",
    eyebrow: "Poka-Yoke",
    title: "Compatibilidades",
    description: "Materiales permitidos por modelo y etapa para bloquear consumos incompatibles.",
    fields: [
      {
        key: "modelo_id",
        label: "Modelo",
        type: "select",
        required: true,
        reference: { masterKey: "modelos_producto" },
      },
      {
        key: "etapa_id",
        label: "Etapa",
        type: "select",
        required: true,
        reference: { masterKey: "etapas_proceso" },
      },
      {
        key: "material_id",
        label: "Material",
        type: "select",
        required: true,
        reference: { masterKey: "materiales" },
      },
      { key: "obligatorio", label: "Obligatorio", type: "boolean", required: true },
      { key: "cantidad_teorica", label: "Cantidad teorica", type: "number", nullable: true },
      { key: "unidad_medida", label: "Unidad", type: "text", nullable: true },
    ],
    columns: [
      { key: "modelo_id", label: "Modelo" },
      { key: "etapa_id", label: "Etapa" },
      { key: "material_id", label: "Material" },
      { key: "obligatorio", label: "Obligatorio", className: "w-32" },
      { key: "cantidad_teorica", label: "Cantidad", className: "w-28 text-right" },
    ],
    searchKeys: ["unidad_medida"],
  },
  especificaciones_modelo: {
    key: "especificaciones_modelo",
    group: "operativo",
    eyebrow: "Calidad",
    title: "Especificaciones",
    description: "Tolerancias medibles por modelo, etapa y variable.",
    fields: [
      {
        key: "modelo_id",
        label: "Modelo",
        type: "select",
        required: true,
        reference: { masterKey: "modelos_producto" },
      },
      {
        key: "etapa_id",
        label: "Etapa",
        type: "select",
        reference: { masterKey: "etapas_proceso" },
        nullable: true,
      },
      { key: "variable", label: "Variable", type: "text", required: true },
      { key: "valor_objetivo", label: "Valor objetivo", type: "number", nullable: true },
      { key: "tolerancia_min", label: "Tolerancia minima", type: "number", nullable: true },
      { key: "tolerancia_max", label: "Tolerancia maxima", type: "number", nullable: true },
      { key: "unidad_medida", label: "Unidad", type: "text", required: true },
      { key: "version", label: "Version", type: "text", required: true },
      { key: "vigente_desde", label: "Vigente desde", type: "date", required: true },
      { key: "vigente_hasta", label: "Vigente hasta", type: "date", nullable: true },
    ],
    columns: [
      { key: "modelo_id", label: "Modelo" },
      { key: "etapa_id", label: "Etapa" },
      { key: "variable", label: "Variable", className: "w-36" },
      { key: "valor_objetivo", label: "Objetivo", className: "w-28 text-right" },
      { key: "tolerancia_min", label: "Min", className: "w-24 text-right" },
      { key: "tolerancia_max", label: "Max", className: "w-24 text-right" },
      { key: "unidad_medida", label: "Unidad", className: "w-24" },
    ],
    searchKeys: ["variable", "unidad_medida", "version"],
  },
  motivos_rechazo: {
    key: "motivos_rechazo",
    group: "operativo",
    eyebrow: "Calidad",
    title: "Motivos de rechazo",
    description: "Razones administrables para rechazar componentes o neumaticos.",
    fields: [
      { key: "codigo", label: "Codigo", type: "text", required: true, unique: true },
      { key: "descripcion", label: "Descripcion", type: "text", required: true },
      {
        key: "aplica_a",
        label: "Aplica a",
        type: "select",
        required: true,
        options: [
          { value: "componente", label: "Componente" },
          { value: "neumatico", label: "Neumatico" },
          { value: "ambos", label: "Ambos" },
        ],
      },
      {
        key: "requiere_observacion",
        label: "Requiere observacion",
        type: "boolean",
        required: true,
      },
    ],
    columns: [
      { key: "codigo", label: "Codigo", mono: true, className: "w-44" },
      { key: "descripcion", label: "Descripcion" },
      { key: "aplica_a", label: "Aplica a", className: "w-32" },
      { key: "requiere_observacion", label: "Obs.", className: "w-24" },
    ],
    searchKeys: ["codigo", "descripcion", "aplica_a"],
  },
  motivos_aceptacion: {
    key: "motivos_aceptacion",
    group: "operativo",
    eyebrow: "Control Final",
    title: "Motivos de aceptación",
    description: "Razones administrables para aprobar o liberar un neumático en Control Final.",
    fields: [
      { key: "codigo", label: "Codigo", type: "text", required: true, unique: true },
      { key: "descripcion", label: "Descripcion", type: "text", required: true },
      {
        key: "aplica_a",
        label: "Aplica a",
        type: "select",
        required: true,
        options: [
          { value: "neumatico", label: "Neumatico" },
          { value: "componente", label: "Componente" },
          { value: "ambos", label: "Ambos" },
        ],
      },
      {
        key: "requiere_observacion",
        label: "Requiere observacion",
        type: "boolean",
        required: true,
      },
    ],
    columns: [
      { key: "codigo", label: "Codigo", mono: true, className: "w-44" },
      { key: "descripcion", label: "Descripcion" },
      { key: "aplica_a", label: "Aplica a", className: "w-32" },
      { key: "requiere_observacion", label: "Obs.", className: "w-24" },
    ],
    searchKeys: ["codigo", "descripcion", "aplica_a"],
  },
  motivos_parada: {
    key: "motivos_parada",
    group: "operativo",
    eyebrow: "Planta",
    title: "Motivos de parada",
    description: "Causas normalizadas de parada de maquina.",
    fields: [
      { key: "codigo", label: "Codigo", type: "text", required: true, unique: true },
      { key: "descripcion", label: "Descripcion", type: "text", required: true },
      { key: "categoria", label: "Categoria", type: "text", nullable: true },
      { key: "planificada", label: "Planificada", type: "boolean", required: true },
    ],
    columns: [
      { key: "codigo", label: "Codigo", mono: true, className: "w-44" },
      { key: "descripcion", label: "Descripcion" },
      { key: "categoria", label: "Categoria", className: "w-36" },
      { key: "planificada", label: "Planificada", className: "w-28" },
    ],
    searchKeys: ["codigo", "descripcion", "categoria"],
  },
  proveedores: {
    key: "proveedores",
    group: "operativo",
    eyebrow: "Abastecimiento",
    title: "Proveedores",
    description: "Proveedores de materia prima, compuestos y telas.",
    fields: [
      { key: "codigo", label: "Codigo", type: "text", required: true, unique: true },
      { key: "nombre", label: "Nombre", type: "text", required: true },
    ],
    columns: [
      { key: "codigo", label: "Codigo", mono: true, className: "w-44" },
      { key: "nombre", label: "Nombre" },
    ],
    searchKeys: ["codigo", "nombre"],
  },
  configuraciones: {
    key: "configuraciones",
    group: "operativo",
    eyebrow: "Operacion",
    title: "Configuraciones",
    description: "Parametros operativos que pueden variar sin recompilar.",
    fields: [
      { key: "clave", label: "Clave", type: "text", required: true, unique: true },
      { key: "valor", label: "Valor", type: "textarea", required: true },
      {
        key: "ambito",
        label: "Ambito",
        type: "select",
        required: true,
        options: [
          { value: "global", label: "Global" },
          { value: "planta", label: "Planta" },
          { value: "edge", label: "Edge" },
          { value: "estacion", label: "Estacion" },
          { value: "dispositivo", label: "Dispositivo" },
        ],
      },
      { key: "ambito_id", label: "ID de ambito", type: "text", nullable: true },
      { key: "descripcion", label: "Descripcion", type: "textarea", nullable: true },
      { key: "requiere_reinicio", label: "Requiere reinicio", type: "boolean", required: true },
    ],
    columns: [
      { key: "clave", label: "Clave", mono: true },
      { key: "valor", label: "Valor", mono: true, className: "w-32" },
      { key: "ambito", label: "Ambito", className: "w-28" },
      { key: "requiere_reinicio", label: "Reinicio", className: "w-28" },
    ],
    searchKeys: ["clave", "valor", "ambito", "descripcion"],
  },
  operarios: {
    key: "operarios",
    group: "rrhh",
    eyebrow: "RRHH",
    title: "Operarios",
    description:
      "Personas que firman operaciones productivas; la rotacion entre estaciones queda permitida en Fase 1.",
    fields: [
      { key: "legajo", label: "Legajo", type: "text", required: true, unique: true },
      { key: "nombre", label: "Nombre", type: "text", required: true },
      { key: "nfc_uid", label: "NFC UID", type: "text", nullable: true, unique: true },
      { key: "sector", label: "Sector habitual", type: "text", nullable: true },
    ],
    columns: [
      { key: "legajo", label: "Legajo", mono: true, className: "w-28" },
      { key: "nombre", label: "Nombre" },
      { key: "nfc_uid", label: "NFC", mono: true, className: "w-44" },
      { key: "sector", label: "Sector", className: "w-36" },
    ],
    searchKeys: ["legajo", "nombre", "nfc_uid", "sector"],
  },
  turnos: {
    key: "turnos",
    group: "rrhh",
    eyebrow: "RRHH",
    title: "Turnos",
    description: "Bloques operativos para agrupar produccion y autocompletar contexto.",
    fields: [
      { key: "codigo", label: "Codigo", type: "text", required: true, unique: true },
      { key: "nombre", label: "Nombre", type: "text", required: true },
      { key: "hora_inicio", label: "Hora inicio", type: "time", nullable: true },
      { key: "hora_fin", label: "Hora fin", type: "time", nullable: true },
    ],
    columns: [
      { key: "codigo", label: "Codigo", mono: true, className: "w-28" },
      { key: "nombre", label: "Nombre" },
      { key: "hora_inicio", label: "Inicio", mono: true, className: "w-28" },
      { key: "hora_fin", label: "Fin", mono: true, className: "w-28" },
    ],
    searchKeys: ["codigo", "nombre", "hora_inicio", "hora_fin"],
  },
};

export const masterNavGroups = [
  {
    label: "Maestros operativos",
    keys: [
      "etapas_proceso",
      "estaciones",
      "maquinas",
      "dispositivos",
      "materiales",
      "modelos_producto",
      "cavidades",
      "moldes",
      "modelo_etapa_materiales",
      "especificaciones_modelo",
      "motivos_rechazo",
      "motivos_aceptacion",
      "motivos_parada",
      "proveedores",
      "configuraciones",
    ] as MasterKey[],
  },
  {
    label: "RRHH",
    keys: ["operarios", "turnos"] as MasterKey[],
  },
];

export type StationKey =
  "trafila-grande" | "corte-tela" | "armado" | "vulcanizado" | "control-final";

export type StationOperation = {
  id: string;
  codigo: string;
  resultado: string;
  maquina: string;
  operario: string;
  turno: string;
  timestamp: string;
  detalles: Record<string, string>;
};

export type StationConfig = {
  key: StationKey;
  title: string;
  etapaCodigo: string;
  description: string;
  output: string;
  requiredContext: string[];
  operations: StationOperation[];
};

export const stationConfigs: Record<StationKey, StationConfig> = {
  "trafila-grande": {
    key: "trafila-grande",
    title: "Trafila Grande",
    etapaCodigo: "trafila_grande",
    description: "Registro de Banda desde materia prima, lote, palet y batch.",
    output: "Banda",
    requiredContext: [
      "Materia prima compatible",
      "Lote proveedor",
      "Palet",
      "Batch",
      "Operario",
      "Turno",
      "Maquina",
    ],
    operations: [
      {
        id: "op-trafila-01",
        codigo: "BND-20260706-001",
        resultado: "BANDA · disponible",
        maquina: "TRAF-GDE-01",
        operario: "Julian Ferrari",
        turno: "A",
        timestamp: "2026-07-06 08:15:12",
        detalles: {
          material: "CMP-SLICK-A",
          lote: "LOT-CMP-2607-A",
          palet: "PAL-1188",
          batch: "BTH-TRAF-443",
          mediciones: "ancho 182.4 mm · lomo centro 6.3 mm",
        },
      },
    ],
  },
  "corte-tela": {
    key: "corte-tela",
    title: "Corte de Tela",
    etapaCodigo: "corte_tela",
    description: "Registro de Tela Cortada desde rollo o materia prima propia de corte.",
    output: "Tela Cortada",
    requiredContext: [
      "Rollo de tela",
      "Proveedor",
      "Batch",
      "Operario",
      "Turno",
      "Maquina",
      "Mediciones de corte",
    ],
    operations: [
      {
        id: "op-corte-01",
        codigo: "TEL-20260706-014",
        resultado: "TELA_CORTADA · disponible",
        maquina: "COR-TELA-01",
        operario: "Andres Palacio",
        turno: "A",
        timestamp: "2026-07-06 09:02:44",
        detalles: {
          material: "TEL-NYL-120",
          proveedor: "Textiles Racing",
          rollo: "ROL-NYL-8842",
          batch: "BTH-COR-219",
          mediciones: "angulo 45.1 grados · ancho 181.9 mm",
        },
      },
    ],
  },
  armado: {
    key: "armado",
    title: "Armado",
    etapaCodigo: "armado",
    description: "Armado de Cartucho a partir de Banda y Tela Cortada compatibles.",
    output: "Cartucho",
    requiredContext: [
      "Banda disponible",
      "Tela Cortada disponible",
      "Modelo compatible",
      "Operario",
      "Turno",
      "Puesto",
    ],
    operations: [
      {
        id: "op-armado-01",
        codigo: "CART-20260706-008",
        resultado: "CARTUCHO · pendiente_vulcanizado",
        maquina: "ARM-01",
        operario: "Lucia Romero",
        turno: "A",
        timestamp: "2026-07-06 11:22:03",
        detalles: {
          banda: "BND-20260706-001",
          tela: "TEL-20260706-014",
          modelo: "CART-SLICK-13",
          observaciones: "Armado OK. Sin componentes adicionales en Fase 1.",
        },
      },
    ],
  },
  vulcanizado: {
    key: "vulcanizado",
    title: "Vulcanizado",
    etapaCodigo: "vulcanizado",
    description:
      "Registro de maquina de vulcanizado, cavidad, molde, modelo/neumatico e ID Quemado.",
    output: "Neumatico vulcanizado",
    requiredContext: [
      "Cartucho armado",
      "Prensa",
      "Cavidad",
      "Molde",
      "ID Quemado",
      "Operario",
      "Turno",
    ],
    operations: [
      {
        id: "op-vulc-01",
        codigo: "NEU-20260706-002",
        resultado: "NEUMATICO · pendiente_control_final",
        maquina: "PRENSA-04",
        operario: "Maria Gonzalez",
        turno: "A",
        timestamp: "2026-07-06 13:50:10",
        detalles: {
          cartucho: "CART-20260706-008",
          cavidad: "derecha",
          molde: "MLD-SLICK-13-A",
          id_quemado: "IQ-260706-02",
        },
      },
    ],
  },
  "control-final": {
    key: "control-final",
    title: "Control Final",
    etapaCodigo: "control_final",
    description:
      "Aprobacion o rechazo final del neumatico, con motivo y observaciones si corresponde.",
    output: "Neumatico aprobado/rechazado",
    requiredContext: [
      "Neumatico vulcanizado",
      "Inspector",
      "Resultado",
      "Motivo de rechazo si aplica",
    ],
    operations: [
      {
        id: "op-control-01",
        codigo: "NEU-20260706-002",
        resultado: "APROBADO",
        maquina: "CTRL-FINAL-01",
        operario: "Andres Palacio",
        turno: "A",
        timestamp: "2026-07-06 15:05:32",
        detalles: {
          id_quemado: "IQ-260706-02",
          motivo_rechazo: "No aplica",
          observaciones: "Inspeccion visual OK. Listo para partida de nacimiento.",
        },
      },
    ],
  },
};

export const stationOrder: StationKey[] = [
  "trafila-grande",
  "corte-tela",
  "armado",
  "vulcanizado",
  "control-final",
];

export type StationEvent = {
  estacion: string;
  operario: string;
  maquina: string;
  turno: string;
  timestamp: string;
  loteInsumo?: string;
  batch?: string;
  palet?: string;
  cavidad?: string;
  molde?: string;
  idQuemado?: string;
  resultado?: string;
  notas?: string;
};

export type DependencyNode = {
  codigo: string;
  tipo: string;
  descripcion: string;
  evento: StationEvent;
  hijos?: DependencyNode[];
};

export const TRACE_EXAMPLE = "NEU-20260706-002";

const bandaNode: DependencyNode = {
  codigo: "BND-20260706-001",
  tipo: "Banda",
  descripcion: "Banda slick 13 generada desde compuesto CMP-SLICK-A",
  evento: {
    estacion: "Trafila Grande",
    operario: "Julian Ferrari",
    maquina: "TRAF-GDE-01",
    turno: "A",
    timestamp: "2026-07-06 08:15:12",
    loteInsumo: "LOT-CMP-2607-A",
    batch: "BTH-TRAF-443",
    palet: "PAL-1188",
    notas: "Mediciones OK: ancho 182.4 mm, lomo centro 6.3 mm.",
  },
};

const telaNode: DependencyNode = {
  codigo: "TEL-20260706-014",
  tipo: "Tela Cortada",
  descripcion: "Tela cortada slick 13 desde rollo ROL-NYL-8842",
  evento: {
    estacion: "Corte de Tela",
    operario: "Andres Palacio",
    maquina: "COR-TELA-01",
    turno: "A",
    timestamp: "2026-07-06 09:02:44",
    loteInsumo: "ROL-NYL-8842",
    batch: "BTH-COR-219",
    notas: "Corte OK: angulo 45.1 grados, ancho 181.9 mm.",
  },
};

const cartuchoNode: DependencyNode = {
  codigo: "CART-20260706-008",
  tipo: "Cartucho",
  descripcion: "Armado a partir de Banda + Tela Cortada compatibles",
  evento: {
    estacion: "Armado",
    operario: "Lucia Romero",
    maquina: "ARM-01",
    turno: "A",
    timestamp: "2026-07-06 11:22:03",
    resultado: "pendiente_vulcanizado",
    notas: "Armado Fase 1 con Banda + Tela Cortada como entradas activas.",
  },
  hijos: [bandaNode, telaNode],
};

const vulcanizadoNode: DependencyNode = {
  codigo: "VULC-20260706-004",
  tipo: "Vulcanizado",
  descripcion: "Ciclo de vulcanizado para NEU-20260706-002",
  evento: {
    estacion: "Vulcanizado",
    operario: "Maria Gonzalez",
    maquina: "PRENSA-04",
    turno: "A",
    timestamp: "2026-07-06 13:50:10",
    cavidad: "derecha",
    molde: "MLD-SLICK-13-A",
    idQuemado: "IQ-260706-02",
    resultado: "pendiente_control_final",
  },
  hijos: [cartuchoNode],
};

const neumaticoNode: DependencyNode = {
  codigo: TRACE_EXAMPLE,
  tipo: "Neumatico",
  descripcion: "Neumatico competicion slick 13 aprobado",
  evento: {
    estacion: "Control Final",
    operario: "Andres Palacio",
    maquina: "CTRL-FINAL-01",
    turno: "A",
    timestamp: "2026-07-06 15:05:32",
    idQuemado: "IQ-260706-02",
    resultado: "APROBADO",
    notas: "Control visual OK. Identificador valido para partida de nacimiento.",
  },
  hijos: [vulcanizadoNode],
};

export const dependencyDB: Record<string, DependencyNode> = {
  [TRACE_EXAMPLE]: neumaticoNode,
  "IQ-260706-02": neumaticoNode,
  "VULC-20260706-004": vulcanizadoNode,
  "CART-20260706-008": cartuchoNode,
  "BND-20260706-001": bandaNode,
  "TEL-20260706-014": telaNode,
};

export function optionLabel(
  record: MasterRecord,
  labelKeys = ["codigo", "nombre", "descripcion", "clave", "legajo"],
) {
  const parts = labelKeys
    .map((key) => record[key])
    .filter(
      (value): value is string | number | boolean =>
        value !== null && value !== undefined && value !== "",
    );
  return parts.join(" · ") || record.id;
}

export { yesNoOptions };
