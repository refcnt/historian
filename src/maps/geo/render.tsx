import { useMemo, useCallback } from 'react'
import type { MapRendererProps } from '@common/models'
import type { Node, Connection } from '@common/models'
import type { GeoLocation } from './models'
import GeoMap from './geo_map'
import type { GeoData, MapLabel } from './geo_map'
import { WORLD_VIEWPORT, MIDDLE_EAST_ISO, NE_TO_OURS } from './constants'
import worldGeo from './world_110m.json'

function geoLoc(node: Node): GeoLocation | null {
  return node.location ?? null
}

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

  const ctrl: [number, number] = [midLon + px * lift, midLat + py * lift]
  const pts: [number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const u = 1 - t
    pts.push([
      u * u * lon1 + 2 * u * t * ctrl[0] + t * t * lon2,
      u * u * lat1 + 2 * u * t * ctrl[1] + t * t * lat2,
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

export default function GeoRenderer({
  nodes, connections, focusedNode, onHover, onSelect,
}: MapRendererProps) {
  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes])
  const connMap = useMemo(() => new Map(connections.map((c: Connection) => [c.id, c])), [connections])

  const viewport = useMemo((): GeoLocation => {
    const focused = focusedNode && geoLoc(focusedNode)
    if (focused) return focused
    return WORLD_VIEWPORT
  }, [focusedNode])

  const geoData: GeoData = useMemo(() => {
    const hasNoParent = nodes.every(n => !n.parent)
    if (hasNoParent) {
      const byName = new Map(nodes.map(n => [n.name, n]))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const features = (worldGeo.features as Record<string, any>[]).map(f => {
        const props = (f.properties ?? {}) as Record<string, string>
        const iso = props.ISO_A3 ?? ''
        const name = MIDDLE_EAST_ISO.has(iso) ? 'Middle East' : (NE_TO_OURS[props.CONTINENT ?? ''] ?? '')
        const node = byName.get(name)
        return { ...f, properties: { ...props, _id: node?.id ?? null, _color: node?.color ?? '#1a1a2e', _hasChildren: node ? node.children.length > 0 : false } }
      })
      return { type: 'FeatureCollection', features }
    }
    const isoMap = new Map<string, Node>()
    for (const node of nodes) {
      const loc = geoLoc(node)
      if (loc?.iso) for (const iso of loc.iso) isoMap.set(iso, node)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const features = (worldGeo.features as Record<string, any>[]).map(f => {
      const props = (f.properties ?? {}) as Record<string, string>
      const node = isoMap.get(props.ISO_A3 ?? '')
      return { ...f, properties: { ...props, _id: node?.id ?? null, _color: node?.color ?? '#1a1a2e', _hasChildren: false } }
    })
    return { type: 'FeatureCollection', features }
  }, [nodes])

  const connectionsData: GeoData | undefined = useMemo(() => {
    if (connections.length === 0) return undefined
    const features = connections.flatMap(c => {
      const src = geoLoc(c.from)
      const tgt = geoLoc(c.to)
      if (!src || !tgt) return []
      return [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: computeArc([src.lon, src.lat], [tgt.lon, tgt.lat]) },
        properties: { _id: c.id, _name: c.name, _color: '#888888' },
      }]
    })
    return { type: 'FeatureCollection', features }
  }, [connections])

  const connectionLabels: MapLabel[] = useMemo(() => (
    connections.flatMap(c => {
      const src = geoLoc(c.from)
      const tgt = geoLoc(c.to)
      if (!src || !tgt) return []
      const [lon, lat] = arcMidpoint([src.lon, src.lat], [tgt.lon, tgt.lat])
      return [{ lat, lon, text: c.name, fontSize: 10, color: '#ccc', bold: false }]
    })
  ), [connections])

  const labels: MapLabel[] = useMemo(() => (
    nodes.flatMap(n => {
      const loc = geoLoc(n)
      if (!loc) return []
      return [{ lat: loc.lat, lon: loc.lon, text: n.name, fontSize: 14 }]
    })
  ), [nodes])

  const handleHover = useCallback((id: string | null) => {
    if (!id) { onHover(null); return }
    onHover(nodeMap.get(id) ?? connMap.get(id) ?? null)
  }, [nodeMap, connMap, onHover])

  const handleClick = useCallback((id: string) => {
    const node = nodeMap.get(id)
    if (node) onSelect(node)
  }, [nodeMap, onSelect])

  return (
    <GeoMap
      geoData={geoData}
      connectionsData={connectionsData}
      labels={labels}
      connectionLabels={connectionLabels}
      viewport={{ latitude: viewport.lat, longitude: viewport.lon, zoom: viewport.zoom }}
      showBorders={false}
      minZoom={1.5}
      maxZoom={7}
      onHover={handleHover}
      onClick={handleClick}
    />
  )
}
