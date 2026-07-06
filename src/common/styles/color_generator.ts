import { hashStr } from '@common/layout/utils'

// Golden angle (≈137.5°) distributes hues with maximum perceptual spacing
const GOLDEN_ANGLE = 137.508

export function colorForId(id: string): string {
  const hue = (hashStr(id) * GOLDEN_ANGLE) % 360
  return `hsl(${Math.round(hue)}, 80%, 62%)`
}
