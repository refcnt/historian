import type { Node, Connection } from '@common/models'
import { BaseLayout, ItemLayout } from './base'
import { Position, Size, Area, AreaBuilder } from '@common/layout/layout'
import { GROUP_PAD, CARD_W, CARD_H } from '@maps/canvas/constants'
// import { hashStr, seededRng } from '@common/layout/utils'
import { calculatePositions } from './fruchterman_reingold'

const CANVAS_W   = 1400
const CANVAS_H   = 1000
const ITERATIONS = 400
const MARGIN     = 20

const LEAF_W = CARD_W
const LEAF_H = CARD_H

export class HierarchicalLayout extends BaseLayout {
  compute(nodes: Node[], connections: Connection[]): Map<string, ItemLayout> {
    if (nodes.length === 0) {
      return new Map()
    }
    const roots = nodes.filter(n => !n.parent)
    if (roots.length === 0) {
      return new Map()
    }

    // 1. Build area tree bottom-up: leaves get fixed size, parents pack children with FFDH
    const nodeAreaMap    = new Map<string, Area>()
    for (const root of roots) buildAreas(root, GROUP_PAD, CARD_W, nodeAreaMap)

    // 2. Top-level F-R for roots (size-aware + connection weight)
    const rootIds   = new Set(roots.map(r => r.id))
    const rootConns = connections.filter(c => rootIds.has(c.from.id) && rootIds.has(c.to.id))
    const sizeMap   = new Map([...nodeAreaMap.entries()].map(([id, a]) => [id, a.size()]))
    const rootPositions = calculatePositions(roots, rootConns, sizeMap, [])
    for (const [id, pos] of rootPositions) {
      nodeAreaMap.get(id)!.setPosition(pos)
    }

    // 3. Top-down: assign positions
    const result = new Map<string, ItemLayout>()
    for (const root of roots) collectLayout(root, nodeAreaMap, result)
    return result
  }
}

function collectLayout(node: Node, nodeAreaMap: Map<string, Area>, layoutMap: Map<string, ItemLayout>): void {
  const area = nodeAreaMap.get(node.id)!
  layoutMap.set(node.id, new ItemLayout(area.position.x, area.position.y, area.width, area.height, node.level))
  for (const child of node.children) {
    collectLayout(child, nodeAreaMap, layoutMap)
  }
}


function buildAreas(
  node:           Node,
  padding:        number,
  spaceBetweenAreas: number,
  nodeAreaMap:    Map<string, Area>,
): Area {
  if (node.children.length === 0) {
    const area = new Area(LEAF_W, LEAF_H)
    nodeAreaMap.set(node.id, area)
    return area
  }
  const builder = new AreaBuilder(padding, spaceBetweenAreas)
  for (const child of node.children) {
    const childArea = buildAreas(child, padding, spaceBetweenAreas, nodeAreaMap)
    builder.add(childArea.id, childArea)
  }
  const area = builder.build()
  nodeAreaMap.set(node.id, area)
  return area
}

// function runFR(
//   nodes:       Node[],
//   connections: Connection[],
//   sizes:       Map<string, Size>,
// ): Map<string, Position> {
//   if (nodes.length === 0) return new Map()
//   if (nodes.length === 1) {
//     return new Map([[nodes[0].id, new Position(CANVAS_W / 2, CANVAS_H / 2)]])
//   }

//   const k   = Math.sqrt((CANVAS_W * CANVAS_H) / nodes.length)
//   const rng = seededRng(hashStr(nodes.map(n => n.id).join(',')))
//   const def = new Size(LEAF_W, LEAF_H)

//   const pos  = new Map(nodes.map(n => {
//     const s = sizes.get(n.id) ?? def
//     return [n.id, new Position(
//       s.w / 2 + 80 + rng() * (CANVAS_W - s.w - 160),
//       s.h / 2 + 80 + rng() * (CANVAS_H - s.h - 160),
//     )]
//   }))
//   const disp = new Map(nodes.map(n => [n.id, new Position(0, 0)]))

//   const nodeIds = new Set(nodes.map(n => n.id))
//   let temp = CANVAS_W * 0.1

//   for (let iter = 0; iter < ITERATIONS; iter++) {
//     for (const n of nodes) disp.get(n.id)!.update(0, 0)

//     for (let i = 0; i < nodes.length; i++) {
//       for (let j = i + 1; j < nodes.length; j++) {
//         const a = pos.get(nodes[i].id)!, sa = sizes.get(nodes[i].id) ?? def
//         const b = pos.get(nodes[j].id)!, sb = sizes.get(nodes[j].id) ?? def
//         const dist  = a.distance(b) || 0.01
//         const unit  = a.subtract(b).normalize()
//         const kEff  = k + sa.radius() + sb.radius() + MARGIN
//         const force = (kEff * kEff) / dist
//         disp.get(nodes[i].id)!.pushToDirection(unit,  force)
//         disp.get(nodes[j].id)!.pushToDirection(unit, -force)
//       }
//     }

//     for (const c of connections) {
//       const a = pos.get(c.from.id), b = pos.get(c.to.id)
//       if (!a || !b || !nodeIds.has(c.from.id) || !nodeIds.has(c.to.id)) continue
//       if (c.from.id === c.to.id) continue
//       const w     = c.weight ?? 1
//       const dist  = a.distance(b) || 0.01
//       const unit  = a.direction(b)
//       const force = (dist * dist) / k * w
//       disp.get(c.from.id)!.pushToDirection(unit,  force)
//       disp.get(c.to.id)!.pushToDirection(unit,   -force)
//     }

//     for (const n of nodes) {
//       const p    = pos.get(n.id)!, d = disp.get(n.id)!
//       const s    = sizes.get(n.id) ?? def
//       const dlen = d.distance(new Position(0, 0))
//       const step = Math.min(dlen, temp)
//       p.pushToDirection(d.normalize(), step)
//       p.x = Math.max(s.w / 2 + 80, Math.min(CANVAS_W - s.w / 2 - 80, p.x))
//       p.y = Math.max(s.h / 2 + 80, Math.min(CANVAS_H - s.h / 2 - 80, p.y))
//     }
//     temp = Math.max(1, temp * 0.97)
//   }

//   return pos
// }
