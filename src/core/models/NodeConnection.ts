import type { BaseItem, Node } from './Node'

export interface NodeConnection extends BaseItem {
  source: Node
  target: Node
  childrenDetailedConnections: NodeConnection[]
  category?: string       // grouping label shown in sidebar filter (e.g. "Trade Route")
  categoryColor?: string  // display color for the category dot
}
