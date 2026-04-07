import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const whereClause = search
      ? `WHERE icao ILIKE $1 OR reg ILIKE $1 OR type ILIKE $1 OR operator_name ILIKE $1 OR category_name ILIKE $1`
      : "";
    const params = search ? [`%${search}%`, limit, offset] : [limit, offset];
    const countParams = search ? [`%${search}%`] : [];

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM core.aircraft_view ${whereClause}`,
      countParams
    );
    const result = await pool.query(
      `SELECT * FROM core.aircraft_view ${whereClause} ORDER BY id DESC LIMIT $${search ? 2 : 1} OFFSET $${search ? 3 : 2}`,
      params
    );

    return NextResponse.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
