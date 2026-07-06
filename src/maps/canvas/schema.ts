import { z } from 'zod'
import { connectionRowSchema, parentCell } from '@common/loader/schema'

export const canvasNodeRow = z.object({
  id:     z.string().min(1),
  parent: parentCell,
  name:   z.string(),
})
export type CanvasNodeRow = z.infer<typeof canvasNodeRow>

export const pathRow = z.object({
  id:   z.string().min(1),
  name: z.string(),
})

export const pathStepRow = z.object({
  pathId:      z.string().min(1),
  order:       z.string().optional(),
  from:        z.string().min(1),
  to:          z.string().min(1),
  method:      z.string().optional(),
  path:        z.string().optional(),
  reqPerSec:   z.string().optional(),
  bytesPerSec: z.string().optional(),
  headers:     z.string().optional(),
  queryParams: z.string().optional(),
})
export type PathStepRow = z.infer<typeof pathStepRow>

export const canvasDocumentSchema = z.object({
  mapType:     z.literal('canvas'),
  name:        z.string().default(''),
  info:        z.record(z.string(), z.any()).optional().default({}),
  nodes:       z.array(canvasNodeRow),
  connections: z.array(connectionRowSchema).optional().default([]),
  paths:       z.array(pathRow).optional().default([]),
  pathSteps:   z.array(pathStepRow).optional().default([]),
})
export type CanvasDocument = z.infer<typeof canvasDocumentSchema>
