import type { CellFormat } from '@rowsncolumns/spreadsheet'

export type SchemaNumberFormatType = NonNullable<CellFormat['numberFormat']>['type']

export type Pattern = {
  pattern: string
  type: SchemaNumberFormatType
}

export type PatternPartLabel = 'sample' | 'positive' | 'negative' | 'zero' | 'text'

export type PatternPart = {
  label: PatternPartLabel
  pattern: string
}

const SECTION_LABELS: readonly PatternPartLabel[] = ['positive', 'negative', 'zero', 'text']

// Matches Google Sheets / Excel: `$` is a literal character, not a locale-aware currency
// placeholder. Locale-specific currencies are handled by CustomCurrencyFormatDialog.
export function getPatterns(): Pattern[] {
  return [
    { pattern: '_($* #,##0_);_($* (#,##0);_($* "-"_);_(@_)', type: 'ACCOUNTING' },
    { pattern: '$#,##0.00_);($#,##0.00)', type: 'CURRENCY' },
    { pattern: '_(* #,##0.00_);_(* (#,##0.00);_(* "-"??_);_(@_)', type: 'ACCOUNTING' },
    { pattern: '0.00', type: 'NUMBER' },
    { pattern: '#,##0', type: 'NUMBER' },
    { pattern: '#,##0.00', type: 'NUMBER' },
    { pattern: '#,##0_);(#,##0)', type: 'NUMBER' },
    { pattern: '#,##0_);[Red](#,##0)', type: 'NUMBER' },
    { pattern: '#,##0.00_);(#,##0.00)', type: 'NUMBER' },
    { pattern: '#,##0.00_);[Red](#,##0.00)', type: 'NUMBER' },
    { pattern: '$#,##0_);($#,##0)', type: 'CURRENCY' },
    { pattern: '$#,##0_);[Red]($#,##0)', type: 'CURRENCY' },
    { pattern: '$#,##0.00_);[Red]($#,##0.00)', type: 'CURRENCY' },
    { pattern: '@', type: 'TEXT' },
    { pattern: '0%', type: 'PERCENT' },
    { pattern: '0.00%', type: 'PERCENT' },
    { pattern: '0.00E+00', type: 'SCIENTIFIC' },
    { pattern: '##0.0E+0', type: 'SCIENTIFIC' },
    { pattern: '# ?/?', type: 'FRACTION' },
    { pattern: '# ??/??', type: 'FRACTION' },
    { pattern: '_(* #,##0_);_(* (#,##0);_(* "-"_);_(@_)', type: 'ACCOUNTING' },
    { pattern: '_($* #,##0.00_);_($* (#,##0.00);_($* "-"??_);_(@_)', type: 'ACCOUNTING' },
  ]
}

export function getPatternParts(pattern: string): PatternPart[] {
  const sections = splitPatternSections(pattern)

  if (sections.length <= 1) {
    return [{ label: 'sample', pattern: sections[0] ?? pattern }]
  }

  return sections.slice(0, SECTION_LABELS.length).map((section, i) => ({
    label: SECTION_LABELS[i],
    pattern: section,
  }))
}

export function inferNumberFormatType(pattern: string): SchemaNumberFormatType {
  if (pattern === '@') {
    return 'TEXT'
  }
  // Strip quoted spans and backslash escapes so literals like `0.00"%"` or `0.00\%` aren't
  // misclassified. Bracketed groups are intentionally NOT stripped — `[$€-407]` and similar
  // locale tags are legitimate currency signals.
  const stripped = pattern.replace(/"[^"]*"|\\./g, '')
  if (/%/.test(stripped)) {
    return 'PERCENT'
  }
  if (/E[+-]/i.test(stripped)) {
    return 'SCIENTIFIC'
  }
  if (/\?\/\?/.test(stripped)) {
    return 'FRACTION'
  }
  // Check `_(` (accounting) before `$` (currency) — accounting patterns often contain both,
  // and the leading `_(` is the more specific signal.
  if (/_\(/.test(stripped)) {
    return 'ACCOUNTING'
  }
  if (/\$/.test(stripped)) {
    return 'CURRENCY'
  }
  return 'NUMBER'
}

// Split on ';' while respecting quoted strings, [bracketed] groups, and '\' escapes.
// Tokens in priority order: quoted string (closing optional), backslash escape,
// bracketed group (closing optional), separator, run of plain chars, single-char fallback.
// The trailing `.` guarantees every position consumes a token, so matchAll always makes progress.
export function splitPatternSections(pattern: string): string[] {
  const sections: string[] = []
  let current = ''
  const tokenRe = /"[^"]*"?|\\.|\[[^\]]*\]?|;|[^"\\\[;]+|./g
  for (const match of pattern.matchAll(tokenRe)) {
    const token = match[0]
    if (token === ';') {
      sections.push(current)
      current = ''
    } else {
      current += token
    }
  }
  sections.push(current)
  return sections
}
