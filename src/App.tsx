import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import Builder, { type MapRendererProps } from './common/panels/builder'
import type { ExplorerData } from './common/models'
import { load } from './common/loader/loader'
import { GeoMap } from './maps/geo/map'
import { CanvasMap } from './maps/canvas/map'
import './App.css'

const MAPS = {
  geo:    GeoMap,
  canvas: CanvasMap,
}

interface Resolved {
  name: string
  data: ExplorerData
  MapRenderer: ComponentType<MapRendererProps>
}

export default function App() {
  const [resolved, setResolved] = useState<Resolved | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dataPath = new URLSearchParams(window.location.search).get('data') ?? undefined

    load(dataPath ?? '/examples/history_data.json')
      .then(raw => {
        const map = MAPS[raw.type as keyof typeof MAPS]
        if (!map) throw new Error(`Unknown map type: "${raw.type ?? ''}"`)
        const data = map.parser.build(raw)
        const name = raw.name ?? raw.nodes[0]?.name ?? 'Explorer'
        setResolved({ name, data, MapRenderer: map.Renderer })
      })
      .catch(err => setError(String(err)))
  }, [])

  if (error) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0e1a', color: '#f66', fontSize: 14, padding: 32,
      }}>
        Failed to load: {error}
      </div>
    )
  }

  if (!resolved) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0e1a', color: '#eee', fontSize: 16,
      }}>
        Loading…
      </div>
    )
  }

  return <Builder {...resolved} />
}
