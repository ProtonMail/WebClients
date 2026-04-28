/**
 * Pure utility functions for spreadsheet sort operations.
 * Kept separate from ui-state.ts so they can be unit-tested without
 * importing the heavy @rowsncolumns/* packages.
 */

/**
 * A minimal description of a rectangular range of cells within a sheet.
 * Row and column indices are 1-based, matching the @rowsncolumns/grid GridRange
 * convention (startRowIndex: 1 means the very first row).
 */
export type SortRange = {
  /** 1-based index of the first row included in the range. */
  startRowIndex: number
  /** 1-based index of the last row included in the range (inclusive). */
  endRowIndex: number
  /** 1-based index of the first column included in the range. */
  startColumnIndex: number
  /** 1-based index of the last column included in the range (inclusive). */
  endColumnIndex: number
}

/**
 * Returns a range that covers every cell in the sheet **except** row 1.
 *
 * This is used when the user has opted in to "has header row" mode: row 1 is
 * treated as a header and must stay in place while the rest of the data is
 * sorted.
 *
 * @param rowCount    Total number of rows in the active sheet.
 * @param columnCount Total number of columns in the active sheet.
 * @returns A {@link SortRange} whose `startRowIndex` is always 2.
 *
 * @example
 * // Sheet with 100 rows and 10 columns — header in row 1 is preserved.
 * makeSortRangeExcludingHeader(100, 10)
 * // → { startRowIndex: 2, endRowIndex: 100, startColumnIndex: 1, endColumnIndex: 10 }
 *
 * @example
 * // Edge case: sheet has only 1 row (the header itself). The resulting range
 * // is intentionally empty (startRowIndex > endRowIndex) — the caller should
 * // treat this as a no-op.
 * makeSortRangeExcludingHeader(1, 5)
 * // → { startRowIndex: 2, endRowIndex: 1, startColumnIndex: 1, endColumnIndex: 5 }
 */
export function makeSortRangeExcludingHeader(rowCount: number, columnCount: number): SortRange {
  return {
    startRowIndex: 2,
    endRowIndex: rowCount,
    startColumnIndex: 1,
    endColumnIndex: columnCount,
  }
}
