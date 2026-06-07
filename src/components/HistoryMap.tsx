import { useRef, useEffect, useState, useCallback } from 'react'
import Map, { Source, Layer, MapRef, MapLayerMouseEvent } from 'react-map-gl/maplibre'
import type { StyleSpecification, FillLayerSpecification, LineLayerSpecification } from 'maplibre-gl'
import { CONTINENT_VIEWPORTS, CONTINENT_NAMES } from '../constants'
import type { HoveredEntity, GeoData } from '../types'

const DARK_STYLE: StyleSpecification = {
  version: 8,
  name: 'dark',
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#0a0e1a' } }],
}

interface Props {
  level: 1 | 2
  continent: string
  geoL1: GeoData | null
  geoL2: GeoData | null
  connectionsL1: GeoData | null
  connectionsL2: GeoData | null
  onContinentClick: (name: string) => void
  onHover: (entity: HoveredEntity | null) => void
}

export default function HistoryMap({
  level, continent, geoL1, geoL2, connectionsL1, connectionsL2,
  onContinentClick, onHover,
}: Props) {
  const mapRef = useRef<MapRef>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const hoveredIdRef = useRef<number | null>(null) // shadow for callbacks without stale closure
  const [cursor, setCursor] = useState('default')
  const [connTooltip, setConnTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  const activeGeo = level === 1 ? geoL1 : geoL2
  const activeConns = level === 1 ? connectionsL1 : connectionsL2

  // Fly to viewport when continent / level changes
  useEffect(() => {
    const vp = CONTINENT_VIEWPORTS[continent] ?? CONTINENT_VIEWPORTS['World']
    mapRef.current?.getMap()?.flyTo({
      center: [vp.longitude, vp.latitude],
      zoom: vp.zoom,
      duration: 1200,
      essential: true,
    })
  }, [continent, level])

  // Clear hover when switching levels
  useEffect(() => {
    hoveredIdRef.current = null
    setHoveredId(null)
    onHover(null)
    setConnTooltip(null)
  }, [level, onHover])

  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const features = e.features ?? []

    // Connection line hover takes priority — show small cursor tooltip
    const conn = features.find(f => f.layer?.id === 'conns')
    if (conn) {
      const p = conn.properties ?? {}
      setConnTooltip({
        x: e.point.x + 14,
        y: e.point.y - 10,
        text: `${p.name} (${p.type}) — ${p.description}`,
      })
      hoveredIdRef.current = null
      onHover(null)
      setCursor('default')
      return
    }
    setConnTooltip(null)

    // Territory hover
    const terr = features.find(f => f.layer?.id === 'fill')
    if (!terr) {
      hoveredIdRef.current = null
      onHover(null)
      setCursor('default')
      return
    }

    const newId = typeof terr.id === 'number' ? terr.id : null
    if (newId !== hoveredIdRef.current) {
      hoveredIdRef.current = newId
      setHoveredId(newId)
    }
    const p = terr.properties ?? {}

    if (level === 1 && p._continent) {
      setCursor('pointer')
      onHover({ name: p._continent, desc: p._summary ?? '', tags: [p._powers].filter(Boolean) })
    } else if (level === 2 && p._name) {
      setCursor('default')
      onHover({ name: p._name, desc: p._desc ?? '', tags: [p._type, p._pop].filter(Boolean) })
    } else {
      onHover(null)
      setCursor('default')
    }
  }, [level, onHover])

  const handleMouseLeave = useCallback(() => {
    hoveredIdRef.current = null
    setHoveredId(null)
    onHover(null)
    setConnTooltip(null)
    setCursor('default')
  }, [onHover])

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    if (level !== 1) return
    const terr = (e.features ?? []).find(f => f.layer?.id === 'fill')
    if (!terr) return
    const cont = terr.properties?._continent
    if (cont && CONTINENT_NAMES.includes(cont)) {
      onContinentClick(cont)
    }
  }, [level, onContinentClick])

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
    'line-opacity': level === 1 ? 0 : 0.55,
  }

  const connPaint: LineLayerSpecification['paint'] = {
    'line-color': ['coalesce', ['get', 'color'], '#AAAAAA'],
    'line-width': 2,
    'line-opacity': 0.65,
  }

  if (!activeGeo) {
    return <div style={{ width: '100%', height: '100%', background: '#0a0e1a' }} />
  }

  const initVp = CONTINENT_VIEWPORTS['World']

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Map
        ref={mapRef}
        initialViewState={{ latitude: initVp.latitude, longitude: initVp.longitude, zoom: initVp.zoom }}
        minZoom={1.5}
        maxZoom={7}
        mapStyle={DARK_STYLE}
        style={{ width: '100%', height: '100%' }}
        cursor={cursor}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        interactiveLayerIds={['fill', 'conns']}
      >
        {activeConns && (
          <Source id="connections" type="geojson" data={activeConns}>
            <Layer id="conns" type="line" paint={connPaint} />
          </Source>
        )}

        {/* key forces remount on level switch → resets generateId and feature states */}
        <Source key={level} id="territories" type="geojson" data={activeGeo} generateId={true}>
          <Layer id="fill" type="fill" paint={fillPaint} />
          <Layer
            id="highlight"
            type="fill"
            paint={highlightPaint}
            filter={hoveredId !== null ? ['==', ['id'], hoveredId] : ['==', ['id'], -99999]}
          />
          <Layer id="border" type="line" paint={borderPaint} />
        </Source>
      </Map>

      {connTooltip && (
        <div
          style={{
            position: 'absolute',
            left: connTooltip.x,
            top: connTooltip.y,
            background: '#1a1a2e',
            color: '#eee',
            padding: '6px 10px',
            borderRadius: 4,
            fontSize: 12,
            border: '1px solid #555',
            maxWidth: '28vw',
            wordWrap: 'break-word',
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          {connTooltip.text}
        </div>
      )}
    </div>
  )
}
