import type { GeoViewport } from '../../core/maps/GeoMap'

export const COUNTRY_COLORS: Record<string, string> = {
  'Portugal':              '#E85D04',
  'Castile & Aragon':      '#F4A261',
  'Ottoman Empire':        '#DC2F02',
  'Republic of Venice':    '#9B5DE5',
  'Florence':              '#1982C4',
  'France':                '#4B7BEC',
  'England':               '#A23B72',
  'Ming China':            '#FF6B6B',
  'Timurid Empire':        '#FFD166',
  'Joseon Korea':          '#06D6A0',
  'Muromachi Japan':       '#EF476F',
  'Delhi Sultanate':       '#F77F00',
  'Songhai Empire':        '#2DC653',
  'Mali Empire':           '#80B918',
  'Ethiopian Empire':      '#FCBF49',
  'Swahili City-States':   '#00B4D8',
  'Aztec Triple Alliance': '#C77DFF',
  'Inca Empire':           '#E040FB',
  'Maya City-States':      '#3A0CA3',
  'Māori New Zealand':     '#4CC9F0',
}

export const CONTINENT_HEX: Record<string, string> = {
  'Europe':        '#6495ED',
  'Asia':          '#FFA500',
  'Middle East':   '#DC503C',
  'Africa':        '#32B464',
  'North America': '#B464DC',
  'South America': '#E040A0',
  'Oceania':       '#00C8C8',
}

export const ARC_COLORS: Record<string, string> = {
  'Trade Route': '#FFA040',
  'Trade':       '#FFA040',
  'Exploration': '#40CFFF',
  'Military':    '#FF5050',
  'Diplomacy':   '#A0FF80',
}

export const CONTINENT_VIEWPORTS: Record<string, GeoViewport> = {
  'World':         { latitude: 20,  longitude: 0,    zoom: 2 },
  'Europe':        { latitude: 52,  longitude: 15,   zoom: 4 },
  'Asia':          { latitude: 35,  longitude: 95,   zoom: 3 },
  'Middle East':   { latitude: 30,  longitude: 42,   zoom: 4 },
  'Africa':        { latitude: 5,   longitude: 20,   zoom: 3 },
  'North America': { latitude: 23,  longitude: -100, zoom: 3 },
  'South America': { latitude: -15, longitude: -60,  zoom: 3 },
  'Oceania':       { latitude: -25, longitude: 140,  zoom: 3 },
}

export const WORLD_VIEWPORT = CONTINENT_VIEWPORTS['World']

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
