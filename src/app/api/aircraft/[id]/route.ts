import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { AircraftInput } from "@/lib/types";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const result = await pool.query("SELECT * FROM core.aircraft WHERE id = $1", [params.id]);
    if (result.rows.length === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body: AircraftInput = await request.json();
    const { icao, reg, serial, airframe, type, operator_id, category_id, note } = body;

    const result = await pool.query(
      `UPDATE core.aircraft SET icao=$1, reg=$2, serial=$3, airframe=$4, type=$5,
       operator_id=$6, category_id=$7, note=$8 WHERE id=$9 RETURNING *`,
      [icao, reg, serial, airframe, type, operator_id ?? null, category_id ?? null, note ?? null, params.id]
    );
    if (result.rows.length === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const result = await pool.query("DELETE FROM core.aircraft WHERE id=$1 RETURNING id", [params.id]);
    if (result.rows.length === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ deleted: true, id: params.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
