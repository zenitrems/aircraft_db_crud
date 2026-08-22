import { pool } from "@/lib/db";

/**
 * Analytics for the aircraft registry.
 *
 * The registry is a curated catalog, not a telemetry feed, so the questions
 * worth answering are about *coverage* and *composition*: how much of the fleet
 * is actually trackable on ADS-B, where the records are thin, how concentrated
 * the fleet is by operator / category / airframe, and what still needs work.
 *
 * `icao` is a fixed-width `character` column, so every read TRIMs it.
 */

/** A 6-digit hex address is the only form ADS-B can be followed with. */
const VALID_HEX = `TRIM(a.icao) ~* '^[0-9a-f]{6}$'`;
const IS_BLANK = (col: string) => `(${col} IS NULL OR TRIM(${col}) = '')`;

export type Kpis = {
  total: number;
  trackable: number;
  pending_icao: number;
  operators: number;
  categories: number;
  airframes: number;
  added_30d: number;
  added_prev_30d: number;
  unknown_open: number;
  incomplete: number;
};

export type FieldCoverage = {
  field: string;
  label: string;
  filled: number;
  total: number;
};

export type OperatorRow = {
  name: string;
  total: number;
  trackable: number;
  airframes: number;
  last_added: string | null;
};

export type NamedCount = { name: string; total: number };

export type AirframeRow = NamedCount & { operators: number };

export type MatrixCell = { operator: string; category: string; total: number };

export type MonthPoint = { month: string; total: number };

export type AttentionRow = {
  id: number;
  icao: string;
  reg: string;
  airframe: string;
  operator: string | null;
  reasons: string[];
};

export type UnknownStats = {
  total: number;
  with_hex: number;
  oldest: string | null;
  newest: string | null;
  colliding: number;
};

export type FleetStats = {
  kpis: Kpis;
  coverage: FieldCoverage[];
  operators: OperatorRow[];
  categories: NamedCount[];
  airframes: AirframeRow[];
  airframeShape: { distinct: number; singletons: number; top5: number; classified: number };
  matrix: { operators: string[]; categories: string[]; cells: MatrixCell[] };
  months: MonthPoint[];
  registries: NamedCount[];
  blocks: NamedCount[];
  attention: AttentionRow[];
  duplicates: { reg: NamedCount[]; serial: NamedCount[] };
  unknown: UnknownStats;
};

/**
 * ICAO 24-bit address blocks. Only ranges we can state with confidence are
 * named; anything else falls through to "Sin catalogar" rather than being
 * guessed at or called invalid.
 */
const ICAO_BLOCKS: Array<{ from: number; to: number; name: string }> = [
  { from: 0x0d0000, to: 0x0d7fff, name: "Mexico" },
  { from: 0xa00000, to: 0xafffff, name: "Estados Unidos" },
  { from: 0xc00000, to: 0xc3ffff, name: "Canada" },
  { from: 0xe00000, to: 0xe3ffff, name: "Argentina" },
  { from: 0xe40000, to: 0xe7ffff, name: "Brasil" },
  { from: 0xe80000, to: 0xe80fff, name: "Chile" },
  { from: 0xe84000, to: 0xe84fff, name: "Colombia" },
  { from: 0x340000, to: 0x37ffff, name: "Espana" },
  { from: 0x380000, to: 0x3bffff, name: "Francia" },
  { from: 0x3c0000, to: 0x3fffff, name: "Alemania" },
  { from: 0x400000, to: 0x43ffff, name: "Reino Unido" },
  { from: 0x300000, to: 0x33ffff, name: "Italia" },
  { from: 0x440000, to: 0x447fff, name: "Austria" },
  { from: 0x448000, to: 0x44ffff, name: "Belgica" },
  { from: 0x480000, to: 0x487fff, name: "Paises Bajos" },
  { from: 0x4b0000, to: 0x4b7fff, name: "Suiza" },
  { from: 0x738000, to: 0x73ffff, name: "Israel" },
  { from: 0x140000, to: 0x1fffff, name: "Rusia" },
  { from: 0x780000, to: 0x7bffff, name: "China" },
  { from: 0x7c0000, to: 0x7fffff, name: "Australia" },
];

