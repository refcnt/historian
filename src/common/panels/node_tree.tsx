import { useState } from 'react'
import type { Node } from '@common/models'
import { colorForId } from '@common/styles/color_generator'

interface Props {
  nodes:    Node[]
  isActive: (node: Node) => boolean
  onSelect: (node: Node) => void
  query?:   string
  depth?:   number
}

function subtreeMatches(n: Node, q: string): boolean {
  return n.name.toLowerCase().includes(q) || n.children.some(c => subtreeMatches(c, q))
}

/** Recursive, expandable node list. Rows with children get an expand chevron.
 *  When `query` is set, only matching subtrees are shown and auto-expanded. */
export default function NodeTree({ nodes, isActive, onSelect, query = '', depth = 0 }: Props) {
  const q       = query.trim().toLowerCase()
  const visible = q ? nodes.filter(n => subtreeMatches(n, q)) : nodes
  return (
    <ul className="node-tree">
      {visible.map(node => (
        <NodeRow key={node.id} node={node} depth={depth} query={q}
          isActive={isActive} onSelect={onSelect} />
      ))}
    </ul>
  )
}

function NodeRow({ node, depth, query, isActive, onSelect }: {
  node: Node; depth: number; query: string
} & Pick<Props, 'isActive' | 'onSelect'>) {
  const [open, setOpen] = useState(false)
  const hasChildren     = node.children.length > 0
  const active          = isActive(node)
  const forcedOpen      = query.length > 0
  const isOpen          = open || forcedOpen
  return (
    <li>
      <div className="node-row" style={{ paddingLeft: depth * 12 }}>
        {hasChildren
          ? <button className={`tree-chevron${isOpen ? ' open' : ''}`}
              onClick={() => setOpen(o => !o)} disabled={forcedOpen}>▸</button>
          : <span className="tree-chevron placeholder" />}
        <button
          className={`node-label${active ? ' active' : ''}`}
          style={{ borderLeft: `3px solid ${node.color ?? colorForId(node.id)}` }}
          onClick={() => onSelect(node)}
        >
          {node.name}
        </button>
      </div>
      {hasChildren && isOpen && (
        <NodeTree nodes={node.children} depth={depth + 1} query={query}
          isActive={isActive} onSelect={onSelect} />
      )}
    </li>
  )
}
