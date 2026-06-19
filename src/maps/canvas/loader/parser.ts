import { Parser } from '../../../common/loader/parser'
import type { JsonNode, JsonData } from '../../../common/loader/json_schema'
import type { Node, ExplorerData } from '../../../common/models'
import type { CanvasJsonData, CanvasJsonNode, NodeStyle } from './json_schema'

export class CanvasParser extends Parser {
  private styles: Record<string, NodeStyle> = {}

  build(raw: JsonData): ExplorerData {
    const canvasRaw = raw as CanvasJsonData
    this.styles = canvasRaw.styles ?? {}
    const data = super.build(raw)
    data.config = { algo: canvasRaw.algo ?? 'hierarchical' }
    return data
  }

  // Resolve style chain with inheritance (child overrides parent)
  private resolveStyle(name: string, visited = new Set<string>()): NodeStyle {
    if (visited.has(name)) return {}
    visited.add(name)
    const s = this.styles[name]
    if (!s) return {}
    if (!s.extends) return s
    const base = this.resolveStyle(s.extends, visited)
    return { ...base, ...s, extends: undefined }
  }

  protected buildNodeExtras(jn: JsonNode, node: Node): void {
    const cjn = jn as CanvasJsonNode
    const s = cjn.style ? this.resolveStyle(cjn.style) : {}

    if (!node.color && s.color)      node.color      = s.color
    if (s.icon)                       node.icon       = s.icon
    if (cjn.minSize ?? s.minSize)     node.minSize    = cjn.minSize ?? s.minSize
    if (s.fontSize)                   node.fontSize   = s.fontSize
    if (s.fontColor)                  node.fontColor  = s.fontColor
    if (s.fontFamily)                 node.fontFamily = s.fontFamily
  }
}
