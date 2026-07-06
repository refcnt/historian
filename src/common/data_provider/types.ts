/** Raw bytes fetched from some source, before any format decoding. */
export interface RawPayload {
  ref:          string   // the reference that was resolved (path, url, …)
  text:         string
  contentType?: string
}

/**
 * A pluggable place data can be acquired FROM (bundled file, url, upload, …).
 * Register implementations in data_provider/index.ts.
 */
export interface DataSource {
  readonly id: string
  supports(ref: string): boolean
  fetch(ref: string): Promise<RawPayload>
}
