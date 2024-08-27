import { AvailableCustomFontNames, SupportedLanguageRanges } from './Ranges'

describe('Ranges', () => {
  test('SupportedLanguageRanges', () => {
    expect(SupportedLanguageRanges).toEqual(['SC', 'JP', 'KR'])
  })

  test('AvailableCustomFontNames', () => {
    expect(AvailableCustomFontNames).toEqual(['Noto Sans SC', 'Noto Sans JP', 'Noto Sans KR'])
  })
})
