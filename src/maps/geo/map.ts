import type { ComponentType } from 'react'
import type { MapRendererProps } from '../../common/panels/builder'
import type { ExplorerData } from '../../common/models'
import { GeoParser } from './loader/parser'
import GeoRenderer from './render'

export interface MapDescriptor {
  parser:   { build(raw: unknown): ExplorerData }
  Renderer: ComponentType<MapRendererProps>
}

export const GeoMap: MapDescriptor = {
  parser:   new GeoParser(),
  Renderer: GeoRenderer,
}
