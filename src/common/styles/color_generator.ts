// Golden angle (≈137.5°) distributes hues with maximum perceptual spacing
const GOLDEN_ANGLE = 137.508

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function colorForId(id: string): string {
  const hue = (hashStr(id) * GOLDEN_ANGLE) % 360
  return `hsl(${Math.round(hue)}, 80%, 62%)`
}
