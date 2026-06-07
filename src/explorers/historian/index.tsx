import type { ComponentType } from 'react'
import type { ExplorerPlugin, RendererProps } from '../../core/plugin'
import type { HistorianData } from './data/loader'
import MapRenderer from './components/MapRenderer'
import HistorianSidebar from './components/HistorianSidebar'

export function createHistorianPlugin(data: HistorianData): ExplorerPlugin {
  const { rootNodes, connectionsL1, connectionsL2, worldGeo } = data

  const Renderer: ComponentType<RendererProps> = (props) => (
    <MapRenderer {...props} worldGeo={worldGeo} />
  )

  return {
    id: 'historian',
    name: '15th Century World',
    rootNodes,
    getConnections(viewDepth) {
      if (viewDepth === 0) return connectionsL1
      if (viewDepth === 1) return connectionsL2
      return []
    },
    getVisibleNodes(viewDepth) {
      if (viewDepth === 0) return rootNodes
      // Show all countries globally — drillPath only controls the viewport
      return rootNodes.flatMap(n => n.children)
    },
    Renderer,
    SidebarContent: HistorianSidebar,
  }
}
