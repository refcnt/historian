import { useMemo, useCallback } from 'react'
import type { LineLayerSpecification, FilterSpecification } from 'maplibre-gl'
import type { RendererProps } from '../../../core/plugin'
import type { Node, NodeConnection, GeographicLocation } from '../../../core/models'
import GeoMap from '../../../core/maps/GeoMap'
import type { GeoData, GeoViewport, MapLabel, ConnectionLayer } from '../../../core/maps/GeoMap'
import type { Country } from '../models/Country'
import {
  CONTINENT_HEX, COUNTRY_COLORS, ARC_COLORS,
  MIDDLE_EAST_ISO, NE_TO_OURS, WORLD_VIEWPORT,
} from '../constants'

interface Props extends RendererProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  worldGeo: any
}

// ── Bezier arc ─────────────────────────────────────────────────────────────
function computeArc(from: [number, number], to: [number, number], segments = 50): [number, number][] {
  const [lon1, lat1] = from
  const [lon2, lat2] = to
  const midLon = (lon1 + lon2) / 2
  const midLat = (lat1 + lat2) / 2
  const dLon = lon2 - lon1
  const dLat = lat2 - lat1
  const dist = Math.sqrt(dLon * dLon + dLat * dLat)

  if (dist < 0.001) return [from, to]

  const lift = Math.min(dist * 0.28, 18)
  let px = -dLat / dist
  let py = dLon / dist
  if (py < 0 || (py === 0 && px < 0)) { px = -px; py = -py }

  const ctrlLon = midLon + px * lift
  const ctrlLat = midLat + py * lift

  const pts: [number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const u = 1 - t
    pts.push([
      u * u * lon1 + 2 * u * t * ctrlLon + t * t * lon2,
      u * u * lat1 + 2 * u * t * ctrlLat + t * t * lat2,
    ])
  }
  return pts
}

function arcMidpoint(from: [number, number], to: [number, number]): [number, number] {
  const [lon1, lat1] = from
  const [lon2, lat2] = to
  const midLon = (lon1 + lon2) / 2
  const midLat = (lat1 + lat2) / 2
  const dLon = lon2 - lon1
  const dLat = lat2 - lat1
  const dist = Math.sqrt(dLon * dLon + dLat * dLat)
  if (dist < 0.001) return [midLon, midLat]

  const lift = Math.min(dist * 0.28, 18)
  let px = -dLat / dist
  let py = dLon / dist
  if (py < 0 || (py === 0 && px < 0)) { px = -px; py = -py }

  return [
    0.25 * lon1 + 0.5 * (midLon + px * lift) + 0.25 * lon2,
    0.25 * lat1 + 0.5 * (midLat + py * lift) + 0.25 * lat2,
  ]
}

// ── Per-type paint ─────────────────────────────────────────────────────────
const TYPE_PAINT: Record<string, LineLayerSpecification['paint']> = {
  'Trade Route': { 'line-color': ARC_COLORS['Trade Route'], 'line-width': 2,   'line-opacity': 0.8,  'line-dasharray': [6, 3] },
  'Trade':       { 'line-color': ARC_COLORS['Trade'],       'line-width': 2,   'line-opacity': 0.8,  'line-dasharray': [6, 3] },
  'Exploration': { 'line-color': ARC_COLORS['Exploration'], 'line-width': 1.5, 'line-opacity': 0.8,  'line-dasharray': [2, 5] },
  'Military':    { 'line-color': ARC_COLORS['Military'],    'line-width': 2.5, 'line-opacity': 0.85 },
  'Diplomacy':   { 'line-color': ARC_COLORS['Diplomacy'],   'line-width': 1.5, 'line-opacity': 0.75, 'line-dasharray': [9, 4] },
}
const DEFAULT_PAINT: LineLayerSpecification['paint'] = { 'line-color': '#AAAAAA', 'line-width': 1.5, 'line-opacity': 0.65 }

function getArcType(c: NodeConnection): string {
  return c.category ?? ''
}

