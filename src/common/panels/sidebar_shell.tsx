import { useEffect, useState, type ReactNode } from 'react'
import { DATA_SOURCES, currentDataPath, switchDataSource } from '@common/data_sources'

interface Props {
  title:     string
  subtitle?: string
  children:  ReactNode
}

const MIN_W = 190
const MAX_W = 560
const KEY   = 'sidebarWidth'

/** Shared chrome (title + divider) for every map's sidebar. Resizable via the right edge. */
export default function SidebarShell({ title, subtitle, children }: Props) {
  const [width, setWidth] = useState(() => {
    const saved = Number(localStorage.getItem(KEY))
    return saved >= MIN_W && saved <= MAX_W ? saved : 240
  })

  useEffect(() => { localStorage.setItem(KEY, String(width)) }, [width])

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault()
    const onMove = (ev: MouseEvent) => setWidth(Math.min(MAX_W, Math.max(MIN_W, ev.clientX)))
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const cur     = currentDataPath()
  const options = DATA_SOURCES.some(o => o.path === cur)
    ? DATA_SOURCES
    : [{ label: cur, path: cur }, ...DATA_SOURCES]

  return (
    <aside className="sidebar" style={{ width }}>
      <select
        className="data-source-select"
        value={cur}
        onChange={e => switchDataSource(e.target.value)}
        title="Switch data source"
      >
        {options.map(o => <option key={o.path} value={o.path}>{o.label}</option>)}
      </select>
      <div className="sidebar-title">{title}</div>
      {subtitle && <div className="sidebar-subtitle">{subtitle}</div>}
      <div className="sidebar-divider" />
      <div className="sidebar-scroll">{children}</div>
      <div className="sidebar-resizer" onMouseDown={startResize} title="Drag to resize" />
    </aside>
  )
}
