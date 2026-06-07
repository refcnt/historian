import { useEffect, useState } from 'react'
import ExplorerShell from './core/components/ExplorerShell'
import type { ExplorerPlugin } from './core/plugin'
import { loadHistorianData } from './explorers/historian/data/loader'
import { createHistorianPlugin } from './explorers/historian'
import './App.css'

export default function App() {
  const [plugin, setPlugin] = useState<ExplorerPlugin | null>(null)

  useEffect(() => {
    loadHistorianData().then(data => setPlugin(createHistorianPlugin(data)))
  }, [])

  if (!plugin) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0e1a', color: '#eee', fontSize: 16,
      }}>
        Loading…
      </div>
    )
  }

  return <ExplorerShell plugin={plugin} />
}
