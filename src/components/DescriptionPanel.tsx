import type { HoveredEntity } from '../types'

interface Props {
  hovered: HoveredEntity | null
}

export default function DescriptionPanel({ hovered }: Props) {
  return (
    <div className="desc-panel">
      {hovered ? (
        <>
          <div className="desc-name">
            {hovered.name}
            {hovered.tags.length > 0 && (
              <span className="desc-tags">{hovered.tags.join(' · ')}</span>
            )}
          </div>
          <div className="desc-body">{hovered.desc}</div>
        </>
      ) : (
        <div className="desc-placeholder">
          Hover over any territory to explore 15th-century history
        </div>
      )}
    </div>
  )
}
