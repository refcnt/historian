import { useState, useMemo } from 'react'
import type { ComponentType } from 'react'
import type { Node, Connection, ExplorerData } from '../models'
import DescriptionPanel from './description_panel'
import Sidebar from './sidebar'

export interface MapRendererProps {
  nodes:       Node[]
  connections: Connection[]
  config:      Record<string, unknown>
  focusedNode: Node | null
  onHover:     (item: Node | Connection | null) => void
  onSelect:    (node: Node) => void
}

interface Props {
  name: string
  data: ExplorerData
  MapRenderer: ComponentType<MapRendererProps>
}

export default function Builder({ name, data, MapRenderer }: Props) {
  const [focusedNode, setFocusedNode] = useState<Node | null>(null)
  const [selected, setSelected]       = useState<Node | Connection | null>(null)

  const rootNodes      = useMemo(() => [...data.nodes.values()].filter(n => !n.parent), [data])
  const allConnections = useMemo(() => [...data.connections.values()], [data])

  return (
    <div className="app">
      <Sidebar
        name={name}
        rootNodes={rootNodes}
        onFocus={setFocusedNode}
      />

      <div className="content">
        <div className="map-container">
          <MapRenderer
            nodes={rootNodes}
            connections={allConnections}
            config={data.config}
            focusedNode={focusedNode}
            onHover={setSelected}
            onSelect={setSelected}
          />
        </div>
        <DescriptionPanel key={selected?.id ?? 'none'} infoBlock={selected?.info ?? null} />
      </div>
    </div>
  )
}
