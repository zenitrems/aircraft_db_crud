import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { CatalogInput } from "@/lib/types";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT o.id, o.name, COUNT(a.id)::int AS aircraft_count
       FROM core.operators o
       LEFT JOIN core.aircraft a ON a.operator_id = o.id
       GROUP BY o.id, o.name
       ORDER BY o.name`,
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: CatalogInput = await request.json();
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const result = await pool.query(
      "INSERT INTO core.operators (name) VALUES ($1) RETURNING *",
      [name],
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
