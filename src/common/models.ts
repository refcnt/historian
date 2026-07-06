export type Id        = string
export type Timestamp = number  // epoch ms

export type TabContent =
  | { type: 'text';  text: string }
  | { type: 'list';  items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'image'; url: string; alt?: string }

export interface Tab {
  title:   string
  content: TabContent[]
}

export interface InfoBlock {
  tabs: Tab[]
}

export interface Location {
  lat:   number
  lon:   number
  zoom:  number
  iso?:  string[]
}

export interface Node {
  id:        Id
  name:      string
  color?:    string
  location?: Location
  level:     number
  parent?:   Node
  children:  Node[]
}

export interface Connection {
  id:       Id
  name:     string
  from:     Node
  to:       Node
  level:    number
  parent?:  Connection
  children: Connection[]
}

export interface MapRendererProps {
  nodes:       Node[]
  connections: Connection[]
  info:        Record<string, InfoBlock>
  config:      Record<string, unknown>
  focusedNode: Node | null
  onHover:     (item: Node | Connection | null) => void
  onSelect:    (node: Node) => void
  // Connections are hidden unless they touch one of these nodes (null/empty = show all).
  activeNodeIds?: Set<Id> | null
  // The renderer reports its current level + that level's nodes back to the shell.
  onLevelChange?: (level: number, nodes: Node[]) => void
  // Active request paths, highlighted as an overlay (resolved per level by the renderer).
  activePaths?: RequestPath[]
}

/** Everything a map-specific sidebar may need from the shared shell. */
export interface SidebarProps {
  data:           ExplorerData
  currLevel:      number
  activeNodeIds:  Set<Id> | null
  focusedNode:    Node | null
  activePathIds:  Set<Id>
  onFocus:        (node: Node | null) => void
  onToggleActive: (id: Id) => void
  onResetActive:  () => void
  onTogglePath:   (id: Id) => void
}

/** One hop of a request path (a directed edge between two nodes) plus its metadata. */
export interface RequestStep {
  from:         Id
  to:           Id
  method?:      string
  path?:        string
  queryParams?: Record<string, string>
  headers?:     Record<string, string>
  reqPerSec?:   number
  bytesPerSec?: number
}

/** A named request flow highlighted across the map in its own color. */
export interface RequestPath {
  id:     Id
  name:   string
  color?: string
  steps:  RequestStep[]
}


export interface ExplorerData {
  mapType:     string
  nodes:       Map<Id, Node>
  connections: Map<Id, Connection>
  info:        Record<Id, InfoBlock>
  config:      Record<string, unknown>
  paths:       RequestPath[]
}
