import type { MapDefinition } from '@maps/map'
import { fromZod } from '@common/loader/validation'
import { buildExplorerData } from '@common/loader/build'
import { geoDocumentSchema } from './schema'
import GeoRenderer from './render'
import GeoSidebar from './sidebar'

const validator = fromZod(geoDocumentSchema, 'geo')

export const geoDefinition: MapDefinition = {
  mapType:  'geo',
  renderer: GeoRenderer,
  sidebar:  GeoSidebar,
  parse(doc) {
    const data = validator.validate(doc)
    return buildExplorerData(data, (raw, node) => {
      if (raw.location) node.location = raw.location
    })
  },
}
