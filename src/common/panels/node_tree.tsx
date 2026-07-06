import { useState } from 'react'
import type { Node } from '@common/models'
import { colorForId } from '@common/styles/color_generator'

interface Props {
  nodes:    Node[]
  isActive: (node: Node) => boolean
  onSelect: (node: Node) => void
  depth?:   number
}

/** Recursive, expandable node list. Rows with children get an expand chevron. */
export default function NodeTree({ nodes, isActive, onSelect, depth = 0 }: Props) {
  return (
    <ul className="node-tree">
      {nodes.map(node => (
        <NodeRow key={node.id} node={node} depth={depth} isActive={isActive} onSelect={onSelect} />
      ))}
    </ul>
  )
}

function NodeRow({ node, depth, isActive, onSelect }: { node: Node; depth: number } & Omit<Props, 'nodes' | 'depth'>) {
  const [open, setOpen]  = useState(false)
  const hasChildren      = node.children.length > 0
  const active           = isActive(node)
  return (
    <li>
      <div className="node-row" style={{ paddingLeft: depth * 12 }}>
        {hasChildren
          ? <button className={`tree-chevron${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>▸</button>
          : <span className="tree-chevron placeholder" />}
        <button
          className={`node-label${active ? ' active' : ''}`}
          style={{ borderLeft: `3px solid ${node.color ?? colorForId(node.id)}` }}
          onClick={() => onSelect(node)}
        >
          {node.name}
        </button>
      </div>
      {hasChildren && open && (
        <NodeTree nodes={node.children} depth={depth + 1} isActive={isActive} onSelect={onSelect} />
      )}
    </li>
  )
}
