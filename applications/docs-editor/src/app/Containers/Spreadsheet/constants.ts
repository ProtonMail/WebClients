import { functionDescriptions } from '@rowsncolumns/functions'
import FormulaParser from '@rowsncolumns/fast-formula-parser'
import { type CellFormat, getCurrencySymbol } from '@rowsncolumns/spreadsheet'
import { getDefaultDateFormat, getLongDateFormat } from '@rowsncolumns/utils'
import type { useSpreadsheetState } from '@rowsncolumns/spreadsheet-state'

export const CURRENCY_DEFAULT = 'USD'
export const LOCALE_DEFAULT = 'en-US'

// TODO: both of these should be dynamic
export const CURRENCY = CURRENCY_DEFAULT
export const LOCALE = LOCALE_DEFAULT

export const ZOOM_SUGGESTIONS = [0.5, 0.75, 0.9, 1, 1.25, 1.5, 2] // scale
export const ZOOM_DEFAULT = 1 // scale
export const ZOOM_MIN = 0.5 // scale
export const ZOOM_MAX = 2 // scale

export const FONTS = [
  {
    value: 'Arial',
    label: 'Arial',
  },
  {
    value: 'Calibri',
    label: 'Calibri',
  },
  {
    value: 'Cambria',
    label: 'Cambria',
  },
  {
    value: 'Caveat',
    label: 'Caveat',
  },
  {
    value: 'Comfortaa',
    label: 'Comfortaa',
  },
  {
    value: 'Comic Sans MS',
    label: 'Comic Sans MS',
  },
  {
    value: 'Consolas',
    label: 'Consolas',
  },
  {
    value: 'Corsiva',
    label: 'Corsiva',
  },
  {
    value: 'Courier New',
    label: 'Courier New',
  },
  {
    value: 'Droid Sans',
    label: 'Droid Sans',
  },
  {
    value: 'Droid Serif',
    label: 'Droid Serif',
  },
  {
    value: 'Georgia',
    label: 'Georgia',
  },
  {
    value: 'Impact',
    label: 'Impact',
  },
  {
    value: 'Lexend',
    label: 'Lexend',
  },
  {
    value: 'Lobster',
    label: 'Lobster',
  },
  {
    value: 'Lora',
    label: 'Lora',
  },
  {
    value: 'Merriweather',
    label: 'Merriweather',
  },
  {
    value: 'Montserrat',
    label: 'Montserrat',
  },
  {
    value: 'Nunito',
    label: 'Nunito',
  },
  {
    value: 'Oswald',
    label: 'Oswald',
  },
  {
    value: 'Pacifico',
    label: 'Pacifico',
  },
  {
    value: 'Proxima Nova',
    label: 'Proxima Nova',
  },
  {
    value: 'Roboto',
    label: 'Roboto',
  },
  {
    value: 'Roboto Mono',
    label: 'Roboto Mono',
  },
  {
    value: 'Roboto Serif',
    label: 'Roboto Serif',
  },
  {
    value: 'Source Sans 3',
    label: 'Source Sans 3',
  },
  {
    value: 'Times New Roman',
    label: 'Times New Roman',
  },
  {
    value: 'Trebuchet MS',
    label: 'Trebuchet MS',
  },
  {
    value: 'Ubuntu',
    label: 'Ubuntu',
  },
  {
    value: 'Verdana',
    label: 'Verdana',
  },
]
export type FontValue = (typeof FONTS)[number]['value']
export const FONT_LABEL_BY_VALUE = Object.fromEntries(FONTS.map(({ value, label }) => [value, label])) as Record<
  FontValue,
  string
>
// TODO: make sure this is synced with SpreadsheetTheme.primaryFontFamily
export const FONT_FAMILY_DEFAULT = 'Arial' satisfies FontValue
export const FONT_SIZE_SUGGESTIONS = [6, 7, 8, 9, 10, 11, 12, 14, 18, 24, 36] // pt
export const FONT_SIZE_DEFAULT = 10 // pt
export const FONT_SIZE_MIN = 1 // pt
export const FONT_SIZE_MAX = 400 // pt

