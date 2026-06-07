import type { ComponentType } from 'react'
import type { Node, NodeConnection } from './models'

export interface RendererProps {
  nodes: Node[]
  connections: NodeConnection[]
  viewDepth: number
  drillPath: Node[]
  focusedNode: Node | null
  onHover: (item: Node | NodeConnection | null) => void
  onSelect: (node: Node) => void
  pluginOptions: Record<string, unknown>
}

export interface SidebarContentProps {
  viewDepth: number
  drillPath: Node[]
  rootNodes: Node[]
  onFocus: (node: Node | null) => void
  pluginOptions: Record<string, unknown>
  onPluginOption: (key: string, value: unknown) => void
}

export interface ExplorerPlugin {
  id: string
  name: string
  rootNodes: Node[]
  getConnections: (viewDepth: number, drillPath: Node[]) => NodeConnection[]
  // Optional override: which nodes to show at the current depth.
  // Default: depth 0 → rootNodes, depth N → drillPath[N-1].children
  // Override when drilling should change viewport but not limit visible nodes.
  getVisibleNodes?: (viewDepth: number, drillPath: Node[]) => Node[]
  Renderer: ComponentType<RendererProps>
  SidebarContent?: ComponentType<SidebarContentProps>
}
