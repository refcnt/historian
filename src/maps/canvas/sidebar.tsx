import { useState } from 'react'
import type { SidebarProps } from '@common/models'
import SidebarShell from '@common/panels/sidebar_shell'
import CollapsibleSection from '@common/panels/collapsible_section'
import NodeTree from '@common/panels/node_tree'
import RequestPathTree from './request_paths'

/**
 * Canvas sidebar: collapsible sections. "Nodes" is an expandable tree that
 * filters connections; "Request paths" highlights request flows (searchable).
 */
export default function CanvasSidebar({
  data, currLevel, activeNodeIds, activePathIds, onToggleActive, onResetActive, onTogglePath,
}: SidebarProps) {
  const [query, setQuery]         = useState('')
  const [nodeQuery, setNodeQuery] = useState('')
  const roots      = [...data.nodes.values()].filter(n => !n.parent)
  const hasFilter  = (activeNodeIds?.size ?? 0) > 0
  const q          = query.trim().toLowerCase()
  const paths      = q ? data.paths.filter(p => p.name.toLowerCase().includes(q)) : data.paths
  const activeCnt  = activePathIds.size

  return (
    <SidebarShell title={data.config.name as string} subtitle={`Level ${currLevel + 1}`}>
      <CollapsibleSection title="Nodes" defaultOpen>
        <input
          className="menu-search"
          placeholder="Filter nodes…"
          value={nodeQuery}
          onChange={e => setNodeQuery(e.target.value)}
        />
        <NodeTree
          nodes={roots}
          query={nodeQuery}
          isActive={n => activeNodeIds?.has(n.id) ?? false}
          onSelect={n => onToggleActive(n.id)}
        />
        {hasFilter && (
          <button className="continent-btn" style={{ marginTop: 8 }} onClick={onResetActive}>
            Show all connections
          </button>
        )}
      </CollapsibleSection>

      {data.paths.length > 0 && (
        <CollapsibleSection title={`Request paths${activeCnt ? ` · ${activeCnt}` : ''}`} defaultOpen>
          <input
            className="menu-search"
            placeholder="Filter paths…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {paths.length === 0
            ? <div className="menu-empty">No paths match “{query}”.</div>
            : <RequestPathTree
                paths={paths}
                activePathIds={activePathIds}
                nodeName={id => data.nodes.get(id)?.name ?? id}
                onTogglePath={onTogglePath}
              />}
          {activeCnt > 0 && (
            <button
              className="continent-btn"
              style={{ marginTop: 8 }}
              onClick={() => activePathIds.forEach(onTogglePath)}
            >
              Clear highlights ({activeCnt})
            </button>
          )}
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Help" defaultOpen={false}>
        <div className="sidebar-hint">
          Click a node to show only its connections.<br />
          Toggle a request path to highlight its route.<br />
          Drag the right edge to resize this panel.
        </div>
      </CollapsibleSection>
    </SidebarShell>
  )
}
