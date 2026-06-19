import type { Node } from '../models'

interface Props {
  name:      string
  rootNodes: Node[]
  onFocus:   (node: Node | null) => void
}

export default function Sidebar({ name, rootNodes, onFocus }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">{name}</div>
      <div className="sidebar-divider" />
      <div className="continent-buttons">
        {rootNodes.map(node => (
          <button
            key={node.id}
            className="continent-btn"
            style={{ borderLeft: `3px solid ${node.color ?? '#888'}` }}
            onClick={() => onFocus(node)}
          >
            {node.name}
          </button>
        ))}
        <button className="continent-btn" onClick={() => onFocus(null)}>
          Reset view
        </button>
      </div>
    </aside>
  )
}
