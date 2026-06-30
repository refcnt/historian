import type { ComponentType } from 'react'
import type { MapRendererProps } from '../../../common/panels/builder'
import SVGRenderer  from './svg'
import PixiRenderer from './pixi'

const registry: Record<string, ComponentType<MapRendererProps>> = {
  svg:  SVGRenderer,
  pixi: PixiRenderer,
}

export default function RendererSwitcher(props: MapRendererProps) {
  const param    = new URLSearchParams(window.location.search).get('renderer') ?? 'svg'
  const Renderer = registry[param] ?? registry['svg']
  return <Renderer {...props} />
}
