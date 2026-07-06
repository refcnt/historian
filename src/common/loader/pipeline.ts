import type { ExplorerData } from '@common/models'
import { resolveSource } from '@common/data_provider'
import { resolveDecoder } from '@common/format'
import { getMap } from '@maps/map'
import { readManifest } from './manifest'

/**
 * The full input pipeline:
 *   1. fetch + decode the manifest (WHERE + HOW)
 *   2. fetch + decode each referenced table (TSV/CSV → rows), relative to it
 *   3. assemble a flat document and hand it to the map for validation + build
 */
export async function load(ref: string): Promise<ExplorerData> {
  const source   = resolveSource(ref)
  const payload  = await source.fetch(ref)
  const manifest = readManifest(resolveDecoder(payload).decode(payload), ref)

  const base = new URL(ref, window.location.href)
  const tables: Record<string, unknown> = {}
  for (const [key, file] of Object.entries(manifest.tables)) {
    const url  = new URL(file, base).toString()
    const tPay = await source.fetch(url)
    tables[key] = resolveDecoder(tPay).decode(tPay)
  }

  const doc = {
    mapType: manifest.mapType,
    name:    manifest.name ?? '',
    info:    manifest.info ?? {},
    ...tables,
  }
  return getMap(manifest.mapType).parse(doc)
}
