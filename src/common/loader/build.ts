import type { Node, Connection, ExplorerData, Id, InfoBlock, RequestPath } from '@common/models'
import type { ConnectionRow } from './schema'
import { ParseError } from './errors'

/**
 * Builds the domain model from the flat, table-based format: nodes reference
 * their parent by id (tree assembled here), connections reference from/to by id.
 * Maps pass an `applyNodeExtras` hook for map-specific columns (e.g. geo location).
 */

interface NodeRow { id: string; parent?: string; name: string }

interface FlatDoc<N extends NodeRow> {
  mapType:     string
  name?:       string
  info?:       Record<string, unknown>
  nodes:       N[]
  connections: ConnectionRow[]
  paths?:      RequestPath[]
}

export function buildExplorerData<N extends NodeRow>(
  doc:             FlatDoc<N>,
  applyNodeExtras: (row: N, node: Node) => void = () => {},
): ExplorerData {
  const nodes       = buildNodes(doc.nodes, applyNodeExtras)
  const connections = buildConnections(doc.connections, nodes)

  const overlap = new Set(nodes.keys()).intersection(new Set(connections.keys()))
  if (overlap.size > 0) {
    throw new ParseError(`Ids used by both nodes and connections: ${[...overlap].join(', ')}`)
  }

  return {
    mapType: doc.mapType,
    nodes,
    connections,
    info:    (doc.info ?? {}) as Record<Id, InfoBlock>,
    config:  { name: doc.name ?? '' },
    paths:   doc.paths ?? [],
  }
}

function buildNodes<N extends NodeRow>(rows: N[], applyExtras: (row: N, node: Node) => void): Map<Id, Node> {
  const map = new Map<Id, Node>()
  for (const row of rows) {
    if (map.has(row.id)) throw new ParseError(`Duplicate node id "${row.id}"`)
    const node: Node = { id: row.id, name: row.name, level: 0, parent: undefined, children: [] }
    applyExtras(row, node)
    map.set(row.id, node)
  }
  for (const row of rows) {
    if (!row.parent) continue
    const node   = map.get(row.id)!
    const parent = map.get(row.parent)
    if (!parent) throw new ParseError(`Node "${row.id}": unknown parent "${row.parent}"`)
    node.parent = parent
    parent.children.push(node)
  }
  const assignLevel = (n: Node, level: number): void => {
    n.level = level
    for (const child of n.children) assignLevel(child, level + 1)
  }
  for (const n of map.values()) if (!n.parent) assignLevel(n, 0)
  return map
}

function buildConnections(rows: ConnectionRow[], nodeMap: Map<Id, Node>): Map<Id, Connection> {
  const map = new Map<Id, Connection>()
  for (const row of rows) {
    if (map.has(row.id)) throw new ParseError(`Duplicate connection id "${row.id}"`)
    const from = nodeMap.get(row.from)
    const to   = nodeMap.get(row.to)
    if (!from || !to) {
      throw new ParseError(`Connection "${row.id}": unresolved from="${row.from}" or to="${row.to}"`)
    }
    map.set(row.id, {
      id: row.id, name: row.name, from, to,
      level: Math.max(from.level, to.level), parent: undefined, children: [],
    })
  }
  return map
}
