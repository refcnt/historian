import type { ReactNode } from 'react'

interface Props {
  title:     string
  subtitle?: string
  children:  ReactNode
}

/** Shared chrome (title + divider) for every map's sidebar. */
export default function SidebarShell({ title, subtitle, children }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">{title}</div>
      {subtitle && <div className="sidebar-subtitle">{subtitle}</div>}
      <div className="sidebar-divider" />
      {children}
    </aside>
  )
}
