import { z } from 'zod'
import { nodeSchema, documentSchema } from '@common/loader/schema'

export interface CanvasNodeDoc {
  id:        string
  name:      string
  color?:    string
  children?: CanvasNodeDoc[]
}

export const canvasNodeSchema = nodeSchema<CanvasNodeDoc>({ color: z.string().optional() })

// A request path: an ordered list of hops, each carrying its own metadata.
const requestStepSchema = z.object({
  from:        z.string(),
  to:          z.string(),
  method:      z.string().optional(),
  path:        z.string().optional(),
  queryParams: z.record(z.string(), z.string()).optional(),
  headers:     z.record(z.string(), z.string()).optional(),
  reqPerSec:   z.number().optional(),
  bytesPerSec: z.number().optional(),
})

const requestPathSchema = z.object({
  id:    z.string(),
  name:  z.string(),
  color: z.string().optional(),
  steps: z.array(requestStepSchema),
})

export const canvasDocumentSchema = documentSchema('canvas', canvasNodeSchema).extend({
  paths: z.array(requestPathSchema).optional().default([]),
})
export type CanvasDocument = z.infer<typeof canvasDocumentSchema>
