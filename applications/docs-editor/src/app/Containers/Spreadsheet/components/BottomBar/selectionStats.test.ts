import { computeSelectionStats, formatStatNumber, MAX_CELLS_FOR_STATS } from './selectionStats'
import type { SelectionRange, MergeRange, GetEffectiveValue } from './selectionStats'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sel(
  startRowIndex: number,
  startColumnIndex: number,
  endRowIndex: number,
  endColumnIndex: number,
): SelectionRange {
  return { range: { startRowIndex, startColumnIndex, endRowIndex, endColumnIndex } }
}

function merge(
  startRowIndex: number,
  startColumnIndex: number,
  endRowIndex: number,
  endColumnIndex: number,
): MergeRange {
  return { startRowIndex, startColumnIndex, endRowIndex, endColumnIndex }
}

/**
 * Builds a simple getEffectiveValue lookup from a flat map of "row:col" -> value.
 */
function makeGetter(cells: Record<string, unknown>): GetEffectiveValue {
  return (_sheetId, rowIndex, columnIndex) => cells[`${rowIndex}:${columnIndex}`]
}

// ---------------------------------------------------------------------------
// computeSelectionStats
// ---------------------------------------------------------------------------

describe('computeSelectionStats', () => {
  const SHEET = 1

  describe('returns null when there is nothing meaningful to show', () => {
    it('returns null for an empty selections array', () => {
      expect(computeSelectionStats(SHEET, [], undefined, makeGetter({}))).toBeNull()
    })

    it('returns null when the selection covers exactly one cell', () => {
      const result = computeSelectionStats(SHEET, [sel(1, 1, 1, 1)], undefined, makeGetter({ '1:1': 42 }))
      expect(result).toBeNull()
    })

    it('returns null when all selected cells are empty', () => {
      const result = computeSelectionStats(SHEET, [sel(1, 1, 1, 3)], undefined, makeGetter({}))
      expect(result).toBeNull()
    })

    it('returns null when cells contain only empty strings', () => {
      const result = computeSelectionStats(
        SHEET,
        [sel(1, 1, 1, 3)],
        undefined,
        makeGetter({ '1:1': '', '1:2': '', '1:3': '' }),
      )
      expect(result).toBeNull()
    })

    it('returns null when cells contain only null/undefined', () => {
      const result = computeSelectionStats(
        SHEET,
        [sel(1, 1, 1, 3)],
        undefined,
        makeGetter({ '1:1': null, '1:2': undefined }),
      )
      expect(result).toBeNull()
    })
  })

  describe('basic numeric stats', () => {
    it('sums a row of numbers', () => {
      const result = computeSelectionStats(
        SHEET,
        [sel(1, 1, 1, 3)],
        undefined,
        makeGetter({ '1:1': 10, '1:2': 20, '1:3': 30 }),
      )
      expect(result).not.toBeNull()
      expect(result!.sum).toBe(60)
      expect(result!.numericCount).toBe(3)
      expect(result!.count).toBe(3)
    })

    it('computes the average correctly', () => {
      const result = computeSelectionStats(
        SHEET,
        [sel(1, 1, 1, 4)],
        undefined,
        makeGetter({ '1:1': 10, '1:2': 20, '1:3': 30, '1:4': 40 }),
      )
      expect(result!.average).toBe(25)
    })

    it('handles negative numbers', () => {
      const result = computeSelectionStats(
        SHEET,
        [sel(1, 1, 1, 3)],
        undefined,
        makeGetter({ '1:1': -10, '1:2': 5, '1:3': -5 }),
      )
      expect(result!.sum).toBe(-10)
      expect(result!.average).toBe(-10 / 3)
    })

    it('handles floating-point values', () => {
      const result = computeSelectionStats(
        SHEET,
        [sel(1, 1, 1, 2)],
        undefined,
        makeGetter({ '1:1': 0.1, '1:2': 0.2 }),
      )
      expect(result!.numericCount).toBe(2)
      // Exact floating-point sum is fine to test — we just want it to be summed
      expect(result!.sum).toBeCloseTo(0.3)
    })

    it('handles a single column of numbers across multiple rows', () => {
      const result = computeSelectionStats(
        SHEET,
        [sel(1, 1, 5, 1)],
        undefined,
        makeGetter({ '1:1': 1, '2:1': 2, '3:1': 3, '4:1': 4, '5:1': 5 }),
      )
      expect(result!.sum).toBe(15)
      expect(result!.average).toBe(3)
      expect(result!.numericCount).toBe(5)
    })
  })

  describe('count vs numericCount', () => {
    it('counts non-empty strings in count but not in numericCount', () => {
      const result = computeSelectionStats(
        SHEET,
        [sel(1, 1, 1, 3)],
        undefined,
        makeGetter({ '1:1': 10, '1:2': 'hello', '1:3': 20 }),
      )
      expect(result!.count).toBe(3)
      expect(result!.numericCount).toBe(2)
      expect(result!.sum).toBe(30)
    })

    it('counts boolean values in count but not numericCount', () => {
      const result = computeSelectionStats(
        SHEET,
        [sel(1, 1, 1, 3)],
        undefined,
        makeGetter({ '1:1': true, '1:2': false, '1:3': 5 }),
      )
      expect(result!.count).toBe(3)
      expect(result!.numericCount).toBe(1)
      expect(result!.sum).toBe(5)
    })

    it('returns undefined average when there are no numeric cells', () => {
      const result = computeSelectionStats(
        SHEET,
        [sel(1, 1, 1, 2)],
        undefined,
        makeGetter({ '1:1': 'foo', '1:2': 'bar' }),
      )
      expect(result!.count).toBe(2)
      expect(result!.numericCount).toBe(0)
      expect(result!.sum).toBe(0)
      expect(result!.average).toBeUndefined()
    })

    it('excludes Infinity from numeric stats', () => {
      const result = computeSelectionStats(
        SHEET,
        [sel(1, 1, 1, 3)],
        undefined,
        makeGetter({ '1:1': Infinity, '1:2': 10, '1:3': -Infinity }),
      )
      // Infinity values are non-empty, but not finite — treated like text
      expect(result!.count).toBe(3)
      expect(result!.numericCount).toBe(1)
      expect(result!.sum).toBe(10)
    })

    it('excludes NaN from numeric stats', () => {
      const result = computeSelectionStats(
        SHEET,
        [sel(1, 1, 1, 2)],
        undefined,
        makeGetter({ '1:1': NaN, '1:2': 5 }),
      )
      expect(result!.numericCount).toBe(1)
      expect(result!.sum).toBe(5)
    })
  })

  describe('multiple selection ranges', () => {
    it('aggregates stats across disjoint ranges', () => {
      // Range A: row 1, cols 1-2
      // Range B: row 3, cols 1-2
      const result = computeSelectionStats(
        SHEET,
        [sel(1, 1, 1, 2), sel(3, 1, 3, 2)],
        undefined,
        makeGetter({ '1:1': 10, '1:2': 20, '3:1': 30, '3:2': 40 }),
      )
      expect(result!.sum).toBe(100)
      expect(result!.numericCount).toBe(4)
      expect(result!.average).toBe(25)
    })
  })

  describe('merged cells', () => {
    it('only counts the owner (top-left) cell of a merge, not the rest', () => {
      // 2×2 merge at rows 1-2, cols 1-2. Only (1,1) should be counted.
      const merges: MergeRange[] = [merge(1, 1, 2, 2)]
      const getter = makeGetter({ '1:1': 100, '1:2': 200, '2:1': 300, '2:2': 400 })
      // Select the whole merged area plus an extra cell
      const result = computeSelectionStats(SHEET, [sel(1, 1, 2, 3)], merges, getter)
      // (1,1)=100 owner, (1,2)(2,1)(2,2) skipped, (1,3) and (2,3) are unset → 0 non-empty
      // So only (1,1)=100 contributes
      expect(result!.sum).toBe(100)
      expect(result!.numericCount).toBe(1)
    })

    it('still counts non-merged cells next to a merge normally', () => {
      const merges: MergeRange[] = [merge(1, 1, 2, 2)]
      const getter = makeGetter({ '1:1': 10, '1:3': 5, '2:3': 15 })
      const result = computeSelectionStats(SHEET, [sel(1, 1, 2, 3)], merges, getter)
      // Owner (1,1)=10, (1,3)=5, (2,3)=15; (1,2)(2,1)(2,2) skipped
      expect(result!.sum).toBe(30)
      expect(result!.numericCount).toBe(3)
    })

    it('handles no merges (undefined) gracefully', () => {
      const result = computeSelectionStats(
        SHEET,
        [sel(1, 1, 1, 3)],
        undefined,
        makeGetter({ '1:1': 1, '1:2': 2, '1:3': 3 }),
      )
      expect(result!.sum).toBe(6)
    })
  })

  describe('cell cap', () => {
    it('stops processing after maxCells cells', () => {
      // Make a 10×10 grid all filled with 1, but cap at 5 cells
      const cells: Record<string, number> = {}
      for (let r = 1; r <= 10; r++) {
        for (let c = 1; c <= 10; c++) {
          cells[`${r}:${c}`] = 1
        }
      }
      const result = computeSelectionStats(SHEET, [sel(1, 1, 10, 10)], undefined, makeGetter(cells), 5)
      expect(result!.numericCount).toBe(5)
      expect(result!.sum).toBe(5)
    })

    it('default MAX_CELLS_FOR_STATS constant is 50 000', () => {
      expect(MAX_CELLS_FOR_STATS).toBe(50_000)
    })
  })

  describe('uses the sheetId when calling getEffectiveValue', () => {
    it('passes the correct sheetId through to the getter', () => {
      const calls: number[] = []
      const getter: GetEffectiveValue = (sheetId) => {
        calls.push(sheetId)
        return 1
      }
      computeSelectionStats(42, [sel(1, 1, 1, 2)], undefined, getter)
      expect(calls.every((id) => id === 42)).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// formatStatNumber
// ---------------------------------------------------------------------------

describe('formatStatNumber', () => {
  it('formats an integer without decimal places', () => {
    // toLocaleString output depends on locale, but the number should be present
    const result = formatStatNumber(1234)
    expect(result).toContain('1')
    expect(result).toContain('234') // digits are there even if grouped differently
  })

  it('rounds away floating-point display artifacts', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS — should not appear
    const raw = 0.1 + 0.2
    const result = formatStatNumber(raw)
    expect(result).not.toContain('00000000000000')
  })

  it('handles zero', () => {
    expect(formatStatNumber(0)).toBe('0')
  })

  it('handles negative numbers', () => {
    const result = formatStatNumber(-42)
    expect(result).toContain('42')
    // Negative sign should be somewhere in the output
    expect(result).toMatch(/-|−/) // some locales use a minus sign (U+2212)
  })

  it('handles very large numbers without scientific notation', () => {
    const result = formatStatNumber(1_000_000)
    expect(result).toContain('000')
  })

  it('preserves meaningful decimal places', () => {
    const result = formatStatNumber(3.14159)
    expect(result).toContain('14159')
  })
})
