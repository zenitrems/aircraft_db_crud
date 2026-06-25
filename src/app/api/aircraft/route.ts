import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { AircraftInput } from "@/lib/types";

const AIRCRAFT_COLUMNS = "id, icao, reg, serial, airframe, operator_id, category_id, note, created_at";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const operators = await pool.query("SELECT * FROM core.operators ORDER BY name");
    const categories = await pool.query("SELECT * FROM core.categories ORDER BY name");

    if (searchParams.get("lookups") === "1") {
      return NextResponse.json({
        operators: operators.rows,
        categories: categories.rows,
      });
    }

    const aircraft = await pool.query(`SELECT ${AIRCRAFT_COLUMNS} FROM core.aircraft ORDER BY id DESC`);
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
    const { icao, reg, serial, airframe, operator_id, category_id, note } = body;

    const result = await pool.query(
      `INSERT INTO core.aircraft (icao, reg, serial, airframe, operator_id, category_id, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING ${AIRCRAFT_COLUMNS}`,
      [icao, reg, serial, airframe, operator_id ?? null, category_id ?? null, note ?? null]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
