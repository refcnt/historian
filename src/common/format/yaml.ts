import { parse } from 'yaml'
import type { Decoder } from './types'
import type { RawPayload } from '@common/data_provider'
import { ParseError } from '@common/loader/errors'

export class YamlDecoder implements Decoder {
  readonly id = 'yaml'

  supports(p: RawPayload): boolean {
    return (p.contentType?.includes('yaml') ?? false) || /\.ya?ml$/.test(p.ref)
  }

  decode(p: RawPayload): unknown {
    try {
      return parse(p.text)
    } catch (e) {
      throw new ParseError(`Invalid YAML in "${p.ref}": ${String(e)}`)
    }
  }
}
