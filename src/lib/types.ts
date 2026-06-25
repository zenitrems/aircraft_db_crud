export interface Aircraft {
  id: number;
  icao: string;
  reg: string;
  serial: string;
  airframe: string;
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

export type CatalogInput = Pick<Operator, "name">;

export type AircraftInput = Omit<Aircraft, "id" | "created_at">;

export interface UnidentifiedAircraft {
  id: number;
  icao: string | null;
  callsign: string | null;
  airframe: string | null;
  type: string | null;
  note: string | null;
  first_seen: string | null;
}

export type UnidentifiedAircraftInput = Omit<UnidentifiedAircraft, "id">;
