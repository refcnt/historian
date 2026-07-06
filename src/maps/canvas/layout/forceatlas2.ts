import Graph from 'graphology'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import type { Node, Connection } from '@common/models'
import { BaseLayout, ItemLayout } from './base'
import { ICON_SIZE, CHILD_LABEL } from '@maps/canvas/constants'
import { hashStr, seededRng } from '@common/layout/utils'

export class ForceAtlas2Layout extends BaseLayout {
  compute(nodes: Node[], connections: Connection[]): Map<string, ItemLayout> {
    const getLevel = (n: Node): number => n.parent ? getLevel(n.parent) + 1 : 0
    const levelMap = new Map(nodes.map(n => [n.id, getLevel(n)]))
    const sizes       = new Map(nodes.map(n => [n.id, { w: ICON_SIZE, h: ICON_SIZE + CHILD_LABEL }]))
    if (nodes.length === 0) return new Map()

    const rng = seededRng(hashStr(nodes.map(n => n.id).join(',')))
    const spread = 1000

    const graph = new Graph()
    for (const n of nodes) {
      graph.addNode(n.id, {
        x: (rng() - 0.5) * spread,
        y: (rng() - 0.5) * spread,
      })
    }
    for (const c of connections) {
      if (c.from.id === c.to.id) continue
      if (!graph.hasEdge(c.from.id, c.to.id)) {
        graph.addEdge(c.from.id, c.to.id)
      }
    }

    for (const [a, b] of this.siblingPairs(nodes))
      if (!graph.hasEdge(a, b)) graph.addEdge(a, b)

    const settings = forceAtlas2.inferSettings(graph)
    settings.scalingRatio = 4
    forceAtlas2.assign(graph, { iterations: 500, settings })

    const result = new Map<string, ItemLayout>()
    for (const n of nodes) {
      const attrs = graph.getNodeAttributes(n.id)
      const s     = sizes.get(n.id)!
      result.set(n.id, new ItemLayout(attrs.x as number, attrs.y as number, s.w, s.h, levelMap.get(n.id) ?? 0))
    }
    return result
  }
}
