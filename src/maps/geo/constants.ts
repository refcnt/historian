import type { GeoLocation } from './models'

export const WORLD_VIEWPORT: GeoLocation = { lat: 20, lon: 0, zoom: 2 }

export const MIDDLE_EAST_ISO = new Set([
  'TUR','SYR','IRQ','IRN','SAU','YEM','OMN','ARE','QAT','BHR','KWT',
  'JOR','ISR','PSE','LBN','EGY','SDN','GEO','ARM','AZE',
])

export const NE_TO_OURS: Record<string, string> = {
  'Europe':        'Europe',
  'Asia':          'Asia',
  'Africa':        'Africa',
  'North America': 'North America',
  'South America': 'South America',
  'Oceania':       'Oceania',
}
