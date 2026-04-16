import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import type { UnidentifiedAircraftInput } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const result = await pool.query("SELECT * FROM core.unidentified_aircraft WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body: UnidentifiedAircraftInput = await request.json();
    const { icao, callsign, airframe, type, note, first_seen } = body;

    const result = await pool.query(
      `UPDATE core.unidentified_aircraft
       SET icao = $1, callsign = $2, airframe = $3, type = $4, note = $5, first_seen = $6
       WHERE id = $7
       RETURNING *`,
      [
        icao?.trim() || null,
        callsign?.trim() || null,
        airframe?.trim() || null,
        type?.trim() || null,
        note?.trim() || null,
        first_seen || null,
        id,
      ],
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
    const result = await pool.query("DELETE FROM core.unidentified_aircraft WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
