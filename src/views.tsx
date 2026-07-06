import type { ComponentType } from 'react'
import type { Node, Connection, Id, ExplorerData, MapRendererProps, SidebarProps, RequestPath } from './common/models'
import DescriptionPanel from './common/panels/description_panel'

export function BuildFailed(message: string) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0a0e1a', color: '#f66', fontSize: 14, padding: 32,
    }}>
      {message}
    </div>
  )
}

export function BuildLoading() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0a0e1a', color: '#eee', fontSize: 16,
    }}>
      Loading…
    </div>
  )
}

export interface BuildProps {
  data:           ExplorerData
  MapRenderer:    ComponentType<MapRendererProps>
  Sidebar:        ComponentType<SidebarProps>
  focusedNode:    Node | null
  selected:       Node | Connection | null
  activeNodeIds:  Set<Id> | null
  currLevel:      number
  activePathIds:  Set<Id>
  activePaths:    RequestPath[]
  setFocusedNode: (node: Node | null) => void
  setSelected:    (item: Node | Connection | null) => void
  onToggleActive: (id: Id) => void
  onResetActive:  () => void
  onTogglePath:   (id: Id) => void
  onLevelChange:  (level: number, nodes: Node[]) => void
}

export function Build(p: BuildProps) {
  const { data, MapRenderer, Sidebar } = p
  const rootNodes      = [...data.nodes.values()].filter(n => !n.parent)
  const allConnections = [...data.connections.values()]

  return (
    <div className="app">
      <Sidebar
        data={data}
        currLevel={p.currLevel}
        activeNodeIds={p.activeNodeIds}
        focusedNode={p.focusedNode}
        activePathIds={p.activePathIds}
        onFocus={p.setFocusedNode}
        onToggleActive={p.onToggleActive}
        onResetActive={p.onResetActive}
        onTogglePath={p.onTogglePath}
      />
      <div className="content">
        <div className="map-container">
          <MapRenderer
            nodes={rootNodes}
            connections={allConnections}
            info={data.info}
            config={data.config}
            focusedNode={p.focusedNode}
            activeNodeIds={p.activeNodeIds}
            activePaths={p.activePaths}
            onLevelChange={p.onLevelChange}
            onHover={p.setSelected}
            onSelect={p.setSelected}
          />
        </div>
        <DescriptionPanel key={p.selected?.id ?? 'none'} infoBlock={p.selected?.id ? data.info[p.selected.id] : null} />
      </div>
    </div>
  )
}
