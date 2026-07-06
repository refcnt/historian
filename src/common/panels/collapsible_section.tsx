import { useState, type ReactNode } from 'react'

interface Props {
  title:       string
  defaultOpen?: boolean
  children:    ReactNode
}

/** A collapsible sidebar section (submenu) with a disclosure chevron. */
export default function CollapsibleSection({ title, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="menu-section">
      <button className="menu-section-header" onClick={() => setOpen(o => !o)}>
        <span className={`chevron${open ? ' open' : ''}`}>▸</span>
        {title}
      </button>
      {open && <div className="menu-section-body">{children}</div>}
    </div>
  )
}
