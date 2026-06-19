import type { Node, Connection, ExplorerData, Id, InfoBlock } from '../models'
import type { JsonNode, JsonConnection, JsonData } from './json_schema'

export class Parser {
  build(raw: JsonData): ExplorerData {
    const info = raw.info as Record<Id, InfoBlock>
    const nodes = this.buildNodes(raw.nodes, info)
    const connections = this.buildConnections(raw.connections, info, nodes)
    return { nodes, connections, config: {} }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected buildNodeExtras(_jn: JsonNode, _node: Node): void {}

  private buildNodes(
    jsonNodes: JsonNode[],
    info: Record<Id, InfoBlock>,
    parent?: Node,
  ): Map<Id, Node> {
    const map = new Map<Id, Node>()
    for (const jn of jsonNodes) {
      const node: Node = {
        id:       jn.id,
        name:     jn.name,
        color:    jn.color,
        weight:   jn.weight,
        info:     info[jn.id],
        fromTs:   jn.fromTs,
        toTs:     jn.toTs,
        parent,
        children: [],
      }
      this.buildNodeExtras(jn, node)
      if (jn.children) {
        const childMap = this.buildNodes(jn.children, info, node)
        node.children = [...childMap.values()]
        for (const [id, n] of childMap) map.set(id, n)
      }
      map.set(node.id, node)
    }
    return map
  }

  private buildConnections(
    jsonConns: JsonConnection[],
    info: Record<Id, InfoBlock>,
    nodeMap: Map<Id, Node>,
    parent?: Connection,
  ): Map<Id, Connection> {
    const map = new Map<Id, Connection>()
    for (const jc of jsonConns) {
      const fromNode = nodeMap.get(jc.from)
      const toNode   = nodeMap.get(jc.to)
      if (!fromNode || !toNode) {
        console.warn(`Connection "${jc.id}": unresolved from="${jc.from}" or to="${jc.to}"`)
        continue
      }
      const conn: Connection = {
        id:       jc.id,
        name:     jc.name,
        from:     fromNode,
        to:       toNode,
        color:    jc.color,
        weight:   jc.weight,
        info:     info[jc.id],
        fromTs:   jc.fromTs,
        toTs:     jc.toTs,
        parent,
        children: [],
      }
      if (jc.children) {
        const childMap = this.buildConnections(jc.children, info, nodeMap, conn)
        conn.children = [...childMap.values()]
        for (const [id, c] of childMap) map.set(id, c)
      }
      map.set(conn.id, conn)
    }
    return map
  }
}
