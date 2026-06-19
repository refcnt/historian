export type { LayoutAlgorithm } from './base'
export { BaseLayout }            from './base'
export { FruchtermanReingoldLayout } from './fruchterman_reingold'
export { ForceAtlas2Layout }         from './forceatlas2'
export { HierarchicalLayout }        from './hierarchical'

import type { LayoutAlgorithm }      from './base'
import { FruchtermanReingoldLayout } from './fruchterman_reingold'
import { ForceAtlas2Layout }         from './forceatlas2'
import { HierarchicalLayout }        from './hierarchical'

const REGISTRY: Record<string, LayoutAlgorithm> = {
  'fruchterman-reingold': new FruchtermanReingoldLayout(),
  'forceatlas2':          new ForceAtlas2Layout(),
  'hierarchical':         new HierarchicalLayout(),
}

export function getLayout(name?: string): LayoutAlgorithm {
  return REGISTRY[name ?? ''] ?? REGISTRY['fruchterman-reingold']
}
