import type { Decoder } from './types'
import type { RawPayload } from '@common/data_provider'
import { JsonDecoder } from './json'
import { YamlDecoder } from './yaml'
import { ParseError } from '@common/loader/errors'

export type { Decoder } from './types'

// Ordered by specificity; the first decoder that supports the payload wins.
// Add new formats (toml, csv, …) here.
const DECODERS: Decoder[] = [
  new JsonDecoder(),
  new YamlDecoder(),
]

export function resolveDecoder(payload: RawPayload): Decoder {
  const decoder = DECODERS.find(d => d.supports(payload))
  if (!decoder) throw new ParseError(`No decoder can handle "${payload.ref}" (${payload.contentType ?? 'unknown type'})`)
  return decoder
}
