import type { Location } from './Location'

export interface CanvasLocation extends Location {
  x: number
  y: number
  parent: CanvasLocation | null
  resolveForDepth(viewDepth: number): CanvasLocation
}

export function makeCanvasLocation(
  depth: number,
  x: number,
  y: number,
  parent: CanvasLocation | null = null,
): CanvasLocation {
  return {
    depth, x, y, parent,
    resolveForDepth(viewDepth) {
      if (viewDepth >= this.depth || !this.parent) return this
      return this.parent.resolveForDepth(viewDepth)
    },
  }
}
