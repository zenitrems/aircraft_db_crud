export interface Aircraft {
  id: number;
  icao: string;
  reg: string;
  serial: string;
  airframe: string;
  type: string;
  operator_id: number | null;
  category_id: number | null;
  note: string | null;
  created_at: string;
}

export interface AircraftView {
  id: number;
  icao: string;
  reg: string;
  serial: string;
  airframe: string;
  type: string;
  operator_id: number | null;
  category_id: number | null;
  note: string | null;
  created_at: string;
  operator_name: string | null;
  category_name: string | null;
}

export interface Operator {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
}

export type AircraftInput = Omit<Aircraft, "id" | "created_at">;
