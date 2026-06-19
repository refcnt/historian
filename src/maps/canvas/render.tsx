import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import type { MapRendererProps } from '../../common/panels/builder'
import type { Node, Connection } from '../../common/models'
import { getLayout } from './layout'
import { colorForId } from '../../common/styles/color_generator'
import { CHILD_SIZE, ICON_SIZE } from './constants'

type Dims = { w: number; h: number }
type Pos  = { x: number; y: number }

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

function edgePt(cx: number, cy: number, d: Dims, tx: number, ty: number) {
  const dx = tx - cx, dy = ty - cy
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 1) return { x: cx, y: cy }
  const ux = dx / len, uy = dy / len
  const t = Math.min(
    ux ? (d.w / 2 + 8) / Math.abs(ux) : Infinity,
    uy ? (d.h / 2 + 8) / Math.abs(uy) : Infinity,
  )
  return { x: cx + ux * t, y: cy + uy * t }
}

function curvePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const lift = Math.min(len * 0.22, 60)
  let px = -dy / len, py = dx / len
  if (py < 0 || (py === 0 && px < 0)) { px = -px; py = -py }
  return `M ${x1} ${y1} Q ${mx + px * lift} ${my + py * lift} ${x2} ${y2}`
}

function curveMid(x1: number, y1: number, x2: number, y2: number): [number, number] {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const lift = Math.min(len * 0.22, 60)
  let px = -dy / len, py = dx / len
  if (py < 0 || (py === 0 && px < 0)) { px = -px; py = -py }
  const qx = mx + px * lift, qy = my + py * lift
  return [0.25 * x1 + 0.5 * qx + 0.25 * x2, 0.25 * y1 + 0.5 * qy + 0.25 * y2]
}

