import { CONTINENT_NAMES, ARC_COLORS } from '../constants'

interface Props {
  level: 1 | 2
  continent: string
  onLevelChange: (l: 1 | 2) => void
  onContinentChange: (c: string) => void
}

export default function Sidebar({ level, continent, onLevelChange, onContinentChange }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">15th Century</div>
      <div className="sidebar-subtitle">Global History · 1400–1500 CE</div>

      <div className="sidebar-divider" />

      <div className="sidebar-section-label">Detail level</div>
      <div className="level-buttons">
        <button
          className={`level-btn ${level === 1 ? 'active' : ''}`}
          onClick={() => onLevelChange(1)}
        >
          1 — Continents
        </button>
        <button
          className={`level-btn ${level === 2 ? 'active' : ''}`}
          onClick={() => onLevelChange(2)}
        >
          2 — Countries
        </button>
      </div>

      {level === 2 && (
        <>
          <div className="sidebar-divider" />
          <div className="sidebar-section-label">Center map on</div>
          <div className="continent-buttons">
            {CONTINENT_NAMES.map(name => (
              <button
                key={name}
                className={`continent-btn ${continent === name ? 'active' : ''}`}
                onClick={() => onContinentChange(name)}
              >
                {name}
              </button>
            ))}
            <button
              className={`continent-btn ${continent === 'World' ? 'active' : ''}`}
              onClick={() => onContinentChange('World')}
            >
              ← World view
            </button>
          </div>
        </>
      )}

      <div className="sidebar-divider" />
      <div className="sidebar-section-label">Connections</div>
      <div className="legend">
        {Object.entries(ARC_COLORS)
          .filter(([k]) => k !== 'Trade')
          .map(([type, color]) => (
            <div key={type} className="legend-item">
              <span className="legend-dot" style={{ background: color }} />
              {type}
            </div>
          ))}
      </div>

      <div className="sidebar-divider" />
      <div className="sidebar-hint">
        <b>Level 1</b> — click a continent<br />
        <b>Level 2</b> — hover for details
      </div>
    </aside>
  )
}
