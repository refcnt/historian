import type { Node, Connection, RequestPath } from '@common/models'
import type { MapRendererProps } from '@common/models'
import { ItemLayout } from '@maps/canvas/layout/base'
import { getLayout } from '@maps/canvas/layout'
import { colorForId } from '@common/styles/color_generator'

export interface PathEdgeMark  { color: string; order: number }
export interface PathEdgeGroup { fromId: string; toId: string; marks: PathEdgeMark[] }

export abstract class BaseRenderer {
    currLevel:  number
    hoveredId:  string | null

    // Connection filter driven by the sidebar (null/empty = show all).
    activeNodeIds: Set<string> | null = null
    // Active request paths, highlighted as an overlay resolved to the current level.
    activePaths: RequestPath[] = []
    // Notifies the React shell when the current level (and its nodes) changes.
    onLevelChange?: (level: number, nodes: Node[]) => void

    nodesPerLevel:       Node[][]
    connectionsPerLevel: Connection[][]
    nodeById:            Map<string, Node>
    nodeIdLayoutMap:     Map<string, ItemLayout>

    onHover:  (item: Node | Connection | null) => void
    onSelect: (node: Node) => void
    protected onChange: () => void

    constructor(
        config:      Record<string, unknown>,
        nodes:       Node[],
        connections: Connection[],
        onHover:     MapRendererProps['onHover'],
        onSelect:    MapRendererProps['onSelect'],
        onChange:    () => void,
    ) {
        this.currLevel = 0
        this.hoveredId = null
        this.onHover   = onHover
        this.onSelect  = onSelect
        this.onChange  = onChange

        this.nodesPerLevel   = this.groupByLevel(nodes)
        this.nodeIdLayoutMap = getLayout(config.algo as string).compute(nodes, connections)
        this.connectionsPerLevel = this.groupConnectionsByLevel(connections)
        this.nodeById = new Map(this.nodesPerLevel.flat().map(n => [n.id, n]))
    }

    // ── Navigation ────────────────────────────────────────────────────────────

    levelDown(node: Node): void {
        if (node.children.length === 0) return
        this.currLevel++
        this.emitLevel()
        this.onChange()
        setTimeout(() => this.rebuildViewAndApply(this.visibleNodes()), 0)
    }

    levelUp(): void {
        if (this.currLevel === 0) return
        this.currLevel--
        this.emitLevel()
        this.onChange()
        setTimeout(() => this.rebuildViewAndApply(this.visibleNodes()), 0)
    }

    emitLevel(): void {
        this.onLevelChange?.(this.currLevel, this.nodesPerLevel[this.currLevel] ?? [])
    }

    // ── Hover ─────────────────────────────────────────────────────────────────

    setHovered(id: string | null): void {
        this.hoveredId = id
        this.onChange()
    }

    // ── Visibility ────────────────────────────────────────────────────────────

    visibleNodes(): Node[] {
        return this.nodesPerLevel.slice(0, this.currLevel + 1).flat()
    }

    visibleConnections(): Connection[] {
        const conns  = this.connectionsPerLevel[this.currLevel] ?? []
        const active = this.activeNodeIds
        if (!active || active.size === 0) return conns
        // An endpoint counts if it (or any ancestor) is selected, so selecting a
        // group filters to its whole subtree's connections at any level.
        const covered = (node: Node | undefined): boolean => {
            for (let cur = node; cur; cur = cur.parent) if (active.has(cur.id)) return true
            return false
        }
        return conns.filter(c => covered(c.from) || covered(c.to))
    }

    pathsActive(): boolean {
        return this.activePaths.length > 0
    }

    // Resolves active request paths to overlay edges for the CURRENT level: each hop's
    // endpoint is mapped to its deepest visible ancestor, so at coarse levels hops
    // aggregate to group boxes and at deep levels they reach the actual child node.
    // Edges sharing a node pair are merged so their colours/orders stack.
    pathEdgeGroups(): PathEdgeGroup[] {
        if (this.activePaths.length === 0) return []
        const L = this.currLevel
        const rep = (id: string): Node | undefined => {
            let n = this.nodeById.get(id)
            while (n && n.level > L && n.parent) n = n.parent
            return n
        }
        const groups = new Map<string, PathEdgeGroup>()
        for (const path of this.activePaths) {
            const color = path.color ?? colorForId(path.id)
            const seen  = new Set<string>()
            path.steps.forEach((step, i) => {
                const a = rep(step.from), b = rep(step.to)
                if (!a || !b || a.id === b.id) return           // hop internal to a collapsed group
                if (seen.has(`${a.id}|${b.id}`)) return          // dedupe aggregated hops within a path
                seen.add(`${a.id}|${b.id}`)
                const key = a.id < b.id ? `${a.id}~${b.id}` : `${b.id}~${a.id}`
                const g = groups.get(key) ?? { fromId: a.id, toId: b.id, marks: [] }
                g.marks.push({ color, order: i + 1 })
                groups.set(key, g)
            })
        }
        return [...groups.values()]
    }

    opacityFor(id: string): number {
        const level    = this.nodeIdLayoutMap.get(id)?.level ?? this.currLevel
        const distance = this.currLevel - level
        return Math.max(0.2, 1 - distance * 0.35)
    }

    // ── Abstract ──────────────────────────────────────────────────────────────

    abstract init(container: HTMLElement): void
    abstract destroy(): void
    abstract rebuildViewAndApply(nodes: Node[]): void
    abstract zoomToNode(id: string): void
    abstract render(): void

    // ── Private ───────────────────────────────────────────────────────────────

    private groupByLevel(items: Node[]): Node[][] {
        const result: Node[][] = []
        const visit = (levelItems: Node[], level: number): void => {
            if (!result[level]) result[level] = []
            for (const item of levelItems) {
                result[level].push(item)
                if (item.children.length > 0) visit(item.children, level + 1)
            }
        }
        visit(items, 0)
        return result
    }

    private groupConnectionsByLevel(connections: Connection[]): Connection[][] {
        const result: Connection[][] = []
        for (const c of connections) {
            const level = Math.max(
                this.nodeIdLayoutMap.get(c.from.id)?.level ?? 0,
                this.nodeIdLayoutMap.get(c.to.id)?.level   ?? 0,
            )
            if (!result[level]) result[level] = []
            result[level].push(c)
        }
        return result
    }
}
