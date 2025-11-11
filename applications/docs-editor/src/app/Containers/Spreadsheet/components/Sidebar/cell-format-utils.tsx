import type {
  HorizontalAlign,
  NumberFormat,
  NumberFormatType,
  VerticalAlign,
  WrapStrategy,
} from '@rowsncolumns/common-types'
import { getDefaultDateFormat, getDefaultTimeFormat } from '@rowsncolumns/utils'
import * as Icons from '../icons'
import * as UI from '../ui'

type NumberFormatCategory = {
  name: string
  value: NumberFormatType | string
  description?: string
  pattern?: string
  options?: string[]
}

export const getNumberFormatCategories = (locale?: string): NumberFormatCategory[] => [
  { name: 'General', value: 'GENERAL', description: 'General format cells have no specific number format.' },
  {
    name: 'Number',
    value: 'NUMBER',
    description: 'Number is used for general display of numbers.',
    pattern: '#.00',
    options: ['Decimal', 'ThousandSeparator'],
  },
  {
    name: 'Currency',
    value: 'CURRENCY',
    description: 'Currency formats are used for general monetary values.',
    pattern: `"{currencySymbol}"* #,##0.00;"{currencySymbol}"* (#,##0.00);"{currencySymbol}"* "-"??;@`,
    options: ['CurrencySymbol', 'Decimal'],
  },
  {
    name: 'Accounting',
    value: 'ACCOUNTING',
    pattern: `"{currencySymbol}"* #,##0.00;"{currencySymbol}"* (#,##0.00);"{currencySymbol}"* "-"??;@`,
    options: ['CurrencySymbol', 'Decimal'],
  },
  {
    name: 'Date',
    value: 'DATE',
    description: 'Date formats display date and time serial numbers as date values.',
    pattern: getDefaultDateFormat(locale),
  },
  {
    name: 'Time',
    value: 'DATE_TIME',
    description: 'Time formats display date and time serial numbers as date values.',
    pattern: getDefaultTimeFormat(),
  },
  { name: 'Percentage', value: 'PERCENT', pattern: '0%', options: ['Decimal'] },
  { name: 'Fraction', value: 'FRACTION', pattern: '#/#' },
  { name: 'Scientific', value: 'SCIENTIFIC', pattern: '0.00E+00', options: ['Decimal'] },
  { name: 'Text', value: 'TEXT' },
  { name: 'Custom', value: 'CUSTOM', pattern: 'General' },
]

export const customFormats: NumberFormat[] = [
  { type: 'GENERAL' },
  { type: 'NUMBER', pattern: '0' },
  { type: 'NUMBER', pattern: '##.00' },
  { type: 'NUMBER', pattern: '#,##0' },
  { type: 'NUMBER', pattern: '#,##0.00' },
  { type: 'NUMBER', pattern: '#,##0;(#,##0)' },
  { type: 'NUMBER', pattern: '#,##0;[Red](#,##0)' },
  { type: 'NUMBER', pattern: '#,##0.00;(#,##0.00)' },
  { type: 'NUMBER', pattern: '#,##0.00;[Red](#,##0.00)' },
  { type: 'CURRENCY', pattern: '"{currencySymbol}"#,##0;("{currencySymbol}"#,##0)' },
  { type: 'CURRENCY', pattern: '"{currencySymbol}"#,##0;[Red]("{currencySymbol}"#,##0)' },
  { type: 'CURRENCY', pattern: '"{currencySymbol}"#,##0.00;("{currencySymbol}"#,##0.00)' },
  { type: 'CURRENCY', pattern: '"{currencySymbol}"#,##0.00;[Red]("{currencySymbol}"#,##0.00)' },
  { type: 'PERCENT', pattern: '0%' },
  { type: 'PERCENT', pattern: '0.00%' },
  { type: 'SCIENTIFIC', pattern: '0.00E+00' },
  { type: 'SCIENTIFIC', pattern: '##0.0E+0' },
  { type: 'FRACTION', pattern: '# ?/?' },
  { type: 'FRACTION', pattern: '# ??/??' },
  { type: 'DATE', pattern: 'd/m/yy' },
  { type: 'DATE', pattern: 'd-mmm-yy' },
  { type: 'DATE', pattern: 'd-mmm' },
  { type: 'DATE', pattern: 'mmm-yy' },
  { type: 'DATE_TIME', pattern: 'h:mm AM/PM' },
  { type: 'DATE_TIME', pattern: 'h:mm:ss AM/PM' },
  { type: 'DATE_TIME', pattern: 'h:mm' },
  { type: 'DATE_TIME', pattern: 'h:mm:ss' },
  { type: 'DATE', pattern: 'd/m/yy h:mm' },
  { type: 'DATE_TIME', pattern: 'mm:ss' },
  { type: 'DATE_TIME', pattern: 'mm:ss.0' },
  { type: 'TEXT', pattern: '@' },
  { type: 'DATE_TIME', pattern: '[h]:mm:ss' },
  { type: 'CURRENCY', pattern: '"{currencySymbol}"* #,##0;"{currencySymbol}"* (#,##0);"{currencySymbol}"* "-";@' },
  { type: 'ACCOUNTING', pattern: '* #,##0;* (#,##0);* "-";@' },
  {
    type: 'CURRENCY',
    pattern: `"{currencySymbol}"* #,##0.00;"{currencySymbol}"* (#,##0.00);"{currencySymbol}"* "-"??;@`,
  },
  { type: 'ACCOUNTING', pattern: '* #,##0.00;* (#,##0.00);* "-"??;@' },
  { type: 'DATE_TIME', pattern: '[$-en-US]h:mm:ss AM/PM' },
  { type: 'DATE_TIME', pattern: '[$-en-US]hh:mm:ss AM/PM;@' },
  { type: 'DATE', pattern: '[$-en-US]m/d/yy h:mm AM/PM;@' },
  { type: 'DATE_TIME', pattern: '[$-en-US]h:mm AM/PM;@' },
  { type: 'DATE', pattern: 'd/m/yyyy' },
  { type: 'NUMBER', pattern: '00000' },
]

