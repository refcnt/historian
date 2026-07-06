import type { Node, Connection, ExplorerData, Id, InfoBlock, RequestPath } from '@common/models'
import type { ConnectionDoc } from './schema'
import { ParseError } from './errors'

/**
 * Pure, reusable parsing helpers shared by every map's `parse`. Maps compose
 * these (passing their own `applyNodeExtras`) instead of subclassing a parser —
 * so map-specific fields stay type-safe with no downcasts.
 */

interface NodeDoc {
  id:        string
  name:      string
  children?: NodeDoc[]
}

interface DocumentDoc<N extends NodeDoc> {
  mapType:     string
  name?:       string
  nodes:       N[]
  connections: ConnectionDoc[]
  info:        Record<string, unknown>
  paths?:      RequestPath[]
}

export function buildExplorerData<N extends NodeDoc>(
  doc:             DocumentDoc<N>,
  applyNodeExtras: (raw: N, node: Node) => void = () => {},
): ExplorerData {
  const nodes   = buildNodes(doc.nodes, applyNodeExtras)
  const nodeMap = toMap(nodes)

  const connections   = buildConnections(doc.connections, nodeMap)
  const connectionMap = toMap(connections)

  const overlap = new Set(nodeMap.keys()).intersection(new Set(connectionMap.keys()))
  if (overlap.size > 0) {
    throw new ParseError(`Ids used by both nodes and connections: ${[...overlap].join(', ')}`)
  }

  return {
    mapType:     doc.mapType,
    nodes:       nodeMap,
    connections: connectionMap,
    info:        doc.info as Record<Id, InfoBlock>,
    config:      { name: doc.name ?? '' },
    paths:       doc.paths ?? [],
  }
}

function buildNodes<N extends NodeDoc>(
  raws:            N[],
  applyNodeExtras: (raw: N, node: Node) => void,
  parent?:         Node,
  level = 0,
): Node[] {
  const result: Node[] = []
  for (const raw of raws) {
    const node: Node = { id: raw.id, name: raw.name, level, parent, children: [] }
    if (raw.children) {
      node.children = buildNodes(raw.children as N[], applyNodeExtras, node, level + 1)
    }
    applyNodeExtras(raw, node)
    result.push(node)
  }
  return result
}

function buildConnections(
  raws:    ConnectionDoc[],
  nodeMap: Map<Id, Node>,
  parent?: Connection,
  level = 0,
): Connection[] {
  const result: Connection[] = []
  for (const raw of raws) {
    const from = nodeMap.get(raw.from)
    const to   = nodeMap.get(raw.to)
    if (!from || !to) {
      throw new ParseError(`Connection "${raw.id}": unresolved from="${raw.from}" or to="${raw.to}"`)
    }
    const conn: Connection = { id: raw.id, name: raw.name, from, to, level, parent, children: [] }
    if (raw.children) {
      conn.children = buildConnections(raw.children, nodeMap, conn, level + 1)
    }
    result.push(conn)
  }
  return result
}

function toMap<T extends { id: Id; children: T[] }>(items: T[], map: Map<Id, T> = new Map()): Map<Id, T> {
  for (const item of items) {
    if (map.has(item.id)) {
      throw new ParseError(`Duplicate id "${item.id}"`)
    }
    map.set(item.id, item)
    if (item.children.length > 0) {
      toMap(item.children, map)
    }
  }
  return map
}
