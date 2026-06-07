/**
 * Generic MapLibre map. Knows nothing about specific explorers.
 * Territory features expect: _id, _color, _hasChildren
 * Connection features expect: _id, _color, _name, _type, _desc
 */
import { useRef, useState, useCallback, useEffect } from 'react'
import Map, { Source, Layer, Marker, MapRef, MapLayerMouseEvent } from 'react-map-gl/maplibre'
import type { StyleSpecification, FillLayerSpecification, LineLayerSpecification, FilterSpecification } from 'maplibre-gl'

export interface GeoViewport {
  latitude: number
  longitude: number
  zoom: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GeoData = { type: 'FeatureCollection'; features: any[] }

export interface MapLabel {
  lat: number
  lon: number
  text: string
  fontSize?: number
  color?: string
  bold?: boolean
}

export interface ConnectionLayer {
  id: string
  filter: FilterSpecification
  paint: LineLayerSpecification['paint']
}

interface GeoMapProps {
  geoData: GeoData
  connectionsData?: GeoData
  connectionLayers?: ConnectionLayer[]   // typed layers from connectionsData
  labels?: MapLabel[]
  connectionLabels?: MapLabel[]
  viewport: GeoViewport
  showBorders: boolean
  minZoom?: number
  maxZoom?: number
  onHover: (id: string | null, props: Record<string, unknown> | null) => void
  onClick: (id: string, props: Record<string, unknown>) => void
}

const DARK_STYLE: StyleSpecification = {
  version: 8, name: 'dark', sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#0a0e1a' } }],
}

export default function GeoMap({
  geoData, connectionsData, connectionLayers, labels = [], connectionLabels = [],
  viewport, showBorders, minZoom = 1.5, maxZoom = 7, onHover, onClick,
}: GeoMapProps) {
  const mapRef = useRef<MapRef>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [cursor, setCursor] = useState('default')
  const [connTooltip, setConnTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  const prevVp = useRef(viewport)
  useEffect(() => {
    const v = viewport
    if (
      prevVp.current.latitude === v.latitude &&
      prevVp.current.longitude === v.longitude &&
      prevVp.current.zoom === v.zoom
    ) return
    prevVp.current = v
    mapRef.current?.getMap()?.flyTo({
      center: [v.longitude, v.latitude],
      zoom: v.zoom,
      duration: 1200,
      essential: true,
    })
  }, [viewport])

  const connLayerIds = connectionLayers
    ? new Set(connectionLayers.map(l => l.id))
    : new Set(['conns'])

  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const features = e.features ?? []

    const conn = features.find(f => connLayerIds.has(f.layer?.id ?? ''))
    if (conn) {
      const p = conn.properties ?? {}
      const parts = [p._name, p._type && `(${p._type})`, p._desc].filter(Boolean)
      setConnTooltip({ x: e.point.x + 14, y: e.point.y - 10, text: parts.join(' — ') })
      setHoveredId(null)
      onHover((p._id as string) || null, p._id ? p : null)
      setCursor('default')
      return
    }
    setConnTooltip(null)

    const terr = features.find(f => f.layer?.id === 'fill')
    if (!terr) {
      setHoveredId(null)
      onHover(null, null)
      setCursor('default')
      return
    }

    const p = terr.properties ?? {}
    const id = p._id as string | null
    setHoveredId(id)
    onHover(id, p)
    setCursor(p._hasChildren ? 'pointer' : 'default')
  }, [onHover, connLayerIds])

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null)
    onHover(null, null)
    setConnTooltip(null)
    setCursor('default')
  }, [onHover])

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const terr = (e.features ?? []).find(f => f.layer?.id === 'fill')
    if (!terr) return
    const p = terr.properties ?? {}
    if (p._id) onClick(p._id as string, p)
  }, [onClick])

  const fillPaint: FillLayerSpecification['paint'] = {
    'fill-color': ['coalesce', ['get', '_color'], '#1a1a2e'],
    'fill-opacity': [
      'case',
      ['==', ['coalesce', ['get', '_color'], ''], '#1a1a2e'], 0.15,
      0.65,
    ],
  }

  const highlightPaint: FillLayerSpecification['paint'] = {
    'fill-color': 'rgba(255,255,255,0.22)',
    'fill-opacity': 1,
  }

  const borderPaint: LineLayerSpecification['paint'] = {
    'line-color': 'rgba(255,255,255,0.35)',
    'line-width': 0.7,
    'line-opacity': showBorders ? 0.55 : 0,
  }

  const fallbackConnPaint: LineLayerSpecification['paint'] = {
    'line-color': ['coalesce', ['get', '_color'], '#AAAAAA'],
    'line-width': 2,
    'line-opacity': 0.7,
  }

  const allConnLayerIds = connectionLayers
    ? connectionLayers.map(l => l.id)
    : (connectionsData ? ['conns'] : [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Map
        ref={mapRef}
        initialViewState={{ latitude: viewport.latitude, longitude: viewport.longitude, zoom: viewport.zoom }}
        minZoom={minZoom}
        maxZoom={maxZoom}
        mapStyle={DARK_STYLE}
        style={{ width: '100%', height: '100%' }}
        cursor={cursor}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        interactiveLayerIds={['fill', ...allConnLayerIds]}
      >
        {connectionsData && (
          <Source id="connections" type="geojson" data={connectionsData}>
            {connectionLayers
              ? connectionLayers.map(l => (
                  <Layer key={l.id} id={l.id} type="line" paint={l.paint} filter={l.filter} />
                ))
              : <Layer id="conns" type="line" paint={fallbackConnPaint} />
            }
          </Source>
        )}

        <Source id="territories" type="geojson" data={geoData}>
          <Layer id="fill" type="fill" paint={fillPaint} />
          <Layer
            id="highlight"
            type="fill"
            paint={highlightPaint}
            filter={hoveredId ? ['==', ['get', '_id'], hoveredId] : ['literal', false]}
          />
          <Layer id="border" type="line" paint={borderPaint} />
        </Source>

        {labels.map((lbl, i) => (
          <Marker key={i} latitude={lbl.lat} longitude={lbl.lon} anchor="center">
            <div style={{
              color: lbl.color ?? 'white',
              fontWeight: lbl.bold !== false ? 'bold' : 'normal',
              fontSize: lbl.fontSize ?? 12,
              textShadow: '1px 1px 3px #000, -1px -1px 3px #000',
              pointerEvents: 'none', whiteSpace: 'nowrap',
            }}>
              {lbl.text}
            </div>
          </Marker>
        ))}

        {connectionLabels.map((lbl, i) => (
          <Marker key={`cl-${i}`} latitude={lbl.lat} longitude={lbl.lon} anchor="center">
            <div style={{
              color: lbl.color ?? '#ccc',
              fontWeight: 'normal',
              fontSize: lbl.fontSize ?? 10,
              textShadow: '1px 1px 2px #000, -1px -1px 2px #000',
              pointerEvents: 'none', whiteSpace: 'nowrap',
              background: 'rgba(0,0,0,0.45)',
              padding: '1px 5px',
              borderRadius: 3,
              letterSpacing: '0.3px',
            }}>
              {lbl.text}
            </div>
          </Marker>
        ))}
      </Map>

      {connTooltip && (
        <div style={{
          position: 'absolute', left: connTooltip.x, top: connTooltip.y,
          background: '#1a1a2e', color: '#eee', padding: '6px 10px',
          borderRadius: 4, fontSize: 12, border: '1px solid #555',
          maxWidth: '28vw', wordWrap: 'break-word',
          pointerEvents: 'none', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,.6)',
        }}>
          {connTooltip.text}
        </div>
      )}
    </div>
  )
}
