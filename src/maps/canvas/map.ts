import type { ComponentType } from 'react'
import type { MapRendererProps } from '../../common/panels/builder'
import type { ExplorerData } from '../../common/models'
import { CanvasParser } from './loader/parser'
import CanvasRenderer from './render'

export interface MapDescriptor {
  parser:   { build(raw: unknown): ExplorerData }
  Renderer: ComponentType<MapRendererProps>
}

export const CanvasMap: MapDescriptor = {
  parser:   new CanvasParser(),
  Renderer: CanvasRenderer,
}
