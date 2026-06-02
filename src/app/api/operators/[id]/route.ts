import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { CatalogInput } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

function isForeignKeyError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23503";
}

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const result = await pool.query("SELECT * FROM core.operators WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const aircraftResult = await pool.query(
      `SELECT DISTINCT TRIM(icao) AS icao
       FROM core.aircraft
       WHERE operator_id = $1 AND NULLIF(TRIM(icao), '') IS NOT NULL
       ORDER BY icao`,
      [id],
    );

    return NextResponse.json({
      ...result.rows[0],
      icaos: aircraftResult.rows.map(row => row.icao),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body: CatalogInput = await request.json();
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const result = await pool.query(
      "UPDATE core.operators SET name = $1 WHERE id = $2 RETURNING *",
      [name, id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const result = await pool.query("DELETE FROM core.operators WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    if (isForeignKeyError(error)) {
      return NextResponse.json({ error: "Operator is used by aircraft records" }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
