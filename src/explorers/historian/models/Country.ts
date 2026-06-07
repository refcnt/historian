import type { Node } from '../../../core/models'
import type { GeographicLocation } from '../../../core/models'

export interface Country extends Node {
  location: GeographicLocation
  continentName: string
  entityType: string      // 'Kingdom', 'Empire', 'Republic', …
  population: string
  territoryISO: string[]  // ISO_A3 codes that belong to this entity on the world map
}
