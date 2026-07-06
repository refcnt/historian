export interface DataSourceOption {
  label: string
  path:  string
}

/** Selectable data sources shown in the sidebar switcher. */
export const DATA_SOURCES: DataSourceOption[] = [
  { label: 'AWS S3 Architecture', path: '/examples/aws/manifest.json' },
  { label: 'World History (geo)', path: '/examples/history/manifest.json' },
]

export const DEFAULT_DATA = '/examples/history/manifest.json'

export function currentDataPath(): string {
  return new URLSearchParams(window.location.search).get('data') ?? DEFAULT_DATA
}

export function switchDataSource(path: string): void {
  const url = new URL(window.location.href)
  url.searchParams.set('data', path)
  window.location.href = url.toString()
}
