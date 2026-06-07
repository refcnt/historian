import { makeGeoLocation } from '../../../core/models'
import type { Node, NodeConnection, InfoBlock } from '../../../core/models'
import type { Continent } from '../models/Continent'
import type { Country } from '../models/Country'
import {
  CONTINENT_VIEWPORTS, CONTINENT_HEX, COUNTRY_COLORS, ARC_COLORS,
} from '../constants'

// ── Raw JSON shapes ────────────────────────────────────────────────────
interface RawContinent {
  id: string; name: string; lat: number; lon: number
  summary: string; key_events: string; major_powers: string
}
interface RawCountry {
  name: string; continent: string; lat: number; lon: number
  type: string; population_est: string; territory_iso: string[]
  description: string
}
interface RawConnection {
  name: string; type: string; description: string
  from_lat: number; from_lon: number; to_lat: number; to_lon: number
}
interface RawData {
  continents: RawContinent[]
  countries: RawCountry[]
  connections_l1: RawConnection[]
  connections_l2: RawConnection[]
}

// ── Loaded result ──────────────────────────────────────────────────────
export interface HistorianData {
  rootNodes: Node[]
  connectionsL1: NodeConnection[]
  connectionsL2: NodeConnection[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  worldGeo: any
}

// ── InfoBlock builders ─────────────────────────────────────────────────
function continentInfoBlock(c: RawContinent): InfoBlock {
  return {
    tabs: [
      { title: 'Summary',    content: { type: 'text', text: c.summary } },
      { title: 'Key Events', content: { type: 'list', items: c.key_events.split(' | ') } },
      { title: 'Powers',     content: { type: 'list', items: c.major_powers.split(' · ') } },
    ],
  }
}

function countryInfoBlock(c: RawCountry): InfoBlock {
  return {
    tabs: [
      { title: 'History', content: { type: 'text', text: c.description } },
      { title: 'Facts',   content: { type: 'table', headers: [], rows: [
        ['Type',       c.type],
        ['Population', c.population_est],
        ['Region',     c.continent],
      ]}},
    ],
  }
}

function connectionInfoBlock(c: RawConnection): InfoBlock {
  return {
    tabs: [{ title: 'Info', content: { type: 'text', text: `${c.type}: ${c.description}` } }],
  }
}

// ── Node builders ──────────────────────────────────────────────────────
function buildContinentNode(c: RawContinent): Continent {
  const vp = CONTINENT_VIEWPORTS[c.name] ?? CONTINENT_VIEWPORTS['World']
  const loc = makeGeoLocation(0, c.lat, c.lon, vp.zoom)
  return {
    id: `continent:${c.id}`,
    name: c.name,
    label: c.name,
    description: c.summary.slice(0, 140) + '…',
    infoBlock: continentInfoBlock(c),
    children: [],
    location: loc,
    continentId: c.id,
  }
}

function buildCountryNode(c: RawCountry, parentLoc: ReturnType<typeof makeGeoLocation>): Country {
  const loc = makeGeoLocation(1, c.lat, c.lon, 5, parentLoc)
  return {
    id: `country:${c.name}`,
    name: c.name,
    label: c.name,
    description: c.description.slice(0, 140) + '…',
    infoBlock: countryInfoBlock(c),
    children: [],
    location: loc,
    continentName: c.continent,
    entityType: c.type,
    population: c.population_est,
    territoryISO: c.territory_iso,
  }
}

// Connection endpoints are geographic positions, not real nodes.
// We represent them as minimal nodes so they satisfy the type.
function endpointNode(id: string, lat: number, lon: number, depth: number): Node {
  return {
    id, name: id, label: '', description: '',
    infoBlock: { tabs: [] },
    children: [],
    location: makeGeoLocation(depth, lat, lon, 3),
  }
}

function buildConnection(c: RawConnection, depth: number): NodeConnection {
  return {
    id: `conn:${c.name}:${depth}`,
    name: c.name,
    label: c.name,
    description: c.description,
    infoBlock: connectionInfoBlock(c),
    source: endpointNode(`${c.name}-src`, c.from_lat, c.from_lon, depth),
    target: endpointNode(`${c.name}-tgt`, c.to_lat, c.to_lon, depth),
    childrenDetailedConnections: [],
    category: c.type,
    categoryColor: ARC_COLORS[c.type] ?? '#888888',
  }
}

// ── Public loader ──────────────────────────────────────────────────────
export async function loadHistorianData(): Promise<HistorianData> {
  const [rawData, worldGeo] = await Promise.all([
    fetch('/history_data.json').then(r => r.json()) as Promise<RawData>,
    fetch('/world_110m.geojson').then(r => r.json()),
  ])

  // Build continent nodes
  const continentById: Record<string, Continent> = {}
  const rootNodes: Node[] = rawData.continents.map(c => {
    const node = buildContinentNode(c)
    continentById[c.name] = node
    return node
  })

  // Build country nodes and attach to parent continents
  for (const raw of rawData.countries) {
    const parent = continentById[raw.continent]
    if (!parent) continue
    const country = buildCountryNode(raw, parent.location)
    parent.children.push(country)
  }

  const connectionsL1 = rawData.connections_l1.map(c => buildConnection(c, 0))
  const connectionsL2 = rawData.connections_l2.map(c => buildConnection(c, 1))

  // Attach L2 connections as children of L1 connections so the model is consistent
  // (historian doesn't have a 1:1 mapping, so all L2 go on the first L1 connection as a pool)
  if (connectionsL1.length > 0) {
    connectionsL1[0].childrenDetailedConnections = connectionsL2
  }

  // Pre-compute color lookup for the renderer
  ;(window as unknown as Record<string, unknown>)['__HISTORIAN_COLORS__'] = { CONTINENT_HEX, COUNTRY_COLORS, ARC_COLORS }

  return { rootNodes, connectionsL1, connectionsL2, worldGeo }
}