// ── Component ──────────────────────────────────────────────────────────────
export default function MapRenderer({
  nodes, connections, viewDepth, drillPath, focusedNode,
  onHover, onSelect, pluginOptions, worldGeo,
}: Props) {
  const nodeMap = useMemo(() => {
    const m = new Map<string, Node>()
    for (const n of nodes) m.set(n.id, n)
    return m
  }, [nodes])

  const connMap = useMemo(() => {
    const m = new Map<string, NodeConnection>()
    for (const c of connections) m.set(c.id, c)
    return m
  }, [connections])

  const viewport: GeoViewport = useMemo(() => {
    if (focusedNode) {
      const loc = (focusedNode.location as GeographicLocation).resolveForDepth(viewDepth)
      return { latitude: loc.lat, longitude: loc.lon, zoom: loc.defaultZoom }
    }
    if (drillPath.length > 0) {
      const loc = drillPath[drillPath.length - 1].location as GeographicLocation
      return { latitude: loc.lat, longitude: loc.lon, zoom: loc.defaultZoom }
    }
    return WORLD_VIEWPORT
  }, [focusedNode, drillPath, viewDepth])

  const geoData: GeoData = useMemo(() => {
    if (viewDepth === 0) {
      const byName = new Map<string, Node>()
      for (const n of nodes) byName.set(n.name, n)
      const features = (worldGeo.features as Record<string, unknown>[]).map(f => {
        const props = (f.properties ?? {}) as Record<string, string>
        const iso = props.ISO_A3 ?? ''
        const ourCont = MIDDLE_EAST_ISO.has(iso) ? 'Middle East' : (NE_TO_OURS[props.CONTINENT ?? ''] ?? '')
        const node = byName.get(ourCont)
        return { ...f, properties: { ...props, _id: node?.id ?? null, _color: CONTINENT_HEX[ourCont] ?? '#1a1a2e', _hasChildren: node ? node.children.length > 0 : false } }
      })
      return { type: 'FeatureCollection', features }
    }
    const isoMap = new Map<string, Node>()
    for (const node of nodes) {
      const country = node as unknown as Country
      if (country.territoryISO) for (const iso of country.territoryISO) isoMap.set(iso, node)
    }
    const features = (worldGeo.features as Record<string, unknown>[]).map(f => {
      const props = (f.properties ?? {}) as Record<string, string>
      const node = isoMap.get(props.ISO_A3 ?? '')
      return { ...f, properties: { ...props, _id: node?.id ?? null, _color: node ? (COUNTRY_COLORS[node.name] ?? '#888888') : '#1a1a2e', _hasChildren: false } }
    })
    return { type: 'FeatureCollection', features }
  }, [nodes, viewDepth, worldGeo])

  const connectionsData: GeoData | undefined = useMemo(() => {
    if (connections.length === 0) return undefined
    const features = connections.map(c => {
      const srcLoc = c.source.location as GeographicLocation
      const tgtLoc = c.target.location as GeographicLocation
      const arcType = getArcType(c)
      return {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: computeArc([srcLoc.lon, srcLoc.lat], [tgtLoc.lon, tgtLoc.lat]) },
        properties: { _id: c.id, _name: c.name, _type: arcType, _desc: c.description },
      }
    })
    return { type: 'FeatureCollection', features }
  }, [connections])

  const connectionLayers: ConnectionLayer[] | undefined = useMemo(() => {
    if (!connectionsData) return undefined
    const types = [...new Set(connections.map(getArcType).filter(Boolean))]
    return types.map(type => ({
      id: `conn-${type}`,
      filter: ['==', ['get', '_type'], type] as FilterSpecification,
      paint: TYPE_PAINT[type] ?? DEFAULT_PAINT,
    }))
  }, [connections, connectionsData])

  const connectionLabels: MapLabel[] = useMemo(() => {
    if (!pluginOptions?.showConnectionLabels) return []
    return connections.map(c => {
      const srcLoc = c.source.location as GeographicLocation
      const tgtLoc = c.target.location as GeographicLocation
      const [lon, lat] = arcMidpoint([srcLoc.lon, srcLoc.lat], [tgtLoc.lon, tgtLoc.lat])
      const arcType = getArcType(c)
      return { lat, lon, text: c.name, fontSize: 10, color: ARC_COLORS[arcType] ?? '#ccc', bold: false }
    })
  }, [connections, pluginOptions?.showConnectionLabels])

  const labels: MapLabel[] = useMemo(() => (
    nodes.map(n => {
      const loc = n.location as GeographicLocation
      return { lat: loc.lat, lon: loc.lon, text: n.label, fontSize: viewDepth === 0 ? 14 : 11 }
    })
  ), [nodes, viewDepth])

  const handleHover = useCallback((id: string | null) => {
    if (!id) { onHover(null); return }
    const node = nodeMap.get(id)
    if (node) { onHover(node); return }
    const conn = connMap.get(id)
    if (conn) { onHover(conn); return }
    onHover(null)
  }, [nodeMap, connMap, onHover])

  const handleClick = useCallback((id: string) => {
    const node = nodeMap.get(id)
    if (node) onSelect(node)
  }, [nodeMap, onSelect])

  return (
    <GeoMap
      geoData={geoData}
      connectionsData={connectionsData}
      connectionLayers={connectionLayers}
      connectionLabels={connectionLabels}
      labels={labels}
      viewport={viewport}
      showBorders={viewDepth > 0}
      minZoom={1.5}
      maxZoom={7}
      onHover={(id) => handleHover(id)}
      onClick={handleClick}
    />
  )
}
