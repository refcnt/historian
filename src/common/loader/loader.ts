import type { JsonData } from './json_schema'

export async function load(path: string): Promise<JsonData> {
  return fetch(path).then(r => r.json())
}
