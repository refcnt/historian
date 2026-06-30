import type { ReactNode } from 'react'

interface Props {
  currentDepth: number
  onLevelBack:  () => void
  children:     ReactNode
}

export function RendererContainer({ currentDepth, onLevelBack, children }: Props) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {children}
      {currentDepth > 0 && (
        <button onClick={onLevelBack} style={{
          position: 'absolute', top: 12, left: 12, zIndex: 10,
          background: 'rgba(20,25,40,0.85)', color: '#aab',
          border: '1px solid #334', borderRadius: 6,
          padding: '4px 12px', cursor: 'pointer', fontSize: 12,
        }}>
          ← Level {currentDepth}
        </button>
      )}
    </div>
  )
}