export type PatternSpec = {
  type: NonNullable<CellFormat['numberFormat']>['type']
  pattern: string
}
export function CURRENCY_PATTERN_DEFAULT(symbol: string) {
  return `"${symbol}"#,##0.00`
}
export function CURRENCY_ROUNDED_PATTERN_DEFAULT(symbol: string) {
  return `"${symbol}"#,##0`
}
type CurrencySymbolOptions = { locale: string; currency: string }
export function CURRENCY_SYMBOL({ locale, currency }: CurrencySymbolOptions) {
  return getCurrencySymbol(locale, currency) ?? CURRENCY_DEFAULT
}
type CurrencyPatternOptions = { locale: string; currency: string }
export function CURRENCY_PATTERN({ locale, currency }: CurrencyPatternOptions) {
  return CURRENCY_PATTERN_DEFAULT(CURRENCY_SYMBOL({ locale, currency }))
}
export function CURRENCY_ROUNDED_PATTERN({ locale, currency }: CurrencyPatternOptions) {
  return CURRENCY_ROUNDED_PATTERN_DEFAULT(CURRENCY_SYMBOL({ locale, currency }))
}

type PatternSpecsOptions = { locale: string; currency: string }
export function PATTERN_SPECS({ locale, currency }: PatternSpecsOptions) {
  const currencySymbol = getCurrencySymbol(locale, currency)
  return {
    GENERAL: { type: 'NUMBER', pattern: 'General' },
    PLAIN_TEXT: { type: 'TEXT', pattern: 'General' },
    NUMBER: { type: 'NUMBER', pattern: '#,##0.00' },
    PERCENT: { type: 'PERCENT', pattern: '0.00%' },
    SCIENTIFIC: { type: 'SCIENTIFIC', pattern: '0.00E+00' },
    ACCOUNTING: {
      type: 'CURRENCY',
      pattern: `_("${currencySymbol}"* #,##0.00_);_("${currencySymbol}"* (#,##0.00);_("${currencySymbol}"* "-"??_);_(@_)`,
    },
    FINANCIAL: { type: 'CURRENCY', pattern: '#,##0.00;(#,##0.00)' },
    CURRENCY: { type: 'CURRENCY', pattern: CURRENCY_PATTERN({ locale, currency }) },
    CURRENCY_ROUNDED: { type: 'CURRENCY', pattern: CURRENCY_ROUNDED_PATTERN({ locale, currency }) },
    USD: { type: 'CURRENCY', pattern: CURRENCY_PATTERN({ locale, currency: 'USD' }) },
    EUR: { type: 'CURRENCY', pattern: CURRENCY_PATTERN({ locale, currency: 'EUR' }) },
    GBP: { type: 'CURRENCY', pattern: CURRENCY_PATTERN({ locale, currency: 'GBP' }) },
    JPY: { type: 'CURRENCY', pattern: CURRENCY_PATTERN({ locale, currency: 'JPY' }) },
    CNY: { type: 'CURRENCY', pattern: CURRENCY_PATTERN({ locale, currency: 'CNY' }) },
    INR: { type: 'CURRENCY', pattern: CURRENCY_PATTERN({ locale, currency: 'INR' }) },
    DATE: { type: 'DATE', pattern: getDefaultDateFormat(locale) },
    LONG_DATE: { type: 'DATE', pattern: getLongDateFormat(locale) },
    TIME: { type: 'DATE_TIME', pattern: `[$-${locale}]h:mm AM/PM;@` },
    DATE_TIME: { type: 'DATE_TIME', pattern: `[$-${locale}]${getDefaultDateFormat(locale)} hh:mm:ss` },
    DURATION: { type: 'TIME', pattern: `[$-${locale}][h]:mm:ss` },
  } satisfies Record<string, PatternSpec>
}
export const NUMBER_PATTERN_EXAMPLE_VALUE = 1000.12
export const PERCENT_PATTERN_EXAMPLE_VALUE = 0.1012
export const DATE_PATTERN_EXAMPLE_VALUE = new Date('2008-09-26T15:59:00')

const implementedFunctionNames = FormulaParser.getImplementedFunctionNames()
export const onlyImplementedFunctionDescriptions = functionDescriptions.filter((fn) => {
  return implementedFunctionNames.has(fn.title)
})

export const OPEN_LINK_EVENT = 'open-link' as const
export type OpenLinkEventData = {
  link: string
}

export const CUSTOM_GRID_COLORS: ReturnType<typeof useSpreadsheetState>['spreadsheetColors'] = {
  headerBackgroundColor: '#FAFAFA', // Light gray for headers
  headerColor: '#666666', // Dark gray for header text
  headerActiveBackgroundColor: '#E3F9EB', // Mint green when cell is selected
  selectionBorderColor: '#4DB89D', // Lighter mint green border for selected cells (appears thinner)
  selectionBackgroundColor: 'rgba(80, 200, 120, 0.1)', // Light mint green background
  gridLineColor: '#F0F0F0', // Light gray grid lines
  headerBorderColor: '#EDEDED', // Light gray border for header cells
}
