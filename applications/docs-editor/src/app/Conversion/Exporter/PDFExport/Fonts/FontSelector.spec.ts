import { maxBy } from '../LexicalNodeToPDFNode/Utils/maxBy'
import { getFontForText } from './FontSelector'
import { AllLanguageRanges } from './Ranges'

jest.mock('../LexicalNodeToPDFNode/Utils/maxBy')

describe('FontSelector', () => {
  const mockedMaxBy = maxBy as jest.Mock
  const latinRangeRegex = /[A-Za-z]/
  const cyrillicRangeRegex = /[А-Яа-яЁё]/
  const greekRangeRegex = /[Α-Ωα-ω]/
  const chineseRangeRegex = /[\u4E00-\u9FFF]/

  beforeEach(() => {
    AllLanguageRanges.Latin = latinRangeRegex
    AllLanguageRanges.Cyrillic = cyrillicRangeRegex
    AllLanguageRanges.Greek = greekRangeRegex
    AllLanguageRanges.SC = chineseRangeRegex
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return the default font when no bold or italic options are set and text is Latin', () => {
    mockedMaxBy.mockReturnValue(['Latin', latinRangeRegex])
    const result = getFontForText('Hello', { isCode: false, isBold: false, isItalic: false })
    expect(result).toBe('Helvetica')
  })

  it('should return the default code font when isCode is true and text is Latin', () => {
    mockedMaxBy.mockReturnValue(['Latin', latinRangeRegex])
    const result = getFontForText('Hello', { isCode: true, isBold: false, isItalic: false })
    expect(result).toBe('Courier')
  })

  it('should return bold font when isBold is true and text is Latin', () => {
    mockedMaxBy.mockReturnValue(['Latin', latinRangeRegex])
    const result = getFontForText('Hello', { isCode: false, isBold: true, isItalic: false })
    expect(result).toBe('Helvetica-Bold')
  })

  it('should return italic font when isItalic is true and text is Latin', () => {
    mockedMaxBy.mockReturnValue(['Latin', latinRangeRegex])
    const result = getFontForText('Hello', { isCode: false, isBold: false, isItalic: true })
    expect(result).toBe('Helvetica-Oblique')
  })

  it('should return bold and italic font when both are true and text is Latin', () => {
    mockedMaxBy.mockReturnValue(['Latin', latinRangeRegex])
    const result = getFontForText('Hello', { isCode: false, isBold: true, isItalic: true })
    expect(result).toBe('Helvetica-BoldOblique')
  })

  it('should return the corresponding font family for Cyrillic text', () => {
    mockedMaxBy.mockReturnValue(['Cyrillic', cyrillicRangeRegex])
    const result = getFontForText('Привет', { isCode: false, isBold: false, isItalic: false })
    expect(result).toBe('Helvetica')
  })

  it('should return default font if character range is not custom supported', () => {
    mockedMaxBy.mockReturnValue(['Armenian', greekRangeRegex])
    const result = getFontForText('...', { isCode: false, isBold: false, isItalic: false })
    expect(result).toBe('Helvetica')
  })

  it('should return the corresponding font family for Greek text', () => {
    mockedMaxBy.mockReturnValue(['Greek', greekRangeRegex])
    const result = getFontForText('Γειά σου', { isCode: false, isBold: false, isItalic: false })
    expect(result).toBe('Helvetica')
  })

  it('should return the corresponding font family for Chinese text', () => {
    mockedMaxBy.mockReturnValue(['SC', chineseRangeRegex])
    const result = getFontForText('你好', { isCode: false, isBold: false, isItalic: false })
    expect(result).toBe('Noto Sans SC')
  })

  it('should return the correct font for non-Latin script with bold and italic options', () => {
    mockedMaxBy.mockReturnValue(['SC', chineseRangeRegex])
    const result = getFontForText('你好', { isCode: false, isBold: true, isItalic: true })
    expect(result).toBe('Noto Sans SC')
  })

  it('should handle cases where no script matches the text', () => {
    mockedMaxBy.mockReturnValue(['', undefined])
    const result = getFontForText('', { isCode: false, isBold: false, isItalic: false })
    expect(result).toBe('Helvetica')
  })
})
