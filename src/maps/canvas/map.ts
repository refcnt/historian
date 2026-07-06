import type { MapDefinition } from '@maps/map'
import type { RequestPath, RequestStep } from '@common/models'
import { fromZod } from '@common/loader/validation'
import { buildExplorerData } from '@common/loader/build'
import { numCell, parseKvCell } from '@common/loader/schema'
import { canvasDocumentSchema } from './schema'
import type { PathStepRow } from './schema'
import RendererSwitcher from './renderers'
import CanvasSidebar from './sidebar'

const validator = fromZod(canvasDocumentSchema, 'canvas')

export const canvasDefinition: MapDefinition = {
  mapType:  'canvas',
  renderer: RendererSwitcher,
  sidebar:  CanvasSidebar,
  parse(doc) {
    const data = validator.validate(doc)
    return buildExplorerData({
      mapType:     data.mapType,
      name:        data.name,
      info:        data.info,
      nodes:       data.nodes,
      connections: data.connections,
      paths:       assemblePaths(data.paths, data.pathSteps),
    })
  },
}

function assemblePaths(
  paths: { id: string; name: string }[],
  steps: PathStepRow[],
): RequestPath[] {
  const byId = new Map<string, RequestPath>(paths.map(p => [p.id, { id: p.id, name: p.name, steps: [] }]))
  const ordered = [...steps].sort((a, b) => (numCell(a.order) ?? 0) - (numCell(b.order) ?? 0))
  for (const s of ordered) {
    const path = byId.get(s.pathId)
    if (!path) continue
    const step: RequestStep = {
      from:        s.from,
      to:          s.to,
      method:      s.method || undefined,
      path:        s.path || undefined,
      reqPerSec:   numCell(s.reqPerSec),
      bytesPerSec: numCell(s.bytesPerSec),
      headers:     parseKvCell(s.headers),
      queryParams: parseKvCell(s.queryParams),
    }
    path.steps.push(step)
  }
  return [...byId.values()]
}
