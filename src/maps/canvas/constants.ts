export const ICON_SIZE    = 36
export const CHILD_SIZE   = 40
export const CHILD_LABEL  = 20        // vertical space reserved for label below icon
export const CHILD_SLOT_H = CHILD_SIZE + CHILD_LABEL
export const CHILD_COL_W  = 80        // horizontal stride per column (wider than icon for labels)
export const CHILD_GAP    = 18        // vertical gap between rows
export const CHILD_COLS   = 3
export const GROUP_PAD    = 22
export const GROUP_LH     = 32        // group header height

export function groupDims(childCount: number): { w: number; h: number } {
  const cols = Math.min(childCount, CHILD_COLS)
  const rows = Math.ceil(childCount / cols)
  return {
    w: (cols - 1) * CHILD_COL_W + CHILD_SIZE + GROUP_PAD * 2,
    h: rows * (CHILD_SLOT_H + CHILD_GAP) - CHILD_GAP + GROUP_PAD * 2 + GROUP_LH,
  }
}
