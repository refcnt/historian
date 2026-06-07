import { useState, useMemo } from 'react'
import type { ExplorerPlugin } from '../plugin'
import type { Node, NodeConnection } from '../models'
import DescriptionPanel from './DescriptionPanel'
import Sidebar from './Sidebar'

interface Props {
  plugin: ExplorerPlugin
}

export default function ExplorerShell({ plugin }: Props) {
  const [drillPath, setDrillPath] = useState<Node[]>([])
  const [focusedNode, setFocusedNode] = useState<Node | null>(null)
  const [selected, setSelected] = useState<Node | NodeConnection | null>(null)
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set())
  const [pluginOptions, setPluginOptions] = useState<Record<string, unknown>>({ showConnectionLabels: true })

  const viewDepth = drillPath.length

  const visibleNodes = useMemo(
    () => plugin.getVisibleNodes
      ? plugin.getVisibleNodes(viewDepth, drillPath)
      : viewDepth === 0 ? plugin.rootNodes : drillPath[viewDepth - 1].children,
    [drillPath, viewDepth, plugin],
  )

  const allConnections = useMemo(
    () => plugin.getConnections(viewDepth, drillPath),
    [viewDepth, drillPath, plugin],
  )

  // Unique categories present at this depth, preserving first-seen order
  const connectionCategories = useMemo(() => {
    const seen = new Map<string, string>()
    for (const c of allConnections) {
      if (c.category && !seen.has(c.category)) seen.set(c.category, c.categoryColor ?? '#888')
    }
    return [...seen.entries()].map(([name, color]) => ({ name, color }))
  }, [allConnections])

  const visibleConnections = useMemo(
    () => hiddenCategories.size === 0
      ? allConnections
      : allConnections.filter(c => !c.category || !hiddenCategories.has(c.category)),
    [allConnections, hiddenCategories],
  )

  function toggleCategory(name: string) {
    setHiddenCategories(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  function handleSelect(node: Node) {
    if (node.children.length > 0) {
      setDrillPath(prev => [...prev, node])
      setFocusedNode(null)
      setSelected(null)
    } else {
      setSelected(node)
    }
  }

  function handleBack() {
    setDrillPath(prev => prev.slice(0, -1))
    setFocusedNode(null)
    setSelected(null)
  }

  function handlePluginOption(key: string, value: unknown) {
    setPluginOptions(prev => ({ ...prev, [key]: value }))
  }

  const { Renderer, SidebarContent } = plugin

  return (
    <div className="app">
      <Sidebar plugin={plugin} drillPath={drillPath} onBack={handleBack}>
        {SidebarContent && (
          <SidebarContent
            viewDepth={viewDepth}
            drillPath={drillPath}
            rootNodes={plugin.rootNodes}
            onFocus={setFocusedNode}
            pluginOptions={pluginOptions}
            onPluginOption={handlePluginOption}
          />
        )}

        {connectionCategories.length > 0 && (
          <>
            <div className="sidebar-divider" />
            <div className="sidebar-section-label">Connections</div>
            <div className="category-filters">
              {connectionCategories.map(({ name, color }) => (
                <label key={name} className="toggle-label">
                  <input
                    type="checkbox"
                    checked={!hiddenCategories.has(name)}
                    onChange={() => toggleCategory(name)}
                  />
                  <span className="legend-dot" style={{ background: color }} />
                  {name}
                </label>
              ))}
            </div>
          </>
        )}
      </Sidebar>

      <div className="content">
        <div className="map-container">
          <Renderer
            nodes={visibleNodes}
            connections={visibleConnections}
            viewDepth={viewDepth}
            drillPath={drillPath}
            focusedNode={focusedNode}
            onHover={() => {}}
            onSelect={handleSelect}
            pluginOptions={pluginOptions}
          />
        </div>
        <DescriptionPanel key={selected?.id ?? 'none'} infoBlock={selected?.infoBlock ?? null} />
      </div>
    </div>
  )
}
