import { Parser } from '../../../common/loader/parser'
import type { JsonNode } from '../../../common/loader/json_schema'
import type { Node } from '../../../common/models'
import type { GeoJsonNode } from './json_schema'

export class GeoParser extends Parser {
  protected buildNodeExtras(jn: JsonNode, node: Node): void {
    const loc = (jn as GeoJsonNode).location
    if (loc) node.location = loc
  }
}
