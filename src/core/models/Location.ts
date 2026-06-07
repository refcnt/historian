export interface Location {
  depth: number
  parent: Location | null
  resolveForDepth(viewDepth: number): Location
}
