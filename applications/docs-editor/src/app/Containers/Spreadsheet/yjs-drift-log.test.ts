import { formatSpreadsheetYjsDriftLogDetails } from './yjs-drift-log'

describe('formatSpreadsheetYjsDriftLogDetails', () => {
  it('uses the same sorted key limit for record keys and sampled values', () => {
    const patches = { z: 0, i: 9, h: 8, g: 7, f: 6, e: 5, d: 4, c: 3, b: 2, a: 1 }

    expect(formatSpreadsheetYjsDriftLogDetails({ differences: [], patches }).patches).toEqual({
      type: 'object',
      keyCount: 10,
      keys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
      sample: { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 },
    })
  })
})
