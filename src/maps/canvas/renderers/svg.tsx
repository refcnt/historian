import { useCallback, useEffect, useRef, useState } from 'react'
import type { MapRendererProps } from '../../../common/panels/builder'
import type { Node, Connection } from '../../../common/models'
import { colorForId } from '../../../common/styles/color_generator'
import { CARD_W, CARD_H } from '../constants'
import { truncate, edgePt, curvePath, curveMid } from './utils'
import { BaseRenderer } from './base'
import { RendererContainer } from './base.tsx'
import type { ItemLayout } from '../layout/base'

// ── SVGRenderer class ─────────────────────────────────────────────────────────

class SVGRenderer extends BaseRenderer {
    pan:   { x: number; y: number } = { x: 0, y: 0 }
    scale: number = 1
    drag:  { sx: number; sy: number; px: number; py: number } | null = null

    getViewportSize: () => { width: number; height: number } = () => ({ width: 0, height: 0 })

    init(_container: HTMLElement): void {}
    destroy(): void {}
    render(): void {}

    applyView(pan: { x: number; y: number }, scale: number): void {
        this.pan   = pan
        this.scale = scale
        this.onChange()
    }

    rebuildViewAndApply(nodes: Node[]): void {
        const { width, height } = this.getViewportSize()
        if (!width || !height) return
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
        for (const n of nodes) {
            const l = this.nodeIdLayoutMap.get(n.id)
            if (!l) continue
            const { x, y } = l.position
            const { w, h } = l.size
            minX = Math.min(minX, x - w/2); maxX = Math.max(maxX, x + w/2)
            minY = Math.min(minY, y - h/2); maxY = Math.max(maxY, y + h/2)
        }
        if (!isFinite(minX)) return
        const s = Math.min((width - 120) / (maxX - minX), (height - 120) / (maxY - minY), 1.4)
        this.applyView({ x: (width - (maxX + minX) * s) / 2, y: (height - (maxY + minY) * s) / 2 }, s)
    }

    zoomToNode(id: string): void {
        const l = this.nodeIdLayoutMap.get(id)
        if (!l) return
        const { x, y } = l.position
        const { w, h } = l.size
        const { width, height } = this.getViewportSize()
        const s = Math.min(width * 0.65 / w, height * 0.65 / h, 2.5)
        this.applyView({ x: width / 2 - x * s, y: height / 2 - y * s }, s)
    }
}

// ── Draw helpers ──────────────────────────────────────────────────────────────

function renderGroup(n: Node, l: ItemLayout, r: SVGRenderer) {
    const { x, y } = l.position
    const { w, h } = l.size
    const opacity  = r.opacityFor(n.id)
    const isDim    = opacity < 1
    const hovered  = r.hoveredId === n.id && !isDim
    const color    = n.color ?? colorForId(n.id)
    return (
        <g key={n.id} transform={`translate(${x - w/2},${y - h/2})`}
            style={{ cursor: isDim ? 'default' : 'pointer' }}
            onMouseDown={e => e.stopPropagation()}
            onMouseEnter={() => { if (!isDim) { r.setHovered(n.id); r.onHover(n) } }}
            onMouseLeave={() => { r.setHovered(null); r.onHover(null) }}
            onClick={() => !isDim && r.onSelect(n)}
            onDoubleClick={() => !isDim && r.levelDown(n)}
        >
            <rect width={w} height={h} rx={10}
                fill={color} fillOpacity={isDim ? 0.18 : hovered ? 0.80 : 0.62}
                stroke={color} strokeOpacity={isDim ? 0.35 : 1} strokeWidth={hovered ? 3 : 2}
            />
            <text x={w/2} y={15} textAnchor="middle" dominantBaseline="middle"
                fill={isDim ? color : '#ffffff'} opacity={opacity}
                fontSize={n.fontSize ?? 11} fontWeight={600} fontFamily={n.fontFamily ?? 'system-ui, sans-serif'}
            >
                {n.name}
            </text>
        </g>
    )
}

function renderConnection(c: Connection, la: ItemLayout, lb: ItemLayout, r: SVGRenderer) {
    const ep1      = edgePt(la.position.x, la.position.y, la.size, lb.position.x, lb.position.y)
    const ep2      = edgePt(lb.position.x, lb.position.y, lb.size, la.position.x, la.position.y)
    const hov      = r.hoveredId === c.id
    const d        = curvePath(ep1.x, ep1.y, ep2.x, ep2.y)
    const [lx, ly] = curveMid(ep1.x, ep1.y, ep2.x, ep2.y)
    return (
        <g key={c.id}
            onMouseEnter={() => { r.setHovered(c.id); r.onHover(c) }}
            onMouseLeave={() => { r.setHovered(null); r.onHover(null) }}
        >
            <path d={d} stroke="transparent" strokeWidth={14} fill="none" />
            <path d={d} stroke={c.color ?? '#aab'} strokeWidth={hov ? 3 : 2.2}
                strokeOpacity={hov ? 1 : 0.75} fill="none" markerEnd="url(#arrow)" />
            {hov && <>
                <rect x={lx - c.name.length * 3.3 - 6} y={ly - 10}
                    width={c.name.length * 6.6 + 12} height={17} rx={3} fill="rgba(0,0,0,0.8)" />
                <text x={lx} y={ly + 1} textAnchor="middle" dominantBaseline="middle"
                    fill="#fff" fontSize={11} fontFamily="system-ui, sans-serif">{c.name}
                </text>
            </>}
        </g>
    )
}

