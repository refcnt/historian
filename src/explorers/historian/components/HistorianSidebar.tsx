import type { SidebarContentProps } from '../../../core/plugin'
import { CONTINENT_HEX } from '../constants'

export default function HistorianSidebar({
  viewDepth, rootNodes, onFocus, pluginOptions, onPluginOption,
}: SidebarContentProps) {
  const showLabels = pluginOptions?.showConnectionLabels !== false

  return (
    <>
      <div className="sidebar-divider" />

      {viewDepth === 0 && (
        <>
          <div className="sidebar-section-label">Continents</div>
          <div className="continent-buttons">
            {rootNodes.map(node => (
              <button
                key={node.id}
                className="continent-btn"
                style={{ borderLeft: `3px solid ${CONTINENT_HEX[node.name] ?? '#888'}` }}
                onClick={() => onFocus(node)}
              >
                {node.name}
              </button>
            ))}
            <button className="continent-btn" onClick={() => onFocus(null)}>
              World View
            </button>
          </div>
        </>
      )}

      <div className="sidebar-divider" />

      <label className="toggle-label">
        <input
          type="checkbox"
          checked={showLabels}
          onChange={e => onPluginOption('showConnectionLabels', e.target.checked)}
        />
        Arc labels
      </label>

      <div className="sidebar-divider" />
      <div className="sidebar-hint">
        <b>Click</b> a continent to drill down.<br />
        <b>Hover</b> any arc for details.
      </div>
    </>
  )
}
