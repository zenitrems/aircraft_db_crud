import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

function parseIds(raw: string | null): number[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map(value => Number(value.trim()))
    .filter(value => Number.isInteger(value) && value > 0);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryIds = parseIds(searchParams.get("category_id"));
  const operatorIds = parseIds(searchParams.get("operator_id"));

  if (categoryIds.length === 0 && operatorIds.length === 0) {
    return NextResponse.json({ icaos: [] });
  }

  try {
    const orParts: string[] = [];
    const params: number[][] = [];

    if (categoryIds.length) {
      params.push(categoryIds);
      orParts.push(`category_id = ANY($${params.length}::int[])`);
    }
    if (operatorIds.length) {
      params.push(operatorIds);
      orParts.push(`operator_id = ANY($${params.length}::int[])`);
    }

    const result = await pool.query(
      `SELECT DISTINCT TRIM(icao) AS icao
       FROM core.aircraft_view
       WHERE NULLIF(TRIM(icao), '') IS NOT NULL
         AND UPPER(TRIM(icao)) <> 'TBD'
         AND (${orParts.join(" OR ")})
       ORDER BY icao`,
      params,
    );

    return NextResponse.json({ icaos: result.rows.map(row => row.icao) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