function renderLeaf(n: Node, l: ItemLayout, r: SVGRenderer) {
    const { x, y }  = l.position
    const hovered   = r.hoveredId === n.id
    const color     = n.color ?? colorForId(n.id)
    const iconSize  = 28
    return (
        <g key={n.id} transform={`translate(${x},${y})`} style={{ cursor: 'pointer' }}
            onMouseDown={e => e.stopPropagation()}
            onMouseEnter={() => { r.setHovered(n.id); r.onHover(n) }}
            onMouseLeave={() => { r.setHovered(null); r.onHover(null) }}
            onClick={() => r.onSelect(n)}
        >
            <rect x={-CARD_W/2} y={-CARD_H/2} width={CARD_W} height={CARD_H} rx={8}
                fill={color} fillOpacity={hovered ? 0.95 : 0.82}
                stroke={color} strokeWidth={hovered ? 2 : 1}
            />
            {n.icon
                ? <image href={n.icon} x={-iconSize/2} y={-CARD_H/2 + 8} width={iconSize} height={iconSize} />
                : <circle r={iconSize/2} cy={-CARD_H/2 + 8 + iconSize/2}
                    fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.6)" strokeWidth={1.2} />
            }
            <text x={0} y={CARD_H/2 - 10} textAnchor="middle" dominantBaseline="middle"
                fill="#ffffff" fontSize={n.fontSize ?? 9} fontWeight={600} fontFamily={n.fontFamily ?? 'system-ui, sans-serif'}
            >
                {truncate(n.name, 16)}
            </text>
        </g>
    )
}

// ── React wrapper ─────────────────────────────────────────────────────────────

export default function SVGRendererComponent({
    nodes, connections, config, focusedNode, onHover, onSelect,
}: MapRendererProps) {
    const svgRef      = useRef<SVGSVGElement>(null)
    const rendererRef = useRef<SVGRenderer | null>(null)
    const [, setTick] = useState(0)

    if (!rendererRef.current) {
        rendererRef.current = new SVGRenderer(
            config, nodes, connections, onHover, onSelect,
            () => setTick(t => t + 1),
        )
    }

    const renderer = rendererRef.current!

    renderer.getViewportSize = () => {
        if (!svgRef.current) return { width: 0, height: 0 }
        const r = svgRef.current.getBoundingClientRect()
        return { width: r.width, height: r.height }
    }

    useEffect(() => {
        renderer.rebuildViewAndApply(renderer.visibleNodes())
    }, []) // eslint-disable-line

    useEffect(() => {
        if (focusedNode) renderer.zoomToNode(focusedNode.id)
        else renderer.rebuildViewAndApply(renderer.visibleNodes())
    }, [focusedNode]) // eslint-disable-line

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!renderer.drag) return
        renderer.applyView(
            { x: renderer.drag.px + e.clientX - renderer.drag.sx, y: renderer.drag.py + e.clientY - renderer.drag.sy },
            renderer.scale,
        )
    }, [renderer])

    const handleMouseUp = useCallback(() => { renderer.drag = null }, [renderer])

    const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
        e.preventDefault()
        if (!svgRef.current) return
        const s2   = Math.max(0.08, Math.min(5, renderer.scale * (e.deltaY < 0 ? 1.1 : 0.9)))
        const rect = svgRef.current.getBoundingClientRect()
        const mx   = e.clientX - rect.left, my = e.clientY - rect.top
        renderer.applyView(
            { x: mx - (mx - renderer.pan.x) * s2 / renderer.scale, y: my - (my - renderer.pan.y) * s2 / renderer.scale },
            s2,
        )
    }, [renderer])

    const { pan, scale } = renderer

    return (
        <RendererContainer currentDepth={renderer.currLevel} onLevelBack={() => renderer.levelUp()}>
            <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block', background: '#0a0e1a' }}
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
                        style={{ cursor: renderer.drag ? 'grabbing' : 'grab' }}
                        onMouseDown={e => {
                            renderer.drag = { sx: e.clientX, sy: e.clientY, px: renderer.pan.x, py: renderer.pan.y }
                        }}
                    />
                    {renderer.visibleNodes().filter(n => n.children.length > 0).map(n => {
                        const l = renderer.nodeIdLayoutMap.get(n.id)
                        return l ? renderGroup(n, l, renderer) : null
                    })}
                    {renderer.visibleConnections().map(c => {
                        const la = renderer.nodeIdLayoutMap.get(c.from.id)
                        const lb = renderer.nodeIdLayoutMap.get(c.to.id)
                        return la && lb ? renderConnection(c, la, lb, renderer) : null
                    })}
                    {renderer.visibleNodes().filter(n => n.children.length === 0).map(n => {
                        const l = renderer.nodeIdLayoutMap.get(n.id)
                        return l ? renderLeaf(n, l, renderer) : null
                    })}
                </g>
            </svg>
        </RendererContainer>
    )
}
