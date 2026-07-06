import type { MapDefinition } from '@maps/map'
import { fromZod } from '@common/loader/validation'
import { buildExplorerData } from '@common/loader/build'
import { canvasDocumentSchema } from './schema'
import RendererSwitcher from './renderers'
import CanvasSidebar from './sidebar'

const validator = fromZod(canvasDocumentSchema, 'canvas')

export const canvasDefinition: MapDefinition = {
  mapType:  'canvas',
  renderer: RendererSwitcher,
  sidebar:  CanvasSidebar,
  parse(doc) {
    const data = validator.validate(doc)
    return buildExplorerData(data, (raw, node) => {
      if (raw.color) node.color = raw.color
    })
  },
}
