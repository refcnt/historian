import type { ComponentType } from 'react'
import type { MapRendererProps, SidebarProps, ExplorerData } from '@common/models'
import { ParseError } from '@common/loader/errors'
import { geoDefinition } from './geo/map'
import { canvasDefinition } from './canvas/map'

/**
 * A self-contained map: owns its document schema + parse (validation → domain
 * model), its renderer, and its sidebar. Register new maps in the MAPS table.
 */
export interface MapDefinition {
  mapType:  string
  parse(doc: unknown): ExplorerData
  renderer: ComponentType<MapRendererProps>
  sidebar:  ComponentType<SidebarProps>
}

const MAPS: Record<string, MapDefinition> = {
  geo:    geoDefinition,
  canvas: canvasDefinition,
}

export function getMap(mapType: string): MapDefinition {
  const def = MAPS[mapType]
  if (!def) throw new ParseError(`Unknown map type: "${mapType}"`)
  return def
}
