import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

const SORT_COLUMNS = {
  id: "id",
  icao: "icao",
  reg: "reg",
  type: "type",
  airframe: "airframe",
  serial: "serial",
  operator_name: "operator_name",
  category_name: "category_name",
  note: "note",
  created_at: "created_at",
} as const;

const FILTER_COLUMNS = {
  icao: "icao",
  reg: "reg",
  type: "type",
  airframe: "airframe",
  serial: "serial",
  operator_name: "operator_name",
  category_name: "category_name",
  note: "note",
  created_at: "TO_CHAR(created_at, 'YYYY-MM-DD')",
} as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const offset = (page - 1) * limit;
  const requestedSortBy = searchParams.get("sortBy") ?? "id";
  const sortBy = requestedSortBy in SORT_COLUMNS ? requestedSortBy as keyof typeof SORT_COLUMNS : "id";
  const sortDir = searchParams.get("sortDir") === "asc" ? "ASC" : "DESC";

  try {
    const whereParts: string[] = [];
    const params: Array<string | number> = [];

    const addLikeFilter = (column: string, value: string) => {
      if (!value.trim()) return;
      params.push(`%${value.trim()}%`);
      whereParts.push(`${column} ILIKE $${params.length}`);
    };

    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      const idx = params.length;
      whereParts.push(
        `(icao ILIKE $${idx} OR reg ILIKE $${idx} OR type ILIKE $${idx} OR airframe ILIKE $${idx} OR serial ILIKE $${idx} OR operator_name ILIKE $${idx} OR category_name ILIKE $${idx} OR note ILIKE $${idx} OR TO_CHAR(created_at, 'YYYY-MM-DD') ILIKE $${idx})`
      );
    }

    for (const [key, column] of Object.entries(FILTER_COLUMNS)) {
      addLikeFilter(column, searchParams.get(key) ?? "");
    }

    const whereClause = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
    const countParams = [...params];
    const limitParam = params.push(limit);
    const offsetParam = params.push(offset);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM core.aircraft_view ${whereClause}`,
      countParams
    );
    const result = await pool.query(
      `SELECT * FROM core.aircraft_view ${whereClause} ORDER BY ${SORT_COLUMNS[sortBy]} ${sortDir} NULLS LAST LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params
    );

    return NextResponse.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
      sortBy,
      sortDir: sortDir.toLowerCase(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
