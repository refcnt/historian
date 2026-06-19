import type { JsonNode, JsonData } from '../../../common/loader/json_schema'

export interface GeoJsonNode extends JsonNode {
  location: { lat: number; lon: number; zoom: number; iso?: string[] }
  children?: GeoJsonNode[]
}

export interface GeoJsonData extends JsonData {
  nodes: GeoJsonNode[]
}
