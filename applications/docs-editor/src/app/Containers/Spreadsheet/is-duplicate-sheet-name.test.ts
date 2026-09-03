import { getUniqueSheetName, isDuplicateSheetName } from './is-duplicate-sheet-name'

const sheets = [
  { id: 1, name: 'Summary' },
  { id: 2, name: 'Data' },
]

describe('isDuplicateSheetName', () => {
  it('rejects an existing sheet name', () => {
    expect(isDuplicateSheetName(2, 'Summary', sheets)).toBe(true)
  })

  it('rejects an existing sheet name with different casing', () => {
    expect(isDuplicateSheetName(2, 'summary', sheets)).toBe(true)
  })

  it('allows a sheet to keep its own name', () => {
    expect(isDuplicateSheetName(1, 'Summary', sheets)).toBe(false)
  })

  it('allows a unique sheet name', () => {
    expect(isDuplicateSheetName(2, 'Archive', sheets)).toBe(false)
  })
})

describe('getUniqueSheetName', () => {
  it('rejects an empty sheet name', () => {
    expect(getUniqueSheetName(2, '   ', sheets)).toBeUndefined()
  })

  it('suffixes a duplicate sheet name', () => {
    expect(getUniqueSheetName(2, ' summary ', sheets)).toBe('summary (2)')
  })

  it('increments the suffix until the sheet name is unique', () => {
    expect(getUniqueSheetName(2, 'Summary', [...sheets, { id: 3, name: 'summary (2)' }])).toBe('Summary (3)')
  })

  it('returns a trimmed unique sheet name', () => {
    expect(getUniqueSheetName(2, ' Archive ', sheets)).toBe('Archive')
  })
})
