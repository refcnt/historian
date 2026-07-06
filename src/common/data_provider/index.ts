import type { DataSource } from './types'
import { FileDataSource } from './file/loader'
import { ParseError } from '@common/loader/errors'

export type { DataSource, RawPayload } from './types'

// Ordered by specificity; the first source that supports the ref wins.
// Add new sources (upload, inline, api, …) here.
const SOURCES: DataSource[] = [
  new FileDataSource(),
]

export function resolveSource(ref: string): DataSource {
  const source = SOURCES.find(s => s.supports(ref))
  if (!source) throw new ParseError(`No data source can handle "${ref}"`)
  return source
}
