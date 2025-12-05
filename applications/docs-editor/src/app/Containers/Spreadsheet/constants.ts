import { functionDescriptions } from '@rowsncolumns/functions'
import FormulaParser from '@rowsncolumns/fast-formula-parser'
import { type CanvasGridProps, type CellFormat, getCurrencySymbol } from '@rowsncolumns/spreadsheet'
import { getDefaultDateFormat, getLongDateFormat } from '@rowsncolumns/utils'

export const CURRENCY_DEFAULT = 'USD'
export const LOCALE_DEFAULT = 'en-US'

// TODO: both of these should be dynamic
export const CURRENCY = CURRENCY_DEFAULT
export const LOCALE = LOCALE_DEFAULT

export const ZOOM_SUGGESTIONS = [0.5, 0.75, 0.9, 1, 1.25, 1.5, 2] // scale
export const ZOOM_DEFAULT = 1 // scale
export const ZOOM_MIN = 0.5 // scale
export const ZOOM_MAX = 2 // scale

export const FONTS: { value: string; label?: string }[] = [
  { value: 'Arial' },
  { value: 'Calibri' },
  { value: 'Cambria' },
  { value: 'Caveat' },
  { value: 'Comfortaa' },
  { value: 'Comic Sans MS' },
  { value: 'Consolas' },
  { value: 'Corsiva' },
  { value: 'Courier New' },
  { value: 'Droid Sans' },
  { value: 'Droid Serif' },
  { value: 'Georgia' },
  { value: 'Impact' },
  { value: 'Lexend' },
  { value: 'Lobster' },
  { value: 'Lora' },
  { value: 'Merriweather' },
  { value: 'Montserrat' },
  { value: 'Nunito' },
  { value: 'Oswald' },
  { value: 'Pacifico' },
  { value: 'Proxima Nova' },
  { value: 'Roboto' },
  { value: 'Roboto Mono' },
  { value: 'Roboto Serif' },
  { value: 'Source Sans 3' },
  { value: 'Times New Roman' },
  { value: 'Trebuchet MS' },
  { value: 'Ubuntu' },
  { value: 'Verdana' },
]
export type FontValue = (typeof FONTS)[number]['value']
export const FONT_LABEL_BY_VALUE = Object.fromEntries(
  FONTS.map(({ value, label }) => [value, label ?? value]),
) as Record<FontValue, string>
// TODO: make sure this is synced with SpreadsheetTheme.primaryFontFamily
export const FONT_FAMILY_DEFAULT = 'Arial' satisfies FontValue
export const FONT_SIZE_SUGGESTIONS = [6, 7, 8, 9, 10, 11, 12, 14, 18, 24, 36] // pt
export const FONT_SIZE_DEFAULT = 10 // pt
export const FONT_SIZE_MIN = 1 // pt
export const FONT_SIZE_MAX = 400 // pt

export type PatternSpec = { type: NonNullable<CellFormat['numberFormat']>['type']; pattern: string }
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

const IMPLEMENTED_FUNCTION_NAMES = FormulaParser.getImplementedFunctionNames()
const EXCLUDED_FUNCTION_DATATYPES = ['google']
const EXCLUDED_FUNCTION_NAMES = ['webservice']
export const FUNCTION_DESCRIPTIONS = functionDescriptions.filter(
  (fn) =>
    IMPLEMENTED_FUNCTION_NAMES.has(fn.title) &&
    !EXCLUDED_FUNCTION_DATATYPES.includes(fn.datatype.toLowerCase()) &&
    !EXCLUDED_FUNCTION_NAMES.includes(fn.title.toLowerCase()),
)

export const GRID_THEME_PROPS: Partial<CanvasGridProps> = {
  headerBackgroundColor: '#FAFAFA',
  headerColor: '#666666',
  headerActiveBackgroundColor: '#E3F9EB',
  headerSelectedBackgroundColor: '#1EA885',
  selectionBorderColor: '#4DB89D',
  selectionBackgroundColor: 'rgba(80, 200, 120, 0.1)',
  selectionDragBorderColor: '#1EA885',
  gridLineColor: '#E1E1E1',
  headerBorderColor: '#E1E1E1',
  headerTableBackgroundColor: '#FAFAFA',
  headerTableActiveBackgroundColor: '#E3F9EB',
  headerTableSelectedBackgroundColor: '#1EA885',
  frozenShadowColor: '#d9d9d9',
  frozenShadowThickness: 4,
}

export const OPEN_LINK_EVENT = 'open-link' as const
export type OpenLinkEventData = { link: string }
