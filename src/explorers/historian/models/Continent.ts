import type { Node } from '../../../core/models'
import type { GeographicLocation } from '../../../core/models'

export interface Continent extends Node {
  location: GeographicLocation
  continentId: string
}
