import { getSheetNameFromFilename } from './sheet-import-name'

describe('getSheetNameFromFilename', () => {
  it('removes the final extension', () => {
    expect(getSheetNameFromFilename('quarterly.results.csv')).toBe('quarterly.results')
  })

  it('keeps a filename without an extension', () => {
    expect(getSheetNameFromFilename('quarterly results')).toBe('quarterly results')
  })

  it.each(['.csv', '   .csv', ''])('does not return an empty sheet name for %p', (filename) => {
    expect(getSheetNameFromFilename(filename)).toBeUndefined()
  })
})
