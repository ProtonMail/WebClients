import { toCollaboratorCursorNavigationDestination } from './collaboratorCursorNavigationAdapter'

describe('toCollaboratorCursorNavigationDestination', () => {
  it('keeps only the fields the editor needs to navigate', () => {
    expect(
      toCollaboratorCursorNavigationDestination({
        sheetId: 42,
        activeCell: { rowIndex: 7, columnIndex: 3 },
        title: 'Ada',
        userId: 'ada@example.test',
        selections: [{ startRowIndex: 7 }],
      }),
    ).toEqual({ sheetId: 42, rowIndex: 7, columnIndex: 3 })
  })

  it.each([
    undefined,
    {},
    { sheetId: 42 },
    { sheetId: 42, activeCell: null },
    { sheetId: 42, activeCell: { rowIndex: 7 } },
    { sheetId: 42, activeCell: { rowIndex: 0, columnIndex: 3 } },
    { sheetId: Number.NaN, activeCell: { rowIndex: 7, columnIndex: 3 } },
  ])('rejects a state without a valid sheet and cell destination', (state) => {
    expect(toCollaboratorCursorNavigationDestination(state)).toBeUndefined()
  })
})
