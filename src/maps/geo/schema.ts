import { z } from 'zod'
import { connectionRowSchema, parentCell } from '@common/loader/schema'

export const geoNodeRow = z.object({
  id:     z.string().min(1),
  parent: parentCell,
  name:   z.string(),
  lat:    z.string().optional(),
  lon:    z.string().optional(),
  zoom:   z.string().optional(),
  iso:    z.string().optional(),
})
export type GeoNodeRow = z.infer<typeof geoNodeRow>

export const geoDocumentSchema = z.object({
  mapType:     z.literal('geo'),
  name:        z.string().default(''),
  info:        z.record(z.string(), z.any()).optional().default({}),
  nodes:       z.array(geoNodeRow),
  connections: z.array(connectionRowSchema).optional().default([]),
})
export type GeoDocument = z.infer<typeof geoDocumentSchema>
