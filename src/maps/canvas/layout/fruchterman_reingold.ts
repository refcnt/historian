import type { Node, Connection } from '../../../common/models'
import { BaseLayout } from './base'
import type { LayoutResult } from './base'
import { ICON_SIZE, CHILD_LABEL } from '../constants'

const CANVAS_W   = 2000
const CANVAS_H   = 1500
const ITERATIONS = 500

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
  return h
}

export class FruchtermanReingoldLayout extends BaseLayout {
  compute(nodes: Node[], connections: Connection[]): LayoutResult {
    const sizes = new Map(nodes.map(n => [n.id, { w: ICON_SIZE, h: ICON_SIZE + CHILD_LABEL }]))
    if (nodes.length === 0) return { positions: new Map(), sizes }

    const rng = seededRng(hashStr(nodes.map(n => n.id).join(',')))
    const k = Math.sqrt((CANVAS_W * CANVAS_H) / nodes.length)
    const minDist = k * 0.7
    const siblings = this.siblingPairs(nodes)

    const pos = new Map(nodes.map(n => [n.id, {
      x: 80 + rng() * (CANVAS_W - 160),
      y: 80 + rng() * (CANVAS_H - 160),
    }]))
    const disp = new Map(nodes.map(n => [n.id, { x: 0, y: 0 }]))

    let temp = CANVAS_W * 0.1

    for (let iter = 0; iter < ITERATIONS; iter++) {
      for (const n of nodes) { const d = disp.get(n.id)!; d.x = 0; d.y = 0 }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = pos.get(nodes[i].id)!
          const b = pos.get(nodes[j].id)!
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
          const force = (k * k) / dist
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          disp.get(nodes[i].id)!.x += fx
          disp.get(nodes[i].id)!.y += fy
          disp.get(nodes[j].id)!.x -= fx
          disp.get(nodes[j].id)!.y -= fy
        }
      }

      for (const c of connections) {
        const a = pos.get(c.from.id)
        const b = pos.get(c.to.id)
        if (!a || !b || c.from.id === c.to.id) continue
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
        const force = (dist * dist) / k
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        disp.get(c.from.id)!.x += fx
        disp.get(c.from.id)!.y += fy
        disp.get(c.to.id)!.x -= fx
        disp.get(c.to.id)!.y -= fy
      }

      // Extra attraction between siblings (2x strength)
      for (const [aid, bid] of siblings) {
        const a = pos.get(aid)
        const b = pos.get(bid)
        if (!a || !b) continue
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
        const force = (dist * dist) / (k * 0.5)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        disp.get(aid)!.x += fx
        disp.get(aid)!.y += fy
        disp.get(bid)!.x -= fx
        disp.get(bid)!.y -= fy
      }

      for (const n of nodes) {
        const p = pos.get(n.id)!
        const d = disp.get(n.id)!
        const dlen = Math.sqrt(d.x * d.x + d.y * d.y) || 0.01
        const step = Math.min(dlen, temp)
        p.x = Math.max(80, Math.min(CANVAS_W - 80, p.x + (d.x / dlen) * step))
        p.y = Math.max(80, Math.min(CANVAS_H - 80, p.y + (d.y / dlen) * step))
      }

      temp = Math.max(1, temp * 0.97)
    }

    for (let pass = 0; pass < 60; pass++) {
      let moved = false
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = pos.get(nodes[i].id)!
          const b = pos.get(nodes[j].id)!
          const dx = b.x - a.x
          const dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
          if (dist < minDist) {
            const push = (minDist - dist) / 2 + 0.5
            const ux = dx / dist
            const uy = dy / dist
            a.x = Math.max(80, Math.min(CANVAS_W - 80, a.x - ux * push))
            a.y = Math.max(80, Math.min(CANVAS_H - 80, a.y - uy * push))
            b.x = Math.max(80, Math.min(CANVAS_W - 80, b.x + ux * push))
            b.y = Math.max(80, Math.min(CANVAS_H - 80, b.y + uy * push))
            moved = true
          }
        }
      }
      if (!moved) break
    }

    return { positions: pos, sizes }
  }
}
