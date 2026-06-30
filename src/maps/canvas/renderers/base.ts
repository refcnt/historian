import type { Node, Connection } from '../../../common/models'
import type { MapRendererProps } from '../../../common/panels/builder'
import { ItemLayout } from '../layout/base'
import { getLayout } from '../layout'

export abstract class BaseRenderer {
    currLevel:  number
    hoveredId:  string | null

    nodesPerLevel:       Node[][]
    connectionsPerLevel: Connection[][]
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
        this.nodeIdLayoutMap = getLayout(config.algo as string).compute(this.nodesPerLevel, [connections])
        this.connectionsPerLevel = this.groupConnectionsByLevel(connections)
    }

    // ── Navigation ────────────────────────────────────────────────────────────

    levelDown(node: Node): void {
        if (node.children.length === 0) return
        this.currLevel++
        this.onChange()
        setTimeout(() => this.rebuildViewAndApply(this.visibleNodes()), 0)
    }

    levelUp(): void {
        if (this.currLevel === 0) return
        this.currLevel--
        this.onChange()
        setTimeout(() => this.rebuildViewAndApply(this.visibleNodes()), 0)
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
        return this.connectionsPerLevel[this.currLevel] ?? []
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
