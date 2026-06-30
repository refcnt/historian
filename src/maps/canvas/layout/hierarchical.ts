import type { Node, Connection } from '../../../common/models'
import { BaseLayout, ItemLayout } from './base'
import { CHILD_COL_W, CHILD_GAP, CHILD_COLS, GROUP_PAD, GROUP_LH, CARD_W, CARD_H, groupDims } from '../constants'

const CANVAS_W   = 3000
const CANVAS_H   = 2200
const ITERATIONS = 400
const MARGIN     = 40

const LEAF_W = CARD_W
const LEAF_H = CARD_H

function seededRng(seed: number) {
  let s = Math.abs(seed) | 1
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

type Pos  = { x: number; y: number }
type Size = { w: number; h: number }

function radius(s: Size) {
  return Math.max(s.w, s.h) / 2
}

// F-R layout for the top-level roots, clamped to CANVAS_W × CANVAS_H.
function runFR(
  nodes:       Node[],
  connections: Connection[],
  sizes:       Map<string, Size>,
): Map<string, Pos> {
  if (nodes.length === 0) return new Map()
  if (nodes.length === 1) {
    const s = sizes.get(nodes[0].id) ?? { w: LEAF_W, h: LEAF_H }
    return new Map([[nodes[0].id, { x: CANVAS_W / 2, y: CANVAS_H / 2 }]])
  }

  const k = Math.sqrt((CANVAS_W * CANVAS_H) / nodes.length)
  const rng = seededRng(hashStr(nodes.map(n => n.id).join(',')))

  const pos = new Map(nodes.map(n => {
    const s = sizes.get(n.id) ?? { w: LEAF_W, h: LEAF_H }
    return [n.id, {
      x: s.w / 2 + 80 + rng() * (CANVAS_W - s.w - 160),
      y: s.h / 2 + 80 + rng() * (CANVAS_H - s.h - 160),
    }]
  }))
  const disp = new Map(nodes.map(n => [n.id, { x: 0, y: 0 }]))

  const nodeIds = new Set(nodes.map(n => n.id))
  let temp = CANVAS_W * 0.1

  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (const n of nodes) { const d = disp.get(n.id)!; d.x = 0; d.y = 0 }

    // Size-aware repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = pos.get(nodes[i].id)!, sa = sizes.get(nodes[i].id) ?? { w: LEAF_W, h: LEAF_H }
        const b = pos.get(nodes[j].id)!, sb = sizes.get(nodes[j].id) ?? { w: LEAF_W, h: LEAF_H }
        const dx = a.x - b.x, dy = a.y - b.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
        const kEff = k + radius(sa) + radius(sb) + MARGIN
        const force = (kEff * kEff) / dist
        const fx = (dx / dist) * force, fy = (dy / dist) * force
        disp.get(nodes[i].id)!.x += fx; disp.get(nodes[i].id)!.y += fy
        disp.get(nodes[j].id)!.x -= fx; disp.get(nodes[j].id)!.y -= fy
      }
    }

    // Attraction along connections (weighted)
    for (const c of connections) {
      const a = pos.get(c.from.id), b = pos.get(c.to.id)
      if (!a || !b || !nodeIds.has(c.from.id) || !nodeIds.has(c.to.id)) continue
      if (c.from.id === c.to.id) continue
      const w = c.weight ?? 1
      const dx = b.x - a.x, dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
      const force = (dist * dist) / k * w
      const fx = (dx / dist) * force, fy = (dy / dist) * force
      disp.get(c.from.id)!.x += fx; disp.get(c.from.id)!.y += fy
      disp.get(c.to.id)!.x   -= fx; disp.get(c.to.id)!.y   -= fy
    }

    // Apply with cooling, clamped to canvas
    for (const n of nodes) {
      const p = pos.get(n.id)!, d = disp.get(n.id)!
      const s = sizes.get(n.id) ?? { w: LEAF_W, h: LEAF_H }
      const dlen = Math.sqrt(d.x * d.x + d.y * d.y) || 0.01
      const step = Math.min(dlen, temp)
      p.x = Math.max(s.w / 2 + 80, Math.min(CANVAS_W - s.w / 2 - 80, p.x + (d.x / dlen) * step))
      p.y = Math.max(s.h / 2 + 80, Math.min(CANVAS_H - s.h / 2 - 80, p.y + (d.y / dlen) * step))
    }
    temp = Math.max(1, temp * 0.97)
  }

  return pos
}

export class HierarchicalLayout extends BaseLayout {
  compute(nodesByLevel: Node[][], connectionsByLevel: Connection[][]): Map<string, ItemLayout> {
    const nodes       = nodesByLevel.flat()
    const connections = connectionsByLevel.flat()
    if (nodes.length === 0) return new Map()

    const roots = nodesByLevel[0] ?? []
    if (roots.length === 0) return new Map()

    // ── 1. Bottom-up: compute sizes using grid formula ───────────────────────
    const sizes = new Map<string, Size>()

    const computeSize = (n: Node) => {
      for (const child of n.children) computeSize(child)
      if (n.children.length === 0) {
        sizes.set(n.id, { w: LEAF_W, h: LEAF_H })
        return
      }
      const { w, h } = groupDims(n.children.length)
      sizes.set(n.id, { w: Math.max(w, n.minSize ?? 0), h: Math.max(h, n.minSize ?? 0) })
    }
    for (const root of roots) computeSize(root)

    // ── 2. Top-level F-R for roots (size-aware + connection weight) ──────────
    const rootIds   = new Set(roots.map(r => r.id))
    const rootConns = connections.filter(c => rootIds.has(c.from.id) && rootIds.has(c.to.id))
    const rootPos   = runFR(roots, rootConns, sizes)

    // ── 3. Top-down: assign positions (grid layout for children) ────────────
    const result = new Map<string, ItemLayout>()

    const assign = (n: Node, center: Pos, level: number) => {
      const s = sizes.get(n.id)!
      result.set(n.id, new ItemLayout(center.x, center.y, s.w, s.h, level))
      if (n.children.length === 0) return

      const cols = Math.min(n.children.length, CHILD_COLS)
      n.children.forEach((child, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        assign(child, {
          x: center.x - s.w / 2 + GROUP_PAD + col * CHILD_COL_W + CHILD_COL_W / 2,
          y: center.y - s.h / 2 + GROUP_LH  + GROUP_PAD + row * (CARD_H + CHILD_GAP) + CARD_H / 2,
        }, level + 1)
      })
    }

    for (const root of roots) assign(root, rootPos.get(root.id)!, 0)

    return result
  }
}
