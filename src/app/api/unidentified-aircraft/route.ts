import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { UnidentifiedAircraftInput } from "@/lib/types";

const SORT_COLUMNS = {
  id: "id",
  icao: "icao",
  callsign: "callsign",
  type: "type",
  airframe: "airframe",
  note: "note",
  first_seen: "first_seen",
} as const;

const FILTER_COLUMNS = {
  icao: "icao",
  callsign: "callsign",
  type: "type",
  airframe: "airframe",
  note: "note",
  first_seen: "TO_CHAR(first_seen, 'YYYY-MM-DD HH24:MI:SS')",
} as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const offset = (page - 1) * limit;
  const requestedSortBy = searchParams.get("sortBy") ?? "first_seen";
  const sortBy = requestedSortBy in SORT_COLUMNS ? requestedSortBy as keyof typeof SORT_COLUMNS : "first_seen";
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
        `(icao ILIKE $${idx} OR callsign ILIKE $${idx} OR type ILIKE $${idx} OR airframe ILIKE $${idx} OR note ILIKE $${idx} OR TO_CHAR(first_seen, 'YYYY-MM-DD HH24:MI:SS') ILIKE $${idx})`
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
      `SELECT COUNT(*) FROM core.unidentified_aircraft ${whereClause}`,
      countParams,
    );

    const result = await pool.query(
      `SELECT * FROM core.unidentified_aircraft ${whereClause} ORDER BY ${SORT_COLUMNS[sortBy]} ${sortDir} NULLS LAST LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params,
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

export async function POST(request: Request) {
  try {
    const body: UnidentifiedAircraftInput = await request.json();
    const { icao, callsign, airframe, type, note, first_seen } = body;

    const result = await pool.query(
      `INSERT INTO core.unidentified_aircraft (icao, callsign, airframe, type, note, first_seen)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        icao?.trim() || null,
        callsign?.trim() || null,
        airframe?.trim() || null,
        type?.trim() || null,
        note?.trim() || null,
        first_seen || null,
      ],
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
