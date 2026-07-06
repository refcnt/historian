import { z } from 'zod'

/**
 * Reusable zod building blocks that maps compose into their own document schema
 * (see maps/<map>/schema.ts). zod is confined to this file, the per-map schema
 * files, and validation.ts — see validation.ts for the isolation rationale.
 */

// ── Connections (shared shape across all maps) ──────────────────────────────
export interface ConnectionDoc {
  id:        string
  name:      string
  from:      string
  to:        string
  children?: ConnectionDoc[]
}

export const connectionSchema: z.ZodType<ConnectionDoc> = z.lazy(() =>
  z.object({
    id:       z.string(),
    name:     z.string(),
    from:     z.string(),
    to:       z.string(),
    children: z.array(connectionSchema).optional(),
  }),
) as z.ZodType<ConnectionDoc>

// ── Info blocks pass through mostly untyped (rendered as-is by panels) ──────
export const infoSchema = z.record(z.string(), z.any()).optional().default({})

// ── Node factory: builds a recursive node schema with map-specific extras ───
export function nodeSchema<T>(extra: z.ZodRawShape): z.ZodType<T> {
  const schema: z.ZodType<T> = z.lazy(() =>
    z.object({
      id:       z.string(),
      name:     z.string(),
      ...extra,
      children: z.array(schema).optional(),
    }),
  ) as unknown as z.ZodType<T>
  return schema
}

// ── Document factory: assembles the top-level document for a given map ──────
export function documentSchema<N>(mapType: string, node: z.ZodType<N>) {
  return z.object({
    mapType:     z.literal(mapType),
    name:        z.string().default(''),
    nodes:       z.array(node),
    connections: z.array(connectionSchema).default([]),
    info:        infoSchema,
  })
}
