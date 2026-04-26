export const MAX_CELLS_FOR_STATS = 50_000

export interface SelectionRange {
  range: {
    startRowIndex: number
    endRowIndex: number
    startColumnIndex: number
    endColumnIndex: number
  }
}

export interface MergeRange {
  startRowIndex: number
  endRowIndex: number
  startColumnIndex: number
  endColumnIndex: number
}

export interface SelectionStats {
  sum: number
  average: number | undefined
  count: number
  numericCount: number
}

export type GetEffectiveValue = (sheetId: number, rowIndex: number, columnIndex: number) => unknown

/**
 * Computes sum, average, and count statistics for a set of spreadsheet selections.
 *
 * - Returns null if fewer than 2 cells are covered, or if no non-empty cells exist.
 * - `count` reflects all non-empty cells (any type).
 * - `sum` and `average` reflect only finite numeric values.
 * - Skips non-owner cells in merged regions to avoid double-counting.
 * - Stops processing after MAX_CELLS_FOR_STATS cells to bound CPU cost.
 */
export function computeSelectionStats(
  sheetId: number,
  selections: SelectionRange[],
  merges: MergeRange[] | undefined,
  getEffectiveValue: GetEffectiveValue,
  maxCells = MAX_CELLS_FOR_STATS,
): SelectionStats | null {
  if (!selections.length) return null

  // Quick check: only bother if more than one cell is covered
  let totalCells = 0
  for (const sel of selections) {
    const { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } = sel.range
    totalCells += (endRowIndex - startRowIndex + 1) * (endColumnIndex - startColumnIndex + 1)
  }
  if (totalCells <= 1) return null

  // Build a set of non-owner cells inside merged regions so we don't double-count
  const nonOwnerCells = new Set<string>()
  if (merges) {
    for (const merge of merges) {
      for (let r = merge.startRowIndex; r <= merge.endRowIndex; r++) {
        for (let c = merge.startColumnIndex; c <= merge.endColumnIndex; c++) {
          if (r !== merge.startRowIndex || c !== merge.startColumnIndex) {
            nonOwnerCells.add(`${r}:${c}`)
          }
        }
      }
    }
  }

  let sum = 0
  let numericCount = 0
  let nonEmptyCount = 0
  let processed = 0

  for (const sel of selections) {
    const { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } = sel.range
    for (let r = startRowIndex; r <= endRowIndex && processed < maxCells; r++) {
      for (let c = startColumnIndex; c <= endColumnIndex && processed < maxCells; c++) {
        if (nonOwnerCells.has(`${r}:${c}`)) continue
        processed++

        const value = getEffectiveValue(sheetId, r, c)
        if (value !== undefined && value !== null && value !== '') {
          nonEmptyCount++
          if (typeof value === 'number' && isFinite(value)) {
            sum += value
            numericCount++
          }
        }
      }
    }
  }

  if (nonEmptyCount === 0) return null

  return {
    sum,
    average: numericCount > 0 ? sum / numericCount : undefined,
    count: nonEmptyCount,
    numericCount,
  }
}

/**
 * Formats a number for display in the selection stats bar.
 * Uses toPrecision(10) to eliminate floating-point display artifacts,
 * then formats with the user's locale.
 */
export function formatStatNumber(n: number): string {
  const rounded = parseFloat(n.toPrecision(10))
  return rounded.toLocaleString(undefined, { maximumFractionDigits: 10 })
}
