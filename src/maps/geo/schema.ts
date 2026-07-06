import { z } from 'zod'
import { nodeSchema, documentSchema } from '@common/loader/schema'

export const locationSchema = z.object({
  lat:  z.number(),
  lon:  z.number(),
  zoom: z.number(),
  iso:  z.array(z.string()).optional(),
})

export interface GeoNodeDoc {
  id:        string
  name:      string
  location?: z.infer<typeof locationSchema>
  children?: GeoNodeDoc[]
}

export const geoNodeSchema     = nodeSchema<GeoNodeDoc>({ location: locationSchema.optional() })
export const geoDocumentSchema = documentSchema('geo', geoNodeSchema)
export type  GeoDocument       = z.infer<typeof geoDocumentSchema>
