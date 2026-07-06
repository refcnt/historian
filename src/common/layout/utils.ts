export function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h
}

export function seededRng(seed: number) {
  let s = Math.abs(seed) | 1
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}
