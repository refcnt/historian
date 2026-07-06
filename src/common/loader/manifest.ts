import { ParseError } from './errors'

/**
 * A manifest is the entry file (`?data=`). It names the map type and points to
 * per-entity tables (TSV/CSV) that hold the flat, parent-referenced data. Rich
 * per-node info (tab content) stays inline here since it doesn't fit a table.
 */
export interface Manifest {
  mapType: string
  name?:   string
  tables:  Record<string, string>
  info?:   Record<string, unknown>
}

export function readManifest(doc: unknown, ref: string): Manifest {
  if (typeof doc !== 'object' || doc === null) {
    throw new ParseError(`"${ref}": manifest is not an object`)
  }
  const m = doc as Record<string, unknown>
  if (typeof m.mapType !== 'string') {
    throw new ParseError(`"${ref}": manifest is missing a string "mapType"`)
  }
  if (typeof m.tables !== 'object' || m.tables === null) {
    throw new ParseError(`"${ref}": manifest is missing a "tables" object`)
  }
  const tables: Record<string, string> = {}
  for (const [k, v] of Object.entries(m.tables as Record<string, unknown>)) {
    if (typeof v !== 'string') throw new ParseError(`"${ref}": table "${k}" must be a file path`)
    tables[k] = v
  }
  return {
    mapType: m.mapType,
    name:    typeof m.name === 'string' ? m.name : undefined,
    tables,
    info:    typeof m.info === 'object' && m.info !== null ? (m.info as Record<string, unknown>) : undefined,
  }
}