export default function CanvasRenderer({
  nodes, connections, config, focusedNode, onHover, onSelect,
}: MapRendererProps) {
  const [hoveredId, setHoveredId]       = useState<string | null>(null)
  const [pan, setPan]                   = useState({ x: 40, y: 40 })
  const [scale, setScale]               = useState(1)
  const [currentDepth, setCurrentDepth] = useState(0)
  const [levelStack, setLevelStack]     = useState<string[]>([])

  const svgRef   = useRef<SVGSVGElement>(null)
  const scaleRef = useRef(scale)
  const dragRef  = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null)

  useEffect(() => { scaleRef.current = scale }, [scale])

  const algo = (config.algo as string) ?? 'hierarchical'

  // Flatten full tree
  const allNodes = useMemo(() => {
    const result: Node[] = []
    const walk = (ns: Node[]) => { for (const n of ns) { result.push(n); walk(n.children) } }
    walk(nodes)
    return result
  }, [nodes])

  // Depth of each node (root = 0)
  const depthMap = useMemo(() => {
    const map = new Map<string, number>()
    const walk = (ns: Node[], d: number) => {
      for (const n of ns) { map.set(n.id, d); walk(n.children, d + 1) }
    }
    walk(nodes, 0)
    return map
  }, [nodes])

  // Layout: positions + sizes for every node (computed once)
  const layout = useMemo(
    () => getLayout(algo).compute(allNodes, connections),
    [allNodes, connections, algo],
  )
  const positions = layout.positions
  const dimsMap   = layout.sizes

  // ── Viewport helpers ────────────────────────────────────────────────────────

  function fitNodes(ns: Node[]) {
    if (!svgRef.current || ns.length === 0) return
    const corners: Pos[] = []
    ns.forEach(n => {
      const p = positions.get(n.id), d = dimsMap.get(n.id)
      if (!p || !d) return
      corners.push({ x: p.x - d.w / 2, y: p.y - d.h / 2 })
      corners.push({ x: p.x + d.w / 2, y: p.y + d.h / 2 })
    })
    if (corners.length === 0) return
    const minX = Math.min(...corners.map(p => p.x))
    const maxX = Math.max(...corners.map(p => p.x))
    const minY = Math.min(...corners.map(p => p.y))
    const maxY = Math.max(...corners.map(p => p.y))
    const { width, height } = svgRef.current.getBoundingClientRect()
    const s = Math.min((width - 120) / (maxX - minX), (height - 120) / (maxY - minY), 1.4)
    scaleRef.current = s
    setScale(s)
    setPan({ x: (width - (maxX + minX) * s) / 2, y: (height - (maxY + minY) * s) / 2 })
  }

  function panToCenter(ns: Node[]) {
    if (!svgRef.current || ns.length === 0) return
    const pts = ns.map(n => positions.get(n.id)).filter(Boolean) as Pos[]
    if (pts.length === 0) return
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length
    const { width, height } = svgRef.current.getBoundingClientRect()
    setPan({ x: width / 2 - cx * scaleRef.current, y: height / 2 - cy * scaleRef.current })
  }

  function zoomToNode(id: string) {
    const p = positions.get(id), d = dimsMap.get(id)
    if (!p || !d || !svgRef.current) return
    const { width, height } = svgRef.current.getBoundingClientRect()
    const s = Math.min((width * 0.65) / d.w, (height * 0.65) / d.h, 2.5)
    scaleRef.current = s
    setScale(s)
    setPan({ x: width / 2 - p.x * s, y: height / 2 - p.y * s })
  }

  // Initial fit
  useEffect(() => { fitNodes(nodes) }, [positions]) // eslint-disable-line

  // Focused node from sidebar → zoom to it
  useEffect(() => {
    if (focusedNode && positions.has(focusedNode.id)) zoomToNode(focusedNode.id)
    else if (!focusedNode) fitNodes(nodes)
  }, [focusedNode, positions]) // eslint-disable-line

  // ── Navigation ──────────────────────────────────────────────────────────────

  function drillDown(n: Node) {
    if (n.children.length === 0) return
    const nextDepth = currentDepth + 1
    setCurrentDepth(nextDepth)
    setLevelStack(s => [...s, n.id])
    // Pan (not zoom) to center on the children
    setTimeout(() => panToCenter(n.children), 0)
  }

  function levelBack() {
    if (currentDepth === 0) return
    const prevDepth = currentDepth - 1
    const newStack = levelStack.slice(0, -1)
    setCurrentDepth(prevDepth)
    setLevelStack(newStack)
    if (newStack.length > 0) {
      // Center on the now-current group's children
      const parentId = newStack[newStack.length - 1]
      const parent = allNodes.find(n => n.id === parentId)
      if (parent) setTimeout(() => panToCenter(parent.children), 0)
    } else {
      setTimeout(() => fitNodes(nodes), 0)
    }
  }

  // ── Interaction ─────────────────────────────────────────────────────────────

  const handleBgMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y }
  }, [pan])
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return
    setPan({ x: dragRef.current.px + (e.clientX - dragRef.current.sx), y: dragRef.current.py + (e.clientY - dragRef.current.sy) })
  }, [])
  const handleMouseUp   = useCallback(() => { dragRef.current = null }, [])
  const handleWheel     = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const s2 = Math.max(0.08, Math.min(5, scale * (e.deltaY < 0 ? 1.1 : 0.9)))
    const rect = svgRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    setPan(p => ({ x: mx - (mx - p.x) * (s2 / scale), y: my - (my - p.y) * (s2 / scale) }))
    setScale(s2)
  }, [scale])

  const handleNodeHover = useCallback((n: Node | null) => { setHoveredId(n?.id ?? null); onHover(n) }, [onHover])
  const handleConnHover = useCallback((c: Connection | null) => { setHoveredId(c?.id ?? null); onHover(c) }, [onHover])

  // ── Render helpers ──────────────────────────────────────────────────────────

  function renderGroup(n: Node, pos: Pos, dims: Dims) {
    const { w, h } = dims
    const depth   = depthMap.get(n.id) ?? 0
    const isDim   = depth < currentDepth   // ancestor: dim outline
    const hovered = hoveredId === n.id && !isDim
    const color   = n.color ?? colorForId(n.id)
    return (
      <g
        key={n.id}
        transform={`translate(${pos.x - w / 2},${pos.y - h / 2})`}
        opacity={isDim ? 0.2 : 1}
        style={{ cursor: isDim ? 'default' : 'pointer' }}
        onMouseDown={e => e.stopPropagation()}
        onMouseEnter={() => !isDim && handleNodeHover(n)}
        onMouseLeave={() => handleNodeHover(null)}
        onClick={() => !isDim && onSelect(n)}
        onDoubleClick={() => !isDim && drillDown(n)}
      >
        <rect
          width={w} height={h} rx={10}
          fill={color} fillOpacity={isDim ? 0 : hovered ? 0.18 : 0.07}
          stroke={color} strokeWidth={hovered ? 2 : 1.2}
        />
        <text
          x={w / 2} y={15}
          textAnchor="middle" dominantBaseline="middle"
          fill={color}
          fontSize={n.fontSize ?? 11}
          fontWeight={600}
          fontFamily={n.fontFamily ?? 'system-ui, sans-serif'}
        >
          {n.name}
        </text>
      </g>
    )
  }

  function renderLeaf(n: Node, pos: Pos) {
    const depth   = depthMap.get(n.id) ?? 0
    const hovered = hoveredId === n.id
    const color   = n.color ?? colorForId(n.id)
    // Children of current-depth groups (depth+1) appear inside containers at reduced size
    const hs = depth === currentDepth ? ICON_SIZE / 2 : CHILD_SIZE / 2
    return (
      <g
        key={n.id}
        transform={`translate(${pos.x},${pos.y})`}
        style={{ cursor: 'pointer' }}
        onMouseDown={e => e.stopPropagation()}
        onMouseEnter={() => handleNodeHover(n)}
        onMouseLeave={() => handleNodeHover(null)}
        onClick={() => onSelect(n)}
      >
        {hovered && <circle r={hs + 6} fill={color} fillOpacity={0.15} />}
        {n.icon
          ? <image href={n.icon} x={-hs} y={-hs} width={hs * 2} height={hs * 2} />
          : <circle r={hs * 0.7} fill={color} fillOpacity={hovered ? 0.4 : 0.22} stroke={color} strokeWidth={1.2} />
        }
        <text
          x={0} y={hs + 11}
          textAnchor="middle" dominantBaseline="hanging"
          fill={n.fontColor ?? '#aab'}
          fontSize={n.fontSize ?? 9}
          fontFamily={n.fontFamily ?? 'system-ui, sans-serif'}
        >
          {depth > currentDepth ? truncate(n.name, 14) : n.name}
        </text>
      </g>
    )
  }

  // ── Visibility filters ──────────────────────────────────────────────────────
  // Groups: render if depth ≤ currentDepth (ancestors as dim outlines, current as full)
  // Leaves: render if depth = currentDepth (standalone icons) OR depth = currentDepth+1 (inside containers)
  const visibleGroups = allNodes.filter(n =>
    n.children.length > 0 && (depthMap.get(n.id) ?? 0) <= currentDepth
  )
  const visibleLeaves = allNodes.filter(n => {
    const d = depthMap.get(n.id) ?? 0
    return n.children.length === 0 && (d === currentDepth || d === currentDepth + 1)
  })
  const visibleConns = connections.filter(c => {
    const df = depthMap.get(c.from.id) ?? 0
    const dt = depthMap.get(c.to.id)   ?? 0
    return df === currentDepth && dt === currentDepth
  })

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {currentDepth > 0 && (
        <button
          onClick={levelBack}
          style={{
            position: 'absolute', top: 12, left: 12, zIndex: 10,
            background: 'rgba(20,25,40,0.85)', color: '#aab',
            border: '1px solid #334', borderRadius: 6,
            padding: '4px 12px', cursor: 'pointer', fontSize: 12,
          }}
        >
          ← Level {currentDepth}
        </button>
      )}
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%', display: 'block', background: '#0a0e1a' }}
        onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} onWheel={handleWheel}
      >
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#888" fillOpacity="0.85" />
          </marker>
        </defs>

        <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
          <rect x={-50000} y={-50000} width={100000} height={100000}
            fill="transparent"
            style={{ cursor: dragRef.current ? 'grabbing' : 'grab' }}
            onMouseDown={handleBgMouseDown}
          />

          {/* Connections at current level */}
          {visibleConns.map(c => {
            const pa = positions.get(c.from.id), pb = positions.get(c.to.id)
            if (!pa || !pb) return null
            const da = dimsMap.get(c.from.id) ?? { w: ICON_SIZE, h: ICON_SIZE }
            const db = dimsMap.get(c.to.id)   ?? { w: ICON_SIZE, h: ICON_SIZE }
            const ep1 = edgePt(pa.x, pa.y, da, pb.x, pb.y)
            const ep2 = edgePt(pb.x, pb.y, db, pa.x, pa.y)
            const hovered = hoveredId === c.id
            const d = curvePath(ep1.x, ep1.y, ep2.x, ep2.y)
            const [lx, ly] = curveMid(ep1.x, ep1.y, ep2.x, ep2.y)
            return (
              <g key={c.id} onMouseEnter={() => handleConnHover(c)} onMouseLeave={() => handleConnHover(null)}>
                <path d={d} stroke="transparent" strokeWidth={14} fill="none" />
                <path d={d} stroke={c.color ?? '#667'} strokeWidth={hovered ? 2 : 1.2}
                  strokeOpacity={hovered ? 0.9 : 0.35} fill="none" markerEnd="url(#arrow)" />
                {hovered && (
                  <>
                    <rect x={lx - c.name.length * 3.3 - 6} y={ly - 10}
                      width={c.name.length * 6.6 + 12} height={17} rx={3} fill="rgba(0,0,0,0.65)" />
                    <text x={lx} y={ly + 1} textAnchor="middle" dominantBaseline="middle"
                      fill="#ddd" fontSize={10} fontFamily="system-ui, sans-serif">{c.name}</text>
                  </>
                )}
              </g>
            )
          })}

          {/* Groups (background) */}
          {visibleGroups.map(n => {
            const pos = positions.get(n.id), dims = dimsMap.get(n.id)
            if (!pos || !dims) return null
            return renderGroup(n, pos, dims)
          })}

          {/* Leaves (foreground) */}
          {visibleLeaves.map(n => {
            const pos = positions.get(n.id)
            if (!pos) return null
            return renderLeaf(n, pos)
          })}
        </g>
      </svg>
    </div>
  )
}
