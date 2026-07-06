import type { RawPayload } from '@common/data_provider'

/**
 * A pluggable way to decode raw payload text into a generic document object.
 * Register implementations in format/index.ts.
 */
export interface Decoder {
  readonly id: string
  supports(payload: RawPayload): boolean
  decode(payload: RawPayload): unknown
}