function blockName(hex: string) {
  const value = parseInt(hex, 16);
  if (Number.isNaN(value)) return "Sin catalogar";
  return ICAO_BLOCKS.find(block => value >= block.from && value <= block.to)?.name ?? "Sin catalogar";
}

export async function getFleetStats(): Promise<FleetStats> {
  const [
    kpiResult,
    coverageResult,
    operatorResult,
    categoryResult,
    airframeResult,
    shapeResult,
    matrixResult,
    monthResult,
    registryResult,
    hexResult,
    attentionResult,
    dupRegResult,
    dupSerialResult,
    unknownResult,
  ] = await Promise.all([
    pool.query<Kpis>(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE ${VALID_HEX})::int AS trackable,
         COUNT(*) FILTER (WHERE NOT (${VALID_HEX}))::int AS pending_icao,
         (SELECT COUNT(*)::int FROM core.operators) AS operators,
         (SELECT COUNT(*)::int FROM core.categories) AS categories,
         COUNT(DISTINCT LOWER(TRIM(a.airframe))) FILTER (WHERE NOT ${IS_BLANK("a.airframe")})::int AS airframes,
         COUNT(*) FILTER (WHERE a.created_at >= NOW() - INTERVAL '30 days')::int AS added_30d,
         COUNT(*) FILTER (WHERE a.created_at >= NOW() - INTERVAL '60 days'
                            AND a.created_at <  NOW() - INTERVAL '30 days')::int AS added_prev_30d,
         (SELECT COUNT(*)::int FROM core.unidentified_aircraft) AS unknown_open,
         COUNT(*) FILTER (
           WHERE NOT (${VALID_HEX})
              OR ${IS_BLANK("a.airframe")}
              OR a.category_id IS NULL
              OR a.operator_id IS NULL
         )::int AS incomplete
       FROM core.aircraft a`,
    ),
    pool.query<{ total: number } & Record<string, number>>(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE ${VALID_HEX})::int AS icao,
         COUNT(*) FILTER (WHERE NOT ${IS_BLANK("a.reg")})::int AS reg,
         COUNT(*) FILTER (WHERE NOT ${IS_BLANK("a.airframe")})::int AS airframe,
         COUNT(*) FILTER (WHERE NOT ${IS_BLANK("a.serial")})::int AS serial,
         COUNT(*) FILTER (WHERE a.operator_id IS NOT NULL)::int AS operator,
         COUNT(*) FILTER (WHERE a.category_id IS NOT NULL)::int AS category,
         COUNT(*) FILTER (WHERE NOT ${IS_BLANK("a.note")})::int AS note
       FROM core.aircraft a`,
    ),
    pool.query<OperatorRow>(
      `SELECT
         COALESCE(o.name, 'Sin operador') AS name,
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE ${VALID_HEX})::int AS trackable,
         COUNT(DISTINCT LOWER(TRIM(a.airframe))) FILTER (WHERE NOT ${IS_BLANK("a.airframe")})::int AS airframes,
         MAX(a.created_at)::text AS last_added
       FROM core.aircraft a
       LEFT JOIN core.operators o ON o.id = a.operator_id
       GROUP BY 1
       ORDER BY total DESC, name ASC`,
    ),
    pool.query<NamedCount>(
      `SELECT COALESCE(c.name, 'Sin categoria') AS name, COUNT(*)::int AS total
       FROM core.aircraft a
       LEFT JOIN core.categories c ON c.id = a.category_id
       GROUP BY 1
       ORDER BY total DESC, name ASC`,
    ),
    pool.query<AirframeRow>(
      `SELECT
         TRIM(a.airframe) AS name,
         COUNT(*)::int AS total,
         COUNT(DISTINCT a.operator_id)::int AS operators
       FROM core.aircraft a
       WHERE NOT ${IS_BLANK("a.airframe")}
       GROUP BY 1
       ORDER BY total DESC, name ASC
       LIMIT 10`,
    ),
    pool.query<{ distinct: number; singletons: number; top5: number; classified: number }>(
      `WITH grouped AS (
         SELECT LOWER(TRIM(a.airframe)) AS af, COUNT(*)::int AS n
         FROM core.aircraft a
         WHERE NOT ${IS_BLANK("a.airframe")}
         GROUP BY 1
       )
       SELECT
         COUNT(*)::int AS "distinct",
         COUNT(*) FILTER (WHERE n = 1)::int AS singletons,
         COALESCE((SELECT SUM(n)::int FROM (SELECT n FROM grouped ORDER BY n DESC LIMIT 5) t), 0) AS top5,
         COALESCE(SUM(n)::int, 0) AS classified
       FROM grouped`,
    ),
    pool.query<MatrixCell>(
      `SELECT
         COALESCE(o.name, 'Sin operador') AS operator,
         COALESCE(c.name, 'Sin categoria') AS category,
         COUNT(*)::int AS total
       FROM core.aircraft a
       LEFT JOIN core.operators o ON o.id = a.operator_id
       LEFT JOIN core.categories c ON c.id = a.category_id
       GROUP BY 1, 2`,
    ),
    pool.query<MonthPoint>(
      `SELECT TO_CHAR(DATE_TRUNC('month', a.created_at), 'YYYY-MM') AS month, COUNT(*)::int AS total
       FROM core.aircraft a
       WHERE a.created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'
       GROUP BY 1
       ORDER BY 1`,
    ),
    pool.query<NamedCount>(
      `SELECT
         CASE
           WHEN ${IS_BLANK("a.reg")} THEN 'Sin matricula'
           WHEN UPPER(TRIM(a.reg)) = 'TBD' THEN 'Pendiente'
           WHEN TRIM(a.reg) ~ '^[0-9]+$' THEN 'Serie militar'
           WHEN UPPER(TRIM(a.reg)) LIKE 'XC-%' THEN 'XC - Estado MX'
           WHEN UPPER(TRIM(a.reg)) LIKE 'XA-%' THEN 'XA - Comercial MX'
           WHEN UPPER(TRIM(a.reg)) LIKE 'XB-%' THEN 'XB - Privada MX'
           WHEN UPPER(TRIM(a.reg)) LIKE 'N%' THEN 'N - Estados Unidos'
           ELSE 'Otra'
         END AS name,
         COUNT(*)::int AS total
       FROM core.aircraft a
       GROUP BY 1
       ORDER BY total DESC`,
    ),
    pool.query<{ hex: string; total: number }>(
      `SELECT UPPER(TRIM(a.icao)) AS hex, COUNT(*)::int AS total
       FROM core.aircraft a
       WHERE ${VALID_HEX}
       GROUP BY 1`,
    ),
    pool.query<Omit<AttentionRow, "reasons"> & Record<string, unknown>>(
      `SELECT
         a.id,
         TRIM(a.icao) AS icao,
         COALESCE(TRIM(a.reg), '') AS reg,
         COALESCE(TRIM(a.airframe), '') AS airframe,
         o.name AS operator,
         NOT (${VALID_HEX}) AS bad_icao,
         ${IS_BLANK("a.airframe")} AS no_airframe,
         (a.category_id IS NULL) AS no_category,
         (a.operator_id IS NULL) AS no_operator,
         ${IS_BLANK("a.serial")} AS no_serial
       FROM core.aircraft a
       LEFT JOIN core.operators o ON o.id = a.operator_id
       WHERE NOT (${VALID_HEX})
          OR ${IS_BLANK("a.airframe")}
          OR a.category_id IS NULL
          OR a.operator_id IS NULL
       ORDER BY
         (CASE WHEN NOT (${VALID_HEX}) THEN 1 ELSE 0 END
          + CASE WHEN ${IS_BLANK("a.airframe")} THEN 1 ELSE 0 END
          + CASE WHEN a.category_id IS NULL THEN 1 ELSE 0 END
          + CASE WHEN a.operator_id IS NULL THEN 1 ELSE 0 END) DESC,
         a.created_at DESC
       LIMIT 10`,
    ),
    pool.query<NamedCount>(
      `SELECT UPPER(TRIM(a.reg)) AS name, COUNT(*)::int AS total
       FROM core.aircraft a
       WHERE NOT ${IS_BLANK("a.reg")} AND UPPER(TRIM(a.reg)) <> 'TBD'
       GROUP BY 1 HAVING COUNT(*) > 1
       ORDER BY total DESC, name ASC
       LIMIT 8`,
    ),
    pool.query<NamedCount>(
      `SELECT UPPER(TRIM(a.serial)) AS name, COUNT(*)::int AS total
       FROM core.aircraft a
       WHERE NOT ${IS_BLANK("a.serial")} AND UPPER(TRIM(a.serial)) <> 'TBD'
       GROUP BY 1 HAVING COUNT(*) > 1
       ORDER BY total DESC, name ASC
       LIMIT 8`,
    ),
    pool.query<UnknownStats>(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE TRIM(u.icao) ~* '^[0-9a-f]{6}$')::int AS with_hex,
         MIN(u.first_seen)::text AS oldest,
         MAX(u.first_seen)::text AS newest,
         COUNT(*) FILTER (
           WHERE EXISTS (
             SELECT 1 FROM core.aircraft a
             WHERE UPPER(TRIM(a.icao)) = UPPER(TRIM(u.icao))
           )
         )::int AS colliding
       FROM core.unidentified_aircraft u`,
    ),
  ]);

  const coverageRow = coverageResult.rows[0];
  const coverageTotal = coverageRow?.total ?? 0;
  const COVERAGE_FIELDS: Array<{ field: string; label: string }> = [
    { field: "icao", label: "ICAO hex valido" },
    { field: "reg", label: "Matricula" },
    { field: "airframe", label: "Airframe" },
    { field: "operator", label: "Operador" },
    { field: "category", label: "Categoria" },
    { field: "serial", label: "Serial" },
    { field: "note", label: "Nota" },
  ];

  // Roll the per-address hex counts up into named allocation blocks.
  const blockTotals = new Map<string, number>();
  for (const row of hexResult.rows) {
    const name = blockName(row.hex);
    blockTotals.set(name, (blockTotals.get(name) ?? 0) + row.total);
  }

  const matrixCells = matrixResult.rows;
  const operatorOrder = operatorResult.rows.map(row => row.name);
  const categoryOrder = categoryResult.rows.map(row => row.name);

  const ATTENTION_REASONS: Array<{ flag: string; label: string }> = [
    { flag: "bad_icao", label: "ICAO" },
    { flag: "no_airframe", label: "Airframe" },
    { flag: "no_category", label: "Categoria" },
    { flag: "no_operator", label: "Operador" },
    { flag: "no_serial", label: "Serial" },
  ];

  return {
    kpis: kpiResult.rows[0],
    coverage: COVERAGE_FIELDS.map(({ field, label }) => ({
      field,
      label,
      filled: Number(coverageRow?.[field] ?? 0),
      total: coverageTotal,
    })),
    operators: operatorResult.rows,
    categories: categoryResult.rows,
    airframes: airframeResult.rows,
    airframeShape: shapeResult.rows[0] ?? { distinct: 0, singletons: 0, top5: 0, classified: 0 },
    matrix: {
      operators: operatorOrder,
      categories: categoryOrder,
      cells: matrixCells,
    },
    months: monthResult.rows,
    registries: registryResult.rows,
    blocks: [...blockTotals.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)),
    attention: attentionResult.rows.map(row => ({
      id: row.id,
      icao: row.icao,
      reg: row.reg,
      airframe: row.airframe,
      operator: row.operator,
      reasons: ATTENTION_REASONS.filter(({ flag }) => row[flag] === true).map(({ label }) => label),
    })),
    duplicates: { reg: dupRegResult.rows, serial: dupSerialResult.rows },
    unknown: unknownResult.rows[0],
  };
}

/** Compact summary for the dashboard header — one cheap round trip. */
export type DashboardSummary = {
  total: number;
  trackable: number;
  pending_icao: number;
  added_30d: number;
  unknown_open: number;
  operators: number;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const result = await pool.query<DashboardSummary>(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE ${VALID_HEX})::int AS trackable,
       COUNT(*) FILTER (WHERE NOT (${VALID_HEX}))::int AS pending_icao,
       COUNT(*) FILTER (WHERE a.created_at >= NOW() - INTERVAL '30 days')::int AS added_30d,
       (SELECT COUNT(*)::int FROM core.unidentified_aircraft) AS unknown_open,
       (SELECT COUNT(*)::int FROM core.operators) AS operators
     FROM core.aircraft a`,
  );

  return result.rows[0];
}
