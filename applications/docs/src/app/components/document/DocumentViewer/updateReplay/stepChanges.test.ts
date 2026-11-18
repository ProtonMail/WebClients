import type { ReplayCell, ReplaySnapshot } from './replaySnapshot'
import { getCellLabel } from './replaySnapshot'
import { getStepChanges } from './stepChanges'

function snapshotWithCells(cells: Record<string, ReplayCell>, extra: Partial<ReplaySnapshot> = {}): ReplaySnapshot {
  const rows: { values: (ReplayCell | null)[] }[] = []
  for (const [position, cell] of Object.entries(cells)) {
    const [rowIndex, columnIndex] = position.split(',').map(Number)
    rows[rowIndex] ??= { values: [] }
    rows[rowIndex].values[columnIndex] = cell
  }
  return {
    sheets: [{ sheetId: 1, title: 'Sheet1', rowCount: 1000, columnCount: 100 }],
    sheetData: { 1: rows },
    sharedStrings: {},
    cellXfs: {},
    ...extra,
  }
}

describe('getStepChanges', () => {
  it('finds added, modified and deleted cells', () => {
    const previous = snapshotWithCells({
      '1,1': { ue: { sv: 'kept' } },
      '1,2': { ue: { sv: 'old' } },
      '1,3': { ue: { nv: 3 } },
    })
    const next = snapshotWithCells({
      '1,1': { ue: { sv: 'kept' } },
      '1,2': { ue: { sv: 'new' } },
      '2,1': { ue: { sv: 'added' } },
    })

    const { cellChanges } = getStepChanges(previous, next)

    expect(cellChanges).toEqual([
      expect.objectContaining({ rowIndex: 1, columnIndex: 2, kind: 'modified', textBefore: 'old', textAfter: 'new' }),
      expect.objectContaining({ rowIndex: 1, columnIndex: 3, kind: 'deleted', textBefore: '3', textAfter: '' }),
      expect.objectContaining({ rowIndex: 2, columnIndex: 1, kind: 'added', textBefore: '', textAfter: 'added' }),
    ])
  })

  it('ignores recalculated values', () => {
    const previous = snapshotWithCells({ '1,1': { ue: { fv: '=NOW()' }, ev: { nv: 1 }, fv: '1' } })
    const next = snapshotWithCells({ '1,1': { ue: { fv: '=NOW()' }, ev: { nv: 2 }, fv: '2' } })

    expect(getStepChanges(previous, next).cellChanges).toEqual([])
  })

  it('resolves shared strings and styles against their own snapshot', () => {
    const previous = snapshotWithCells(
      { '1,1': { ss: 'a', uf: { sid: 's1' } } },
      { sharedStrings: { a: 'hello' }, cellXfs: { s1: { textFormat: { bold: true } } } },
    )
    const sameContentDifferentIds = snapshotWithCells(
      { '1,1': { ss: 'b', uf: { sid: 's2' } } },
      { sharedStrings: { b: 'hello' }, cellXfs: { s2: { textFormat: { bold: true } } } },
    )
    const sameIdsDifferentContent = snapshotWithCells(
      { '1,1': { ss: 'a', uf: { sid: 's1' } } },
      { sharedStrings: { a: 'bye' }, cellXfs: { s1: { textFormat: { bold: false } } } },
    )

    expect(getStepChanges(previous, sameContentDifferentIds).cellChanges).toEqual([])
    expect(getStepChanges(previous, sameIdsDifferentContent).cellChanges).toEqual([
      expect.objectContaining({ valueChanged: true, formatChanged: true, textBefore: 'hello', textAfter: 'bye' }),
    ])
  })

  it('finds a change through a style whose content changed while the row stayed the same', () => {
    const previous = snapshotWithCells({ '1,1': { ue: { sv: 'x' }, uf: { sid: 's1' } } }, { cellXfs: { s1: {} } })
    const next = snapshotWithCells(
      { '1,1': { ue: { sv: 'x' }, uf: { sid: 's1' } } },
      { cellXfs: { s1: { textFormat: { italic: true } } } },
    )

    expect(getStepChanges(previous, next).cellChanges).toEqual([
      expect.objectContaining({ rowIndex: 1, columnIndex: 1, valueChanged: false, formatChanged: true }),
    ])
  })

  it('compares rows whose keys come in another order cell by cell', () => {
    const previous = snapshotWithCells({ '1,1': { ue: { sv: 'x' }, fv: 'x' } })
    const next = snapshotWithCells({ '1,1': { fv: 'x', ue: { sv: 'x' } } })

    expect(getStepChanges(previous, next).cellChanges).toEqual([])
  })

  it('reports format-only changes', () => {
    const previous = snapshotWithCells({ '1,1': { ue: { sv: 'x' } } })
    const next = snapshotWithCells({ '1,1': { ue: { sv: 'x' }, uf: { textFormat: { bold: true } } } })

    expect(getStepChanges(previous, next).cellChanges).toEqual([
      expect.objectContaining({ kind: 'modified', valueChanged: false, formatChanged: true }),
    ])
  })

  it('flags sheets whose size changed or that were removed', () => {
    const previous = snapshotWithCells(
      {},
      {
        sheets: [
          { sheetId: 1, rowCount: 1000, columnCount: 100 },
          { sheetId: 2, rowCount: 1000, columnCount: 100 },
          { sheetId: 3, rowCount: 1000, columnCount: 100 },
        ],
      },
    )
    const next = snapshotWithCells(
      {},
      {
        sheets: [
          { sheetId: 1, rowCount: 1001, columnCount: 100 },
          { sheetId: 3, rowCount: 1000, columnCount: 100 },
        ],
      },
    )

    const changes = getStepChanges(previous, next)

    expect([...changes.structurallyChangedSheetIds]).toEqual([1, 2])
    expect(changes.otherChangedKeys).toEqual(['sheets'])
  })

  it('lists other changed state keys', () => {
    const previous = snapshotWithCells({}, { tables: [], charts: [] })
    const next = snapshotWithCells({}, { tables: [{ id: 't1' }], charts: [] })

    expect(getStepChanges(previous, next).otherChangedKeys).toEqual(['tables'])
  })
})

describe('getCellLabel', () => {
  it('labels cells with the header row and column offset', () => {
    expect(getCellLabel({ rowIndex: 1, columnIndex: 1 })).toBe('A1')
    expect(getCellLabel({ rowIndex: 10, columnIndex: 26 })).toBe('Z10')
    expect(getCellLabel({ rowIndex: 3, columnIndex: 27 })).toBe('AA3')
  })
})
