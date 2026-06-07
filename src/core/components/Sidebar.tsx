import type { ReactNode } from 'react'
import type { ExplorerPlugin } from '../plugin'
import type { Node } from '../models'

interface Props {
  plugin: ExplorerPlugin
  drillPath: Node[]
  onBack: () => void
  children?: ReactNode
}

export default function Sidebar({ plugin, drillPath, onBack, children }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">{plugin.name}</div>
      <div className="sidebar-subtitle">Global History · 1400–1500 CE</div>

      {drillPath.length > 0 && (
        <>
          <div className="sidebar-divider" />
          <div className="breadcrumb">
            {drillPath.map(n => n.label).join(' › ')}
          </div>
          <button className="back-btn" onClick={onBack}>← Back</button>
        </>
      )}

      {children}
    </aside>
  )
}
