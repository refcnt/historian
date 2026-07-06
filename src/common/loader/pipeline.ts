import type { ExplorerData } from '@common/models'
import { resolveSource } from '@common/data_provider'
import { resolveDecoder } from '@common/format'
import { getMap } from '@maps/map'
import { ParseError } from './errors'

/**
 * The full input pipeline, composed of three pluggable stages:
 *   WHERE  resolveSource(ref)   — acquire raw bytes  (data_provider/*)
 *   HOW    resolveDecoder(...)  — decode to a document (format/*)
 *   WHAT   getMap(mapType)      — validate + build domain model (maps/*)
 */
export async function load(ref: string): Promise<ExplorerData> {
  const payload = await resolveSource(ref).fetch(ref)
  const doc     = resolveDecoder(payload).decode(payload)
  const mapType = readMapType(doc, ref)
  return getMap(mapType).parse(doc)
}

function readMapType(doc: unknown, ref: string): string {
  if (typeof doc !== 'object' || doc === null || typeof (doc as { mapType?: unknown }).mapType !== 'string') {
    throw new ParseError(`"${ref}": document is missing a string "mapType"`)
  }
  return (doc as { mapType: string }).mapType
}
