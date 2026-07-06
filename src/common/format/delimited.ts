import type { Decoder } from './types'
import type { RawPayload } from '@common/data_provider'

export type Row = Record<string, string>

/** Splits one line respecting double-quoted cells (matters for CSV). */
function splitLine(line: string, delim: string): string[] {
  const out: string[] = []
  let cur = '', inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else inQuotes = false
      } else cur += ch
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delim) {
      out.push(cur); cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

/** Parses delimited text (first row = headers) into row objects keyed by header. */
export function parseDelimited(text: string, delim: string): Row[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length === 0) return []
  const headers = splitLine(lines[0], delim).map(h => h.trim())
  return lines.slice(1).map(line => {
    const cells = splitLine(line, delim)
    const row: Row = {}
    headers.forEach((h, i) => { row[h] = (cells[i] ?? '').trim() })
    return row
  })
}

class DelimitedDecoder implements Decoder {
  constructor(
    readonly id: string,
    private readonly ext: RegExp,
    private readonly delim: string,
  ) {}

  supports(p: RawPayload): boolean {
    return this.ext.test(p.ref) || (p.contentType?.includes(this.id) ?? false)
  }

  decode(p: RawPayload): unknown {
    return parseDelimited(p.text, this.delim)
  }
}

export const TsvDecoder = new DelimitedDecoder('tsv', /\.tsv$/i, '\t')
export const CsvDecoder = new DelimitedDecoder('csv', /\.csv$/i, ',')
