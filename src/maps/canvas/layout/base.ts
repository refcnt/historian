import type { Node, Connection } from '../../../common/models'

export type LayoutResult = {
  positions: Map<string, { x: number; y: number }>
  sizes:     Map<string, { w: number; h: number }>
}

export interface LayoutAlgorithm {
  compute(nodes: Node[], connections: Connection[]): LayoutResult
}

export abstract class BaseLayout implements LayoutAlgorithm {
  protected siblingPairs(nodes: Node[]): [string, string][] {
    const groups = new Map<string, string[]>()
    for (const n of nodes) {
      if (!n.parent) continue
      const g = groups.get(n.parent.id) ?? []
      g.push(n.id)
      groups.set(n.parent.id, g)
    }
    const pairs: [string, string][] = []
    for (const siblings of groups.values())
      for (let i = 0; i < siblings.length; i++)
        for (let j = i + 1; j < siblings.length; j++)
          pairs.push([siblings[i], siblings[j]])
    return pairs
  }

  abstract compute(nodes: Node[], connections: Connection[]): LayoutResult
}
