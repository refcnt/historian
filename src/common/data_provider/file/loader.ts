import type { DataSource, RawPayload } from '../types'
import { ParseError } from '@common/loader/errors'

/**
 * Fetches a file by path or URL (bundled examples, static hosting, remote URL).
 * The default source — matches any ref.
 */
export class FileDataSource implements DataSource {
  readonly id = 'file'

  supports(_ref: string): boolean {
    return true
  }

  async fetch(ref: string): Promise<RawPayload> {
    let res: Response
    try {
      res = await fetch(ref)
    } catch (e) {
      throw new ParseError(`Failed to fetch "${ref}": ${String(e)}`)
    }
    if (!res.ok) {
      throw new ParseError(`Failed to fetch "${ref}": ${res.status} ${res.statusText}`)
    }
    return {
      ref,
      text:        await res.text(),
      contentType: res.headers.get('content-type') ?? undefined,
    }
  }
}
