export interface Continent {
  id: string
  name: string
  lat: number
  lon: number
  population_m: number
  summary: string
  key_events: string
  major_powers: string
}

export interface Country {
  name: string
  continent: string
  lat: number
  lon: number
  type: string
  population_est: string
  territory_iso: string[]
  description: string
}

export interface Connection {
  name: string
  type: string
  description: string
  from_lat: number
  from_lon: number
  to_lat: number
  to_lon: number
}

export interface HistoryData {
  continents: Continent[]
  countries: Country[]
  connections_l1: Connection[]
  connections_l2: Connection[]
}

export interface HoveredEntity {
  name: string
  desc: string
  tags: string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GeoData = { type: 'FeatureCollection'; features: any[] }
