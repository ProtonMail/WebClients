import { TableCellHeaderStates } from '@lexical/table'
import { calculateHeaderCellState } from './calculateHeaderCellState'

describe('calculateHeaderCellState', () => {
  it('should return no status if both row and column are false', () => {
    const state = calculateHeaderCellState(false, false)
    expect(state).toBe(TableCellHeaderStates.NO_STATUS)
  })

  it('should return row if row is true and column is false', () => {
    const state = calculateHeaderCellState(true, false)
    expect(state).toBe(TableCellHeaderStates.ROW)
  })

  it('should return column if row is false and column is true', () => {
    const state = calculateHeaderCellState(false, true)
    expect(state).toBe(TableCellHeaderStates.COLUMN)
  })

  it('should return both if row is true and column is true', () => {
    const state = calculateHeaderCellState(true, true)
    expect(state).toBe(TableCellHeaderStates.BOTH)
  })
})
