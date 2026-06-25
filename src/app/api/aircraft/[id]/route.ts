import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { AircraftInput } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };
const AIRCRAFT_COLUMNS = "id, icao, reg, serial, airframe, operator_id, category_id, note, created_at";

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const result = await pool.query(`SELECT ${AIRCRAFT_COLUMNS} FROM core.aircraft WHERE id = $1`, [id]);
    if (result.rows.length === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body: AircraftInput = await request.json();
    const { icao, reg, serial, airframe, operator_id, category_id, note } = body;

    const result = await pool.query(
      `UPDATE core.aircraft SET icao=$1, reg=$2, serial=$3, airframe=$4,
       operator_id=$5, category_id=$6, note=$7 WHERE id=$8 RETURNING ${AIRCRAFT_COLUMNS}`,
      [icao, reg, serial, airframe, operator_id ?? null, category_id ?? null, note ?? null, id]
    );
    if (result.rows.length === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const result = await pool.query("DELETE FROM core.aircraft WHERE id=$1 RETURNING id", [id]);
    if (result.rows.length === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
