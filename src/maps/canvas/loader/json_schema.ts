import type { JsonNode, JsonData } from '../../../common/loader/json_schema'

export interface NodeStyle {
  extends?:    string
  color?:      string
  icon?:       string
  minSize?:    number
  fontSize?:   number
  fontColor?:  string
  fontFamily?: string
}

export interface CanvasJsonNode extends JsonNode {
  style?:    string
  minSize?:  number
  children?: CanvasJsonNode[]
}

export interface CanvasJsonData extends JsonData {
  styles?: Record<string, NodeStyle>
  algo?:   string
  nodes:   CanvasJsonNode[]
}
