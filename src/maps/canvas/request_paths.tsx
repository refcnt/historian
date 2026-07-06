import { useState } from 'react'
import type { Id, RequestPath, RequestStep } from '@common/models'
import { colorForId } from '@common/styles/color_generator'

interface Props {
  paths:         RequestPath[]
  activePathIds: Set<Id>
  nodeName:      (id: Id) => string
  onTogglePath:  (id: Id) => void
}

/** Expandable request-path list: path → hops → per-hop metadata. */
export default function RequestPathTree({ paths, activePathIds, nodeName, onTogglePath }: Props) {
  return (
    <ul className="path-tree">
      {paths.map(path => (
        <PathRow
          key={path.id}
          path={path}
          active={activePathIds.has(path.id)}
          nodeName={nodeName}
          onToggle={() => onTogglePath(path.id)}
        />
      ))}
    </ul>
  )
}

function PathRow({ path, active, nodeName, onToggle }: {
  path: RequestPath; active: boolean; nodeName: (id: Id) => string; onToggle: () => void
}) {
  const [open, setOpen] = useState(false)
  const color = path.color ?? colorForId(path.id)
  return (
    <li>
      <div className="node-row">
        <button className={`tree-chevron${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>▸</button>
        <button className={`path-item${active ? ' active' : ''}`} onClick={onToggle}>
          <span className="path-dot" style={{ background: color }} />
          <span className="path-name">{path.name}</span>
        </button>
      </div>
      {open && (
        <ul className="step-list">
          {path.steps.map((step, i) => (
            <StepRow key={i} order={i + 1} step={step} nodeName={nodeName} color={color} />
          ))}
        </ul>
      )}
    </li>
  )
}

function StepRow({ order, step, nodeName, color }: {
  order: number; step: RequestStep; nodeName: (id: Id) => string; color: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <li>
      <div className="node-row">
        <button className={`tree-chevron${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>▸</button>
        <span className="step-order" style={{ color, borderColor: color }}>{order}</span>
        <span className="step-label">{nodeName(step.from)} → {nodeName(step.to)}</span>
      </div>
      {open && <StepMeta step={step} />}
    </li>
  )
}

function StepMeta({ step }: { step: RequestStep }) {
  const rows: [string, string][] = []
  if (step.method)         rows.push(['Method', step.method])
  if (step.path)           rows.push(['Path', step.path])
  if (step.reqPerSec != null)   rows.push(['Req/s', formatRate(step.reqPerSec)])
  if (step.bytesPerSec != null) rows.push(['Throughput', `${formatBytes(step.bytesPerSec)}/s`])
  for (const [k, v] of Object.entries(step.queryParams ?? {})) rows.push([`?${k}`, v])
  for (const [k, v] of Object.entries(step.headers ?? {}))     rows.push([k, v])

  if (rows.length === 0) return <div className="step-meta step-meta-empty">no metadata</div>
  return (
    <div className="step-meta">
      {rows.map(([k, v], i) => (
        <div className="step-meta-row" key={i}>
          <div className="step-meta-key">{k}</div>
          <div className="step-meta-val">{v}</div>
        </div>
      ))}
    </div>
  )
}

function formatRate(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return String(n)
}

function formatBytes(n: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
