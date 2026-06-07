import type { Location } from './Location'
import type { InfoBlock } from './InfoBlock'

export interface BaseItem {
  id: string
  name: string
  label: string          // text drawn on the visualization
  description: string    // one-liner for hover tooltip
  infoBlock: InfoBlock   // full tabbed detail panel
}

export interface Node extends BaseItem {
  children: Node[]       // depth is implicit: root=0, children=1, …
  location: Location
}
