import { makeSortRangeExcludingHeader } from './sort-utils'

describe('makeSortRangeExcludingHeader', () => {
  describe('startRowIndex', () => {
    it('is always 2, regardless of sheet size', () => {
      expect(makeSortRangeExcludingHeader(100, 10).startRowIndex).toBe(2)
      expect(makeSortRangeExcludingHeader(1000, 26).startRowIndex).toBe(2)
      expect(makeSortRangeExcludingHeader(1, 1).startRowIndex).toBe(2)
    })
  })

  describe('startColumnIndex', () => {
    it('is always 1, regardless of sheet size', () => {
      expect(makeSortRangeExcludingHeader(100, 10).startColumnIndex).toBe(1)
      expect(makeSortRangeExcludingHeader(1000, 26).startColumnIndex).toBe(1)
    })
  })

  describe('endRowIndex', () => {
    it('equals the rowCount passed in', () => {
      expect(makeSortRangeExcludingHeader(100, 10).endRowIndex).toBe(100)
      expect(makeSortRangeExcludingHeader(1000, 26).endRowIndex).toBe(1000)
    })
  })

  describe('endColumnIndex', () => {
    it('equals the columnCount passed in', () => {
      expect(makeSortRangeExcludingHeader(100, 10).endColumnIndex).toBe(10)
      expect(makeSortRangeExcludingHeader(1000, 26).endColumnIndex).toBe(26)
    })
  })

  describe('typical sheet', () => {
    it('returns a range that skips only row 1 and spans all columns', () => {
      const range = makeSortRangeExcludingHeader(50, 5)

      expect(range).toEqual({
        startRowIndex: 2,
        endRowIndex: 50,
        startColumnIndex: 1,
        endColumnIndex: 5,
      })
    })
  })

  describe('edge cases', () => {
    it('returns an intentionally empty range when the sheet has only one row (the header)', () => {
      // startRowIndex (2) > endRowIndex (1) — callers should treat this as a no-op
      const range = makeSortRangeExcludingHeader(1, 5)

      expect(range.startRowIndex).toBe(2)
      expect(range.endRowIndex).toBe(1)
      expect(range.startColumnIndex).toBe(1)
      expect(range.endColumnIndex).toBe(5)
    })

    it('handles a single-column sheet', () => {
      const range = makeSortRangeExcludingHeader(20, 1)

      expect(range).toEqual({
        startRowIndex: 2,
        endRowIndex: 20,
        startColumnIndex: 1,
        endColumnIndex: 1,
      })
    })

    it('handles a very large sheet without overflow', () => {
      const range = makeSortRangeExcludingHeader(1_000_000, 1_000)

      expect(range.startRowIndex).toBe(2)
      expect(range.endRowIndex).toBe(1_000_000)
      expect(range.startColumnIndex).toBe(1)
      expect(range.endColumnIndex).toBe(1_000)
    })
  })
})
