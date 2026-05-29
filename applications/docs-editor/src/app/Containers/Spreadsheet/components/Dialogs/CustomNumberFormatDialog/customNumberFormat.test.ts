import { getPatternParts, inferNumberFormatType, splitPatternSections } from './customNumberFormat'

describe('splitPatternSections', () => {
  it('returns a single empty section for an empty string', () => {
    expect(splitPatternSections('')).toEqual([''])
  })

  it('returns a single section when there are no separators', () => {
    expect(splitPatternSections('0.00')).toEqual(['0.00'])
  })

  it('splits two sections', () => {
    expect(splitPatternSections('a;b')).toEqual(['a', 'b'])
  })

  it('splits three sections', () => {
    expect(splitPatternSections('a;b;c')).toEqual(['a', 'b', 'c'])
  })

  it('splits four sections', () => {
    expect(splitPatternSections('a;b;c;d')).toEqual(['a', 'b', 'c', 'd'])
  })

  it('does not cap at four sections (the caller decides how many to use)', () => {
    expect(splitPatternSections('a;b;c;d;e')).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('treats a lone separator as two empty sections', () => {
    expect(splitPatternSections(';')).toEqual(['', ''])
  })

  it('preserves an empty middle section', () => {
    expect(splitPatternSections('a;;b')).toEqual(['a', '', 'b'])
  })

  it('does not split on a semicolon inside a quoted string', () => {
    expect(splitPatternSections('"a;b";c')).toEqual(['"a;b"', 'c'])
  })

  it('does not split on a backslash-escaped semicolon', () => {
    expect(splitPatternSections('\\;a;b')).toEqual(['\\;a', 'b'])
  })

  it('does not split on a semicolon inside a bracketed group', () => {
    expect(splitPatternSections('[>100;]#,##0')).toEqual(['[>100;]#,##0'])
  })

  it('consumes an unclosed quoted string to the end of the input', () => {
    expect(splitPatternSections('"abc;def')).toEqual(['"abc;def'])
  })

  it('consumes an unclosed bracketed group to the end of the input', () => {
    expect(splitPatternSections('[abc;def')).toEqual(['[abc;def'])
  })

  it('keeps a trailing backslash as a literal', () => {
    expect(splitPatternSections('abc\\')).toEqual(['abc\\'])
  })

  it('handles alternating quoted and unquoted spans', () => {
    expect(splitPatternSections('"a"b"c"')).toEqual(['"a"b"c"'])
  })

  it('splits a representative four-section accounting pattern', () => {
    expect(splitPatternSections('_($* #,##0_);_($* (#,##0);_($* "-"_);_(@_)')).toEqual([
      '_($* #,##0_)',
      '_($* (#,##0)',
      '_($* "-"_)',
      '_(@_)',
    ])
  })
})

describe('getPatternParts', () => {
  it('returns a single "sample" part for an empty pattern', () => {
    expect(getPatternParts('')).toEqual([{ label: 'sample', pattern: '' }])
  })

  it('labels a single section as "sample"', () => {
    expect(getPatternParts('0.00')).toEqual([{ label: 'sample', pattern: '0.00' }])
  })

  it('labels two sections as positive and negative', () => {
    expect(getPatternParts('#,##0;(#,##0)')).toEqual([
      { label: 'positive', pattern: '#,##0' },
      { label: 'negative', pattern: '(#,##0)' },
    ])
  })

  it('labels three sections as positive, negative, and zero', () => {
    expect(getPatternParts('#,##0;(#,##0);"-"')).toEqual([
      { label: 'positive', pattern: '#,##0' },
      { label: 'negative', pattern: '(#,##0)' },
      { label: 'zero', pattern: '"-"' },
    ])
  })

  it('labels four sections as positive, negative, zero, and text', () => {
    expect(getPatternParts('#,##0;(#,##0);"-";@')).toEqual([
      { label: 'positive', pattern: '#,##0' },
      { label: 'negative', pattern: '(#,##0)' },
      { label: 'zero', pattern: '"-"' },
      { label: 'text', pattern: '@' },
    ])
  })

  it('drops sections beyond the fourth', () => {
    expect(getPatternParts('a;b;c;d;e')).toEqual([
      { label: 'positive', pattern: 'a' },
      { label: 'negative', pattern: 'b' },
      { label: 'zero', pattern: 'c' },
      { label: 'text', pattern: 'd' },
    ])
  })
})

describe('inferNumberFormatType', () => {
  it('returns TEXT for the bare @ pattern', () => {
    expect(inferNumberFormatType('@')).toBe('TEXT')
  })

  it('returns PERCENT when the pattern contains a percent sign', () => {
    expect(inferNumberFormatType('0%')).toBe('PERCENT')
    expect(inferNumberFormatType('0.00%')).toBe('PERCENT')
  })

  it('returns SCIENTIFIC when the pattern contains an exponent marker', () => {
    expect(inferNumberFormatType('0.00E+00')).toBe('SCIENTIFIC')
    expect(inferNumberFormatType('0.00E-00')).toBe('SCIENTIFIC')
    expect(inferNumberFormatType('##0.0e+0')).toBe('SCIENTIFIC')
  })

  it('returns FRACTION when the pattern contains a "?/?" form', () => {
    expect(inferNumberFormatType('# ?/?')).toBe('FRACTION')
    expect(inferNumberFormatType('# ??/??')).toBe('FRACTION')
  })

  it('returns CURRENCY when the pattern contains a literal $', () => {
    expect(inferNumberFormatType('$#,##0.00')).toBe('CURRENCY')
  })

  it('returns ACCOUNTING for accounting patterns (leading "_(")', () => {
    expect(inferNumberFormatType('_($* #,##0_);_($* (#,##0);_($* "-"_);_(@_)')).toBe('ACCOUNTING')
  })

  it('returns ACCOUNTING for accounting patterns without a currency symbol', () => {
    expect(inferNumberFormatType('_(* #,##0_);_(* (#,##0);_(* "-"_);_(@_)')).toBe('ACCOUNTING')
  })

  it('returns NUMBER as the fallback for plain numeric patterns', () => {
    expect(inferNumberFormatType('#,##0.00')).toBe('NUMBER')
    expect(inferNumberFormatType('0.00')).toBe('NUMBER')
  })

  it('returns NUMBER for an empty pattern', () => {
    expect(inferNumberFormatType('')).toBe('NUMBER')
  })

  it('does not treat "@" inside a longer pattern as TEXT', () => {
    // Text section embedded in an accounting pattern is still classified by the dominant signal.
    expect(inferNumberFormatType('_($* #,##0_);_(@_)')).toBe('ACCOUNTING')
  })

  it('prefers PERCENT over CURRENCY when both signals are present', () => {
    // Heuristic precedence: TEXT > PERCENT > SCIENTIFIC > FRACTION > ACCOUNTING > CURRENCY > NUMBER.
    expect(inferNumberFormatType('$0%')).toBe('PERCENT')
  })

  it('prefers SCIENTIFIC over CURRENCY when both signals are present', () => {
    expect(inferNumberFormatType('$0.00E+00')).toBe('SCIENTIFIC')
  })

  it('prefers ACCOUNTING over CURRENCY when both signals are present', () => {
    expect(inferNumberFormatType('_($#,##0)')).toBe('ACCOUNTING')
  })

  it('ignores signals inside quoted spans', () => {
    expect(inferNumberFormatType('0.00"%"')).toBe('NUMBER')
    expect(inferNumberFormatType('#,##0" $"')).toBe('NUMBER')
    expect(inferNumberFormatType('0.00"E+"')).toBe('NUMBER')
  })

  it('ignores signals introduced by backslash escapes', () => {
    expect(inferNumberFormatType('0.00\\%')).toBe('NUMBER')
    expect(inferNumberFormatType('0.00\\$')).toBe('NUMBER')
  })

  it('still detects currency signals inside [$xxx-locale] locale tags', () => {
    // The `[$xxx]` syntax is the locale-aware currency form — `$` inside the bracket counts.
    expect(inferNumberFormatType('[$€-407]#,##0.00')).toBe('CURRENCY')
  })
})
