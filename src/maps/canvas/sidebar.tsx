import type { SidebarProps } from '@common/models'
import SidebarShell from '@common/panels/sidebar_shell'
import CollapsibleSection from '@common/panels/collapsible_section'
import NodeTree from '@common/panels/node_tree'
import RequestPathTree from './request_paths'

/**
 * Canvas sidebar: collapsible sections. "Nodes" is an expandable tree that
 * filters connections; "Request paths" highlights request flows on the map.
 */
export default function CanvasSidebar({
  data, currLevel, activeNodeIds, activePathIds, onToggleActive, onResetActive, onTogglePath,
}: SidebarProps) {
  const roots     = [...data.nodes.values()].filter(n => !n.parent)
  const hasFilter = (activeNodeIds?.size ?? 0) > 0

  return (
    <SidebarShell title={data.config.name as string} subtitle={`Level ${currLevel + 1}`}>
      <CollapsibleSection title="Nodes" defaultOpen>
        <NodeTree
          nodes={roots}
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
        <CollapsibleSection title="Request paths" defaultOpen>
          <RequestPathTree
            paths={data.paths}
            activePathIds={activePathIds}
            nodeName={id => data.nodes.get(id)?.name ?? id}
            onTogglePath={onTogglePath}
          />
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Help" defaultOpen={false}>
        <div className="sidebar-hint">
          Click a node to show only its connections.<br />
          Toggle a request path to highlight its route.<br />
          Double-click a group on the map to go deeper.
        </div>
      </CollapsibleSection>
    </SidebarShell>
  )
}
