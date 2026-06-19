export const ICON_SIZE    = 36
export const CHILD_SIZE   = 40
export const CHILD_LABEL  = 20        // vertical space reserved for label below icon
export const CHILD_SLOT_H = CHILD_SIZE + CHILD_LABEL
export const CHILD_COL_W  = 150       // horizontal stride per column (wider than icon for labels)
export const CHILD_GAP    = 40        // vertical gap between rows
export const CHILD_COLS   = 5
export const GROUP_PAD    = 22
export const GROUP_LH     = 32        // group header height
export const CARD_W       = CHILD_COL_W - 20
export const CARD_H       = CHILD_SLOT_H + 10

export function groupDims(childCount: number): { w: number; h: number } {
  const cols = Math.min(childCount, CHILD_COLS)
  const rows = Math.ceil(childCount / cols)
  return {
    w: cols * CHILD_COL_W + GROUP_PAD * 2,
    h: rows * (CARD_H + CHILD_GAP) - CHILD_GAP + GROUP_PAD * 2 + GROUP_LH,
  }
}
