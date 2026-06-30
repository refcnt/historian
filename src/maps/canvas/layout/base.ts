import type { Node, Connection } from '@common/models'

class Position {
    constructor(public x: number, public y: number) {}

    distanceTo(other: Position): number {
        const dx = this.x - other.x
        const dy = this.y - other.y
        return Math.sqrt(dx * dx + dy * dy)
    }

    translate(dx: number, dy: number): Position {
        return new Position(this.x + dx, this.y + dy)
    }

    scale(s: number): Position {
        return new Position(this.x * s, this.y * s)
    }
}

class Size {
    constructor(public w: number, public h: number) {}

    radius(): number {
        return Math.max(this.w, this.h) / 2
    }

    scale(s: number): Size {
        return new Size(this.w * s, this.h * s)
    }

    contains(pos: Position, center: Position): boolean {
        return Math.abs(pos.x - center.x) <= this.w / 2
            && Math.abs(pos.y - center.y) <= this.h / 2
  }
}

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
  compute(nodes: Node[][], connections: Connection[][]):  Map<string, ItemLayout>
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

  abstract compute(nodes: Node[][], connections: Connection[][]): Map<string, ItemLayout>
}