export const dateFormats: NumberFormat[] = [
  { pattern: 'dd/m/yy', type: 'DATE' },
  { pattern: 'dddd, dd mmmm yyyy', type: 'DATE' },
  { pattern: 'dd/mm/yyyy', type: 'DATE' },
  { pattern: 'dd/mm/yy', type: 'DATE' },
  { pattern: 'dd\\.mm\\.yyyy', type: 'DATE' },
  { pattern: 'yyyy-mm-dd', type: 'DATE' },
  { pattern: 'dd mmmm yyyy', type: 'DATE' },
  { pattern: 'dd-mmm', type: 'DATE' },
  { pattern: 'dd-mmm-yy', type: 'DATE' },
  { pattern: 'mmm-dd', type: 'DATE' },
  { pattern: 'mmmm-dd', type: 'DATE' },
  { pattern: 'mmm-dd, yyyy', type: 'DATE' },
]

export const timeFormats: NumberFormat[] = [
  { pattern: 'hh:mm', type: 'DATE_TIME' },
  { pattern: 'h:mm AM/PM', type: 'DATE_TIME' },
  { pattern: 'hh:mm:ss', type: 'DATE_TIME' },
  { pattern: 'h:mm:ss AM/PM', type: 'DATE_TIME' },
  { pattern: 'd/m/yy h:mm AM/PM', type: 'DATE' },
  { pattern: 'd/m/yy hh:mm', type: 'DATE' },
]

export const horizontalAlignments: { name: string; value: HorizontalAlign | 'General'; icon?: JSX.Element }[] = [
  { name: 'General', value: 'General' },
  { name: 'Left', value: 'left', icon: <UI.Icon className="shrink-0" legacyName="text-align-left" /> },
  { name: 'Center', value: 'center', icon: <UI.Icon className="shrink-0" legacyName="text-align-center" /> },
  { name: 'Right', value: 'right', icon: <UI.Icon className="shrink-0" legacyName="text-align-right" /> },
]

export const verticalAlignments: { name: string; value: VerticalAlign; icon?: JSX.Element }[] = [
  { name: 'Top', value: 'top', icon: <UI.Icon className="shrink-0" data={Icons.alignTop} /> },
  { name: 'Center', value: 'middle', icon: <UI.Icon className="shrink-0" data={Icons.alignVerticalCenter} /> },
  { name: 'Bottom', value: 'bottom', icon: <UI.Icon className="shrink-0" data={Icons.alignBottom} /> },
]

export const wrapStrategies: { name: string; value: WrapStrategy; icon?: JSX.Element }[] = [
  { name: 'Overflow', value: 'overflow', icon: <UI.Icon className="shrink-0" data={Icons.textOverflow} /> },
  { name: 'Clip', value: 'clip', icon: <UI.Icon className="shrink-0" data={Icons.textClip} /> },
  { name: 'Wrap', value: 'wrap', icon: <UI.Icon className="shrink-0" data={Icons.textWrap} /> },
]
