import type { Node, Connection } from '@common/models'
import { Position, Size } from '@common/layout/layout'

export { Position, Size }

export class ItemLayout {
    position: Position
    size: Size
    level: number

    constructor(x: number, y: number, w: number, h: number, level: number) {
        this.position = new Position(x, y)
        this.size = new Size(w, h)
        this.level = level
    }

    isVisible(currLevel: number): boolean {
        return currLevel >= this.level
    }
}

export interface LayoutAlgorithm {
  compute(nodes: Node[], connections: Connection[]):  Map<string, ItemLayout>
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

  abstract compute(nodes: Node[], connections: Connection[]): Map<string, ItemLayout>
}
