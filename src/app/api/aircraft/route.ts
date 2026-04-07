import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { AircraftInput } from "@/lib/types";

export async function GET() {
  try {
    const operators = await pool.query("SELECT * FROM core.operators ORDER BY name");
    const categories = await pool.query("SELECT * FROM core.categories ORDER BY name");
    const aircraft = await pool.query("SELECT * FROM core.aircraft ORDER BY id DESC");
    return NextResponse.json({
      aircraft: aircraft.rows,
      operators: operators.rows,
      categories: categories.rows,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: AircraftInput = await request.json();
    const { icao, reg, serial, airframe, type, operator_id, category_id, note } = body;

    const result = await pool.query(
      `INSERT INTO core.aircraft (icao, reg, serial, airframe, type, operator_id, category_id, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [icao, reg, serial, airframe, type, operator_id ?? null, category_id ?? null, note ?? null]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
