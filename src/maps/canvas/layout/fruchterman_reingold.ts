import type { Node, Connection } from '@common/models'
import { BaseLayout, ItemLayout } from './base'
import { Position, Area, Size } from '@common/layout/layout'
import { ICON_SIZE, CHILD_LABEL } from '@maps/canvas/constants'
import { hashStr, seededRng } from '@common/layout/utils'

const ITERATIONS = 500

export class FruchtermanReingoldLayout extends BaseLayout {
  compute(nodes: Node[], connections: Connection[]): Map<string, ItemLayout> {
    const sizes    = new Map(nodes.map(n => [n.id, new Size(ICON_SIZE, ICON_SIZE + CHILD_LABEL)])) 
    const siblings = this.siblingPairs(nodes)    
    const positionsMap = calculatePositions(
      nodes, connections, sizes, siblings
    )
    const result = new Map<string, ItemLayout>()
    for (const n of nodes) {
      const p = positionsMap.get(n.id)!
      const s = sizes.get(n.id)!
      result.set(n.id, new ItemLayout(p.x, p.y, s.w, s.h, n.level))
    }
    return result
  }
}

export function calculatePositions(
  nodes:       Node[],
  connections: Connection[],
  sizes:       Map<String, Size>,
  siblings: [string, string][]
): Map<string, Position> {
    const rng = seededRng(hashStr(nodes.map(n => n.id).join(',')))

    const def   = new Size(ICON_SIZE, ICON_SIZE + CHILD_LABEL)
    const GAP   = 40      // desired edge-to-edge breathing room (matches overlap-removal below)
    const SPREAD = 1.6    // packing density: how much slack the canvas gives F-R to arrange nodes

    // Canvas sized from the actual footprint the nodes occupy (√-scale), not a linear
    // sum of radii. This keeps root spacing proportional to group size and scales
    // correctly as the hierarchy deepens.
    const footprint  = nodes.reduce((s, n) => {
      const sz = sizes.get(n.id) ?? def
      return s + (sz.w + GAP) * (sz.h + GAP)
    }, 0)
    const canvasSide = Math.max(2000, Math.sqrt(footprint * SPREAD))
    const CANVAS_W   = canvasSide
    const CANVAS_H   = canvasSide

    const area = new Area(CANVAS_W, CANVAS_H, 80)
    const k    = Math.sqrt((CANVAS_W * CANVAS_H) / nodes.length)

    const pos = new Map(nodes.map(n => [n.id, area.createRandomPosition(rng)]))
    const disp = new Map(nodes.map(n => [n.id, new Position(0, 0)]))

    // temp starts large (free exploration) and cools 3% per iteration until nodes barely move
    let temp = CANVAS_W * 0.1

    for (let iter = 0; iter < ITERATIONS; iter++) {
      // Reset displacement accumulators
      for (const n of nodes) { const d = disp.get(n.id)!; d.x = 0; d.y = 0 }

      // Phase 1 — Repulsion: every pair pushes apart, kEff grows with node radii so larger nodes push further
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a     = pos.get(nodes[i].id)!
          const b     = pos.get(nodes[j].id)!
          const sa    = sizes.get(nodes[i].id) ?? def
          const sb    = sizes.get(nodes[j].id) ?? def
          const dist  = a.distance(b) || 0.01
          const unit  = a.subtract(b).normalize()
          const kEff  = k + sa.radius() + sb.radius()
          const force = (kEff * kEff) / dist
          disp.get(nodes[i].id)!.pushToDirection(unit,  force)
          disp.get(nodes[j].id)!.pushToDirection(unit, -force)
        }
      }

      // Phase 2 — Attraction along edges: connected nodes pull together, force = dist²/k (stronger when farther)
      for (const c of connections) {
        const a = pos.get(c.from.id)
        const b = pos.get(c.to.id)
        if (!a || !b || c.from.id === c.to.id) continue
        const dir   = b.subtract(a)
        const dist  = a.distance(b) || 0.01
        const unit  = dir.normalize()
        const force = (dist * dist) / k
        disp.get(c.from.id)!.pushToDirection(unit,  force)
        disp.get(c.to.id)!.pushToDirection(unit,  -force)
      }

      // Phase 3 — Sibling attraction: nodes sharing a parent pull 2× harder to stay clustered
      for (const [aid, bid] of siblings) {
        const a = pos.get(aid)
        const b = pos.get(bid)
        if (!a || !b) continue
        const dir   = b.subtract(a)
        const dist  = a.distance(b) || 0.01
        const unit  = dir.normalize()
        const force = (dist * dist) / (k * 0.5)
        disp.get(aid)!.pushToDirection(unit,  force)
        disp.get(bid)!.pushToDirection(unit, -force)
      }

      // Apply: move each node by its displacement, capped at temp, clamped to canvas bounds
      for (const n of nodes) {
        const p    = pos.get(n.id)!
        const d    = disp.get(n.id)!
        const unit = d.normalize()
        const dlen = d.distance(new Position(0, 0))
        const step = Math.min(dlen, temp)
        p.pushToDirection(unit, step)
        area.boundPosition(p)
      }

      temp = Math.max(1, temp * 0.97)
    }

    // Post-process — overlap removal using actual node radii + gap.
    // This is the binding constraint on spacing: it enforces an even, size-proportional
    // gap (r_a + r_b + GAP) between every pair, while F-R above only decides arrangement.
    for (let pass = 0; pass < 300; pass++) {
      let moved = false
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a       = pos.get(nodes[i].id)!
          const b       = pos.get(nodes[j].id)!
          const sa      = sizes.get(nodes[i].id) ?? def
          const sb      = sizes.get(nodes[j].id) ?? def
          const reqDist = sa.radius() + sb.radius() + GAP
          const dist    = a.distance(b) || 0.01
          if (dist < reqDist) {
            const push = (reqDist - dist) / 2 + 0.5
            const unit = a.direction(b)
            a.pushToDirection(unit, -push)
            b.pushToDirection(unit,  push)
            moved = true
          }
        }
      }
      if (!moved) break
    }
    return pos
}