const GOLDEN_ANGLE = 137.508

export class Styler {
  private hues = new Map<string, number>()

  next(scope: string): string {
    const h = this.hues.get(scope) ?? 0
    this.hues.set(scope, (h + GOLDEN_ANGLE) % 360)
    return `hsl(${h.toFixed(1)}, 65%, 55%)`
  }

  reset(scope?: string) {
    if (scope) this.hues.delete(scope)
    else this.hues.clear()
  }
}
