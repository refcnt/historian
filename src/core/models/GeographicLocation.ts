import type { Location } from './Location'

export interface GeographicLocation extends Location {
  lat: number
  lon: number
  defaultZoom: number
  parent: GeographicLocation | null
  resolveForDepth(viewDepth: number): GeographicLocation
}

export function makeGeoLocation(
  depth: number,
  lat: number,
  lon: number,
  defaultZoom: number,
  parent: GeographicLocation | null = null,
): GeographicLocation {
  return {
    depth, lat, lon, defaultZoom, parent,
    resolveForDepth(viewDepth) {
      if (viewDepth >= this.depth || !this.parent) return this
      return this.parent.resolveForDepth(viewDepth)
    },
  }
}
