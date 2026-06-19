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

export interface Node {
  id:        Id
  name:      string
  color?:    string
  icon?:     string
  weight?:   number
  minSize?:  number
  fontSize?:   number
  fontColor?:  string
  fontFamily?: string
  location?: { lat: number; lon: number; zoom: number; iso?: string[] }
  info?:     InfoBlock
  fromTs?:   Timestamp
  toTs?:     Timestamp
  parent?:   Node
  children:  Node[]
}

export interface Connection {
  id:       Id
  name:     string
  from:     Node
  to:       Node
  color?:   string
  weight?:  number
  info?:    InfoBlock
  fromTs?:  Timestamp
  toTs?:    Timestamp
  parent?:  Connection
  children: Connection[]
}

export interface ExplorerData {
  nodes:       Map<Id, Node>
  connections: Map<Id, Connection>
  config:      Record<string, unknown>
}
