import type { Decoder } from './types'
import type { RawPayload } from '@common/data_provider'
import { ParseError } from '@common/loader/errors'

export class JsonDecoder implements Decoder {
  readonly id = 'json'

  supports(p: RawPayload): boolean {
    return (p.contentType?.includes('json') ?? false) || p.ref.endsWith('.json')
  }

  decode(p: RawPayload): unknown {
    try {
      return JSON.parse(p.text)
    } catch (e) {
      throw new ParseError(`Invalid JSON in "${p.ref}": ${String(e)}`)
    }
  }
}
