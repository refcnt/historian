import { useState } from 'react'
import type { InfoBlock, TabContent } from '../models'

function TabBody({ content }: { content: TabContent }) {
  switch (content.type) {
    case 'text':
      return <p style={{ margin: 0, lineHeight: 1.6, color: '#ccc' }}>{content.text}</p>
    case 'list':
      return (
        <ul style={{ margin: 0, paddingLeft: 18, color: '#ccc', lineHeight: 1.7 }}>
          {content.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )
    case 'table':
      return (
        <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
          <tbody>
            {content.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '2px 12px 2px 0', color: j === 0 ? '#888' : '#ccc' }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    case 'image':
      return <img src={content.url} alt={content.alt ?? ''} style={{ maxWidth: '100%', borderRadius: 4 }} />
  }
}

interface Props {
  infoBlock: InfoBlock | null
}

export default function DescriptionPanel({ infoBlock }: Props) {
  const [activeTab, setActiveTab] = useState(0)

  if (!infoBlock || infoBlock.tabs.length === 0) {
    return (
      <div className="desc-panel">
        <span className="desc-placeholder">Hover over any item to see details</span>
      </div>
    )
  }

  const safeIdx = Math.min(activeTab, infoBlock.tabs.length - 1)
  const tab = infoBlock.tabs[safeIdx]

  return (
    <div className="desc-panel">
      {infoBlock.tabs.length > 1 && (
        <div className="desc-tabs">
          {infoBlock.tabs.map((t, i) => (
            <button
              key={t.title}
              className={`desc-tab-btn ${i === safeIdx ? 'active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {t.title}
            </button>
          ))}
        </div>
      )}
      <div className="desc-body">
        {tab.content.map((c, i) => <TabBody key={i} content={c} />)}
      </div>
    </div>
  )
}
