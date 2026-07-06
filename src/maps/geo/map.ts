import type { MapDefinition } from '@maps/map'
import { fromZod } from '@common/loader/validation'
import { buildExplorerData } from '@common/loader/build'
import { numCell } from '@common/loader/schema'
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
    return buildExplorerData(
      {
        mapType:     data.mapType,
        name:        data.name,
        info:        data.info,
        nodes:       data.nodes,
        connections: data.connections,
      },
      (row, node) => {
        const lat = numCell(row.lat)
        const lon = numCell(row.lon)
        if (lat != null && lon != null) {
          node.location = {
            lat, lon,
            zoom: numCell(row.zoom) ?? 3,
            iso:  row.iso ? row.iso.split(';').map(s => s.trim()).filter(Boolean) : undefined,
          }
        }
      },
    )
  },
}
