import { z } from 'zod'

/**
 * Row schemas + cell helpers for the flat, table-based input format. Each map
 * composes these into its document schema (see maps/<map>/schema.ts). zod is
 * confined to schema files + validation.ts.
 */

export const connectionRowSchema = z.object({
  id:   z.string().min(1),
  from: z.string().min(1),
  to:   z.string().min(1),
  name: z.string().optional().default(''),
})
export type ConnectionRow = z.infer<typeof connectionRowSchema>

/** Optional parent cell: empty string → undefined. */
export const parentCell = z.string().optional().transform(s => (s && s.length ? s : undefined))

/** Parses a `k=v;k2=v2` cell into an object (or undefined when empty). */
export function parseKvCell(cell?: string): Record<string, string> | undefined {
  if (!cell) return undefined
  const out: Record<string, string> = {}
  for (const part of cell.split(';')) {
    const s = part.trim()
    if (!s) continue
    const i = s.indexOf('=')
    if (i === -1) out[s] = ''
    else out[s.slice(0, i).trim()] = s.slice(i + 1).trim()
  }
  return Object.keys(out).length ? out : undefined
}

/** Optional number from a string cell. */
export function numCell(cell?: string): number | undefined {
  if (cell == null || cell === '') return undefined
  const n = Number(cell)
  return Number.isFinite(n) ? n : undefined
}
