import { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import type { MapRendererProps } from '../../../common/panels/builder'
import type { Node, Connection } from '../../../common/models'
import { colorForId } from '../../../common/styles/color_generator'
import { CARD_W, CARD_H } from '../constants'
import { truncate, edgePt, curveCtrl, curveMid } from './utils'
import { BaseRenderer } from './base'
import { RendererContainer } from './base.tsx'

function cssToNum(css: string): number { return new PIXI.Color(css).toNumber() }
function numToHex(n: number):   string { return new PIXI.Color(n).toHex() }

// ── Drag state ────────────────────────────────────────────────────────────────

class Drag {
    constructor(
        public sx: number, public sy: number,
        public px: number, public py: number,
    ) {}
}

// ── PixiRenderer class ────────────────────────────────────────────────────────

class PixiRenderer extends BaseRenderer {
    private app:      PIXI.Application | null = null
    private world:    PIXI.Container   | null = null
    private pan:      { x: number; y: number } = { x: 0, y: 0 }
    private scale:    number = 1
    private drag:     Drag | null = null
    private initGen:  number = 0

    init(container: HTMLElement): void {
        if (this.app) { this.doDestroy(this.app); this.app = null; this.world = null }
        const gen = ++this.initGen
        const app = new PIXI.Application()

        app.init({ resizeTo: container, background: 0x0a0e1a, antialias: true }).then(() => {
            if (gen !== this.initGen) { this.doDestroy(app); return }

            container.appendChild(app.canvas)
            this.app = app

            const world = new PIXI.Container()
            app.stage.addChild(world)
            this.world = world

            app.stage.eventMode = 'static'
            const updateHitArea = () => {
                app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height)
            }
            updateHitArea()
            app.renderer.on('resize', updateHitArea)

            app.stage.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
                this.drag = new Drag(e.global.x, e.global.y, this.pan.x, this.pan.y)
            })
            app.stage.on('pointermove', (e: PIXI.FederatedPointerEvent) => {
                if (!this.drag) return
                this.applyView(
                    { x: this.drag.px + e.global.x - this.drag.sx, y: this.drag.py + e.global.y - this.drag.sy },
                    this.scale,
                )
            })
            app.stage.on('pointerup',    () => { this.drag = null })
            app.stage.on('pointerleave', () => { this.drag = null })

            const pixiCanvas = app.canvas as HTMLCanvasElement
            pixiCanvas.addEventListener('wheel', (e: WheelEvent) => {
                e.preventDefault()
                const s2   = Math.max(0.08, Math.min(5, this.scale * (e.deltaY < 0 ? 1.1 : 0.9)))
                const rect = pixiCanvas.getBoundingClientRect()
                const mx   = e.clientX - rect.left
                const my   = e.clientY - rect.top
                this.applyView(
                    { x: mx - (mx - this.pan.x) * s2 / this.scale, y: my - (my - this.pan.y) * s2 / this.scale },
                    s2,
                )
            }, { passive: false })

            this.render()
            setTimeout(() => this.rebuildViewAndApply(this.visibleNodes()), 50)
        })
    }

    destroy(): void {
        this.initGen++
        if (this.app) { this.doDestroy(this.app) }
        this.app   = null
        this.world = null
    }

    private doDestroy(app: PIXI.Application): void {
        app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true, context: true })
    }

    private applyView(pan: { x: number; y: number }, scale: number): void {
        this.pan   = pan
        this.scale = scale
        if (this.world) { this.world.position.set(pan.x, pan.y); this.world.scale.set(scale) }
    }

    rebuildViewAndApply(nodes: Node[]): void {
        if (!this.app) return
        const { width, height } = this.app.screen
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
        for (const n of nodes) {
            const layout = this.nodeIdLayoutMap.get(n.id)
            if (!layout) continue
            const { x, y } = layout.position
            const { w, h } = layout.size
            minX = Math.min(minX, x - w / 2); maxX = Math.max(maxX, x + w / 2)
            minY = Math.min(minY, y - h / 2); maxY = Math.max(maxY, y + h / 2)
        }
        if (!isFinite(minX)) return
        const s = Math.min((width - 120) / (maxX - minX), (height - 120) / (maxY - minY), 1.4)
        this.applyView({ x: (width - (maxX + minX) * s) / 2, y: (height - (maxY + minY) * s) / 2 }, s)
    }

    zoomToNode(id: string): void {
        if (!this.app) return
        const layout = this.nodeIdLayoutMap.get(id)
        if (!layout) return
        const { x, y } = layout.position
        const { w, h } = layout.size
        const { width, height } = this.app.screen
        const s = Math.min(width * 0.65 / w, height * 0.65 / h, 2.5)
        this.applyView({ x: width / 2 - x * s, y: height / 2 - y * s }, s)
    }

    render(): void {
        if (!this.world) return
        this.world.removeChildren().forEach(c => (c as PIXI.Container).destroy())
        this.drawGroups()
        this.drawConnections()
        this.drawLeaves()
    }

    // ── Draw helpers ──────────────────────────────────────────────────────────

    private drawGroups(): void {
        for (const n of this.visibleNodes().filter(n => n.children.length > 0)) {
            const layout = this.nodeIdLayoutMap.get(n.id)
            if (!layout) continue
            const { x, y } = layout.position
            const { w, h } = layout.size
            const opacity  = this.opacityFor(n.id)
            const isDim    = opacity < 1
            const hov      = this.hoveredId === n.id && !isDim
            const col      = cssToNum(n.color ?? colorForId(n.id))

            const g = new PIXI.Graphics()
            g.roundRect(x - w/2, y - h/2, w, h, 10)
                .fill({ color: col, alpha: isDim ? 0.18 : hov ? 0.80 : 0.62 })
                .stroke({ color: col, alpha: isDim ? 0.35 : 1, width: hov ? 3 : 2 })
            this.world!.addChild(g)

            const label = new PIXI.Text({
                text: n.name,
                style: { fill: isDim ? numToHex(col) : '#ffffff', fontSize: n.fontSize ?? 11, fontWeight: '600', fontFamily: n.fontFamily ?? 'system-ui, sans-serif' },
            })
            label.alpha = opacity
            label.anchor.set(0.5, 0.5)
            label.position.set(x, y - h/2 + 16)
            this.world!.addChild(label)

            if (!isDim) {
                const hit = new PIXI.Graphics()
                hit.rect(x - w/2, y - h/2, w, h).fill({ color: 0xffffff, alpha: 0.001 })
                hit.eventMode = 'static'
                hit.cursor = 'pointer'
                hit.on('pointerover', (e: PIXI.FederatedPointerEvent) => { e.stopPropagation(); this.setHovered(n.id); this.onHover(n) })
                hit.on('pointerout',  ()                               => { this.setHovered(null); this.onHover(null) })
                hit.on('pointerdown', (e: PIXI.FederatedPointerEvent) => { e.stopPropagation() })
                let lastTap = 0
                hit.on('pointertap',  (e: PIXI.FederatedPointerEvent) => {
                    e.stopPropagation()
                    const now = Date.now()
                    if (now - lastTap < 300) this.levelDown(n); else this.onSelect(n)
                    lastTap = now
                })
                this.world!.addChild(hit)
            }
        }
    }

    private drawConnections(): void {
        for (const c of this.visibleConnections()) {
            const la = this.nodeIdLayoutMap.get(c.from.id)
            const lb = this.nodeIdLayoutMap.get(c.to.id)
            if (!la || !lb) continue

            const ep1      = edgePt(la.position.x, la.position.y, la.size, lb.position.x, lb.position.y)
            const ep2      = edgePt(lb.position.x, lb.position.y, lb.size, la.position.x, la.position.y)
            const [qx, qy] = curveCtrl(ep1.x, ep1.y, ep2.x, ep2.y)
            const hov      = this.hoveredId === c.id
            const col      = cssToNum(c.color ?? '#aab')
            const alpha    = hov ? 1 : 0.75
            const width    = hov ? 3 : 2.2

            const g = new PIXI.Graphics()
            g.moveTo(ep1.x, ep1.y).quadraticCurveTo(qx, qy, ep2.x, ep2.y).stroke({ color: col, alpha, width })
            const tlen = Math.sqrt((ep2.x - qx) ** 2 + (ep2.y - qy) ** 2) || 1
            const tx = (ep2.x - qx) / tlen, ty = (ep2.y - qy) / tlen
            g.moveTo(ep2.x, ep2.y)
                .lineTo(ep2.x - tx*10 - ty*5, ep2.y - ty*10 + tx*5)
                .lineTo(ep2.x - tx*10 + ty*5, ep2.y - ty*10 - tx*5)
                .closePath().fill({ color: col, alpha })
            this.world!.addChild(g)

            const hit = new PIXI.Graphics()
            hit.moveTo(ep1.x, ep1.y).quadraticCurveTo(qx, qy, ep2.x, ep2.y).stroke({ color: 0xffffff, alpha: 0.001, width: 14 })
            hit.eventMode = 'static'
            hit.on('pointerover', (e: PIXI.FederatedPointerEvent) => { e.stopPropagation(); this.setHovered(c.id); this.onHover(c) })
            hit.on('pointerout',  ()                               => { this.setHovered(null); this.onHover(null) })
            hit.on('pointerdown', (e: PIXI.FederatedPointerEvent) => { e.stopPropagation() })
            this.world!.addChild(hit)

            if (hov) {
                const [lx, ly] = curveMid(ep1.x, ep1.y, ep2.x, ep2.y)
                const lbl = new PIXI.Text({ text: c.name, style: { fill: '#ffffff', fontSize: 11, fontFamily: 'system-ui, sans-serif' } })
                lbl.anchor.set(0.5, 0.5)
                lbl.position.set(lx, ly)
                const bg = new PIXI.Graphics()
                bg.roundRect(lx - lbl.width/2 - 6, ly - 8.5, lbl.width + 12, 17, 3).fill({ color: 0x000000, alpha: 0.8 })
                this.world!.addChild(bg)
                this.world!.addChild(lbl)
            }
        }
    }

    private drawLeaves(): void {
        const iconSize = 28
        for (const n of this.visibleNodes().filter(n => n.children.length === 0)) {
            const layout = this.nodeIdLayoutMap.get(n.id)
            if (!layout) continue
            const { x, y } = layout.position
            const col = cssToNum(n.color ?? colorForId(n.id))
            const hov = this.hoveredId === n.id

            const g = new PIXI.Graphics()
            g.roundRect(x - CARD_W/2, y - CARD_H/2, CARD_W, CARD_H, 8)
                .fill({ color: col, alpha: hov ? 0.95 : 0.82 })
                .stroke({ color: col, alpha: 1, width: hov ? 2 : 1 })
            g.circle(x, y - CARD_H/2 + 8 + iconSize/2, iconSize/2)
                .fill({ color: 0xffffff, alpha: 0.25 })
                .stroke({ color: 0xffffff, alpha: 0.6, width: 1.2 })
            this.world!.addChild(g)

            const lbl = new PIXI.Text({
                text: truncate(n.name, 16),
                style: { fill: '#ffffff', fontSize: n.fontSize ?? 9, fontWeight: '600', fontFamily: 'system-ui, sans-serif' },
            })
            lbl.anchor.set(0.5, 0.5)
            lbl.position.set(x, y + CARD_H/2 - 10)
            this.world!.addChild(lbl)

            const hit = new PIXI.Graphics()
            hit.rect(x - CARD_W/2, y - CARD_H/2, CARD_W, CARD_H).fill({ color: 0xffffff, alpha: 0.001 })
            hit.eventMode = 'static'
            hit.cursor = 'pointer'
            hit.on('pointerover', (e: PIXI.FederatedPointerEvent) => { e.stopPropagation(); this.setHovered(n.id); this.onHover(n) })
            hit.on('pointerout',  ()                               => { this.setHovered(null); this.onHover(null) })
            hit.on('pointerdown', (e: PIXI.FederatedPointerEvent) => { e.stopPropagation() })
            hit.on('pointertap',  (e: PIXI.FederatedPointerEvent) => { e.stopPropagation(); this.onSelect(n) })
            this.world!.addChild(hit)
        }
    }
}

// ── React wrapper ─────────────────────────────────────────────────────────────

export default function PixiRendererComponent({
    nodes, connections, config, focusedNode, onHover, onSelect,
}: MapRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const rendererRef  = useRef<PixiRenderer | null>(null)
    const [tick, setTick] = useState(0)

    if (!rendererRef.current) {
        rendererRef.current = new PixiRenderer(
            config, nodes, connections, onHover, onSelect,
            () => {
                rendererRef.current?.render()
                setTick(t => t + 1)
            },
        )
    }

    useEffect(() => {
        rendererRef.current!.init(containerRef.current!)
        return () => rendererRef.current?.destroy()
    }, [])

    useEffect(() => {
        const r = rendererRef.current
        if (!r) return
        if (focusedNode) r.zoomToNode(focusedNode.id)
        else r.rebuildViewAndApply(r.visibleNodes())
    }, [focusedNode])

    const renderer = rendererRef.current!
    return (
        <RendererContainer currentDepth={renderer.currLevel} onLevelBack={() => renderer.levelUp()}>
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </RendererContainer>
    )
}
