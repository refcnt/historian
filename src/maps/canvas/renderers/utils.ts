import { Position, Size } from '@common/layout/layout'

export { Position, Size }

export function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

export function edgePt(cx: number, cy: number, d: Size, tx: number, ty: number): Position {
  const dx = tx - cx, dy = ty - cy
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 1) return new Position(cx, cy)
  const ux = dx / len, uy = dy / len
  const t = Math.min(
    ux ? (d.w / 2 + 8) / Math.abs(ux) : Infinity,
    uy ? (d.h / 2 + 8) / Math.abs(uy) : Infinity,
  )
  return new Position(cx + ux * t, cy + uy * t)
}

function curveParams(x1: number, y1: number, x2: number, y2: number): { qx: number; qy: number } {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy) || 0.01
  const lift = Math.min(len * 0.22, 60)
  let px = -dy / len, py = dx / len
  if (py < 0 || (py === 0 && px < 0)) { px = -px; py = -py }
  return { qx: mx + px * lift, qy: my + py * lift }
}

// SVG path string for a quadratic bezier
export function curvePath(x1: number, y1: number, x2: number, y2: number): string {
  const { qx, qy } = curveParams(x1, y1, x2, y2)
  return `M ${x1} ${y1} Q ${qx} ${qy} ${x2} ${y2}`
}

// Control point for use with Canvas/Pixi quadraticCurveTo
export function curveCtrl(x1: number, y1: number, x2: number, y2: number): [number, number] {
  const { qx, qy } = curveParams(x1, y1, x2, y2)
  return [qx, qy]
}

// Midpoint on the bezier curve (t=0.5), for label placement
export function curveMid(x1: number, y1: number, x2: number, y2: number): [number, number] {
  const { qx, qy } = curveParams(x1, y1, x2, y2)
  return [0.25 * x1 + 0.5 * qx + 0.25 * x2, 0.25 * y1 + 0.5 * qy + 0.25 * y2]
}
