import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { CatalogInput } from "@/lib/types";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, COUNT(a.id)::int AS aircraft_count
       FROM core.categories c
       LEFT JOIN core.aircraft a ON a.category_id = c.id
       GROUP BY c.id, c.name
       ORDER BY c.name`,
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
      "INSERT INTO core.categories (name) VALUES ($1) RETURNING *",
      [name],
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
