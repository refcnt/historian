export type { LayoutAlgorithm } from './base'
export { BaseLayout }            from './base'
export { FruchtermanReingoldLayout } from './fruchterman_reingold'
export { ForceAtlas2Layout }         from './forceatlas2'
export { HierarchicalLayout }        from './hierarchical'

import type { LayoutAlgorithm }      from './base'
import { FruchtermanReingoldLayout } from './fruchterman_reingold'
import { ForceAtlas2Layout }         from './forceatlas2'
import { HierarchicalLayout }        from './hierarchical'

export interface LayoutEntry {
  algo:        LayoutAlgorithm
  label:       string
  description: string
  bestFor:     string
}

const REGISTRY: Record<string, LayoutEntry> = {
  'fruchterman-reingold': {
    algo:        new FruchtermanReingoldLayout(),
    label:       'Fruchterman–Reingold',
    description: 'Force-directed layout that balances repulsion between all nodes and attraction along edges.',
    bestFor:     'General-purpose graphs with no clear hierarchy. Good when relationships are the main story and clusters should emerge naturally.',
  },
  'forceatlas2': {
    algo:        new ForceAtlas2Layout(),
    label:       'ForceAtlas2',
    description: 'Continuous force-directed layout from Gephi. Uses linlog attraction and hub-size repulsion for tighter, more readable clusters.',
    bestFor:     'Large graphs with hubs and communities. Produces denser clusters than Fruchterman–Reingold and handles scale-free networks well.',
  },
  'hierarchical': {
    algo:        new HierarchicalLayout(),
    label:       'Hierarchical',
    description: 'Places root groups with a size-aware F-R pass, then arranges children in a fixed grid inside each parent.',
    bestFor:     'Tree-like or layered data where parent–child ownership matters more than cross-group connections (e.g. services inside domains).',
  },
}

export function getLayout(name?: string): LayoutAlgorithm {
  return (REGISTRY[name ?? ''] ?? REGISTRY['hierarchical']).algo
}

export function getLayoutEntries(): LayoutEntry[] {
  return Object.values(REGISTRY)
}

export function getLayoutEntry(name: string): LayoutEntry | undefined {
  return REGISTRY[name]
}
