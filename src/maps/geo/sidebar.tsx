import type { SidebarProps } from '@common/models'
import SidebarShell from '@common/panels/sidebar_shell'
import CollapsibleSection from '@common/panels/collapsible_section'
import NodeTree from '@common/panels/node_tree'

/** Geo sidebar: expandable region tree; selecting a node flies the map to it. */
export default function GeoSidebar({ data, focusedNode, onFocus }: SidebarProps) {
  const roots = [...data.nodes.values()].filter(n => !n.parent)
  return (
    <SidebarShell title={data.config.name as string}>
      <CollapsibleSection title="Regions" defaultOpen>
        <NodeTree
          nodes={roots}
          isActive={n => focusedNode?.id === n.id}
          onSelect={onFocus}
        />
        <button className="continent-btn" style={{ marginTop: 8 }} onClick={() => onFocus(null)}>
          Reset view
        </button>
      </CollapsibleSection>
    </SidebarShell>
  )
}
