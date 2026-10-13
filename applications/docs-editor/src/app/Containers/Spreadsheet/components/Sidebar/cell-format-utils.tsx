import type { SheetsMessages } from '../../messages/SheetsMessages'
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

export const getNumberFormatCategories = (messages: SheetsMessages, locale?: string): NumberFormatCategory[] => [
  {
    name: messages.cellFormatOptions.General,
    value: 'GENERAL',
    description: messages.cellFormatOptions['General format cells have no specific number format.'],
  },
  {
    name: messages.cellFormatOptions.Number,
    value: 'NUMBER',
    description: messages.cellFormatOptions['Number is used for general display of numbers.'],
    pattern: '#.00',
    options: ['Decimal', 'ThousandSeparator'],
  },
  {
    name: messages.cellFormatOptions.Currency,
    value: 'CURRENCY',
    description: messages.cellFormatOptions['Currency formats are used for general monetary values.'],
    pattern: `"{currencySymbol}"* #,##0.00;"{currencySymbol}"* (#,##0.00);"{currencySymbol}"* "-"??;@`,
    options: ['CurrencySymbol', 'Decimal'],
  },
  {
    name: messages.cellFormatOptions.Accounting,
    value: 'ACCOUNTING',
    pattern: `"{currencySymbol}"* #,##0.00;"{currencySymbol}"* (#,##0.00);"{currencySymbol}"* "-"??;@`,
    options: ['CurrencySymbol', 'Decimal'],
  },
  {
    name: messages.cellFormatOptions.Date,
    value: 'DATE',
    description: messages.cellFormatOptions['Date formats display date and time serial numbers as date values.'],
    pattern: getDefaultDateFormat(locale),
  },
  {
    name: messages.cellFormatOptions.Time,
    value: 'DATE_TIME',
    description: messages.cellFormatOptions['Time formats display date and time serial numbers as date values.'],
    pattern: getDefaultTimeFormat(),
  },
  { name: messages.cellFormatOptions.Percentage, value: 'PERCENT', pattern: '0%', options: ['Decimal'] },
  { name: messages.cellFormatOptions.Fraction, value: 'FRACTION', pattern: '#/#' },
  { name: messages.cellFormatOptions.Scientific, value: 'SCIENTIFIC', pattern: '0.00E+00', options: ['Decimal'] },
  { name: messages.cellFormatOptions.Text, value: 'TEXT' },
  { name: messages.cellFormatOptions.Custom, value: 'CUSTOM', pattern: 'General' },
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

export function getAlignmentOptions(messages: SheetsMessages) {
  const horizontalAlignments: { name: string; value: HorizontalAlign | 'General'; icon?: JSX.Element }[] = [
    { name: messages.cellFormatOptions.General, value: 'General' },
    {
      name: messages.cellFormatOptions.Left,
      value: 'left',
      icon: <UI.Icon className="shrink-0" data={Icons.textAlignLeft} />,
    },
    {
      name: messages.cellFormatOptions.Center,
      value: 'center',
      icon: <UI.Icon className="shrink-0" data={Icons.textAlignCenter} />,
    },
    {
      name: messages.cellFormatOptions.Right,
      value: 'right',
      icon: <UI.Icon className="shrink-0" data={Icons.textAlignRight} />,
    },
  ]

  const verticalAlignments: { name: string; value: VerticalAlign; icon?: JSX.Element }[] = [
    {
      name: messages.cellFormatOptions.Top,
      value: 'top',
      icon: <UI.Icon className="shrink-0" data={Icons.alignTop} />,
    },
    {
      name: messages.cellFormatOptions.Center,
      value: 'middle',
      icon: <UI.Icon className="shrink-0" data={Icons.alignVerticalCenter} />,
    },
    {
      name: messages.cellFormatOptions.Bottom,
      value: 'bottom',
      icon: <UI.Icon className="shrink-0" data={Icons.alignBottom} />,
    },
  ]

  const wrapStrategies: { name: string; value: WrapStrategy; icon?: JSX.Element }[] = [
    {
      name: messages.cellFormatOptions.Overflow,
      value: 'overflow',
      icon: <UI.Icon className="shrink-0" data={Icons.textOverflow} />,
    },
    {
      name: messages.cellFormatOptions.Clip,
      value: 'clip',
      icon: <UI.Icon className="shrink-0" data={Icons.textClip} />,
    },
    {
      name: messages.cellFormatOptions.Wrap,
      value: 'wrap',
      icon: <UI.Icon className="shrink-0" data={Icons.textWrap} />,
    },
  ]

  return { horizontalAlignments, verticalAlignments, wrapStrategies }
}

export const cellFormatOptionsMessages = {
  cellFormatOptions: {
    General: 'General',
    'General format cells have no specific number format.': 'General format cells have no specific number format.',
    Number: 'Number',
    'Number is used for general display of numbers.': 'Number is used for general display of numbers.',
    Currency: 'Currency',
    'Currency formats are used for general monetary values.': 'Currency formats are used for general monetary values.',
    Accounting: 'Accounting',
    Date: 'Date',
    'Date formats display date and time serial numbers as date values.':
      'Date formats display date and time serial numbers as date values.',
    Time: 'Time',
    'Time formats display date and time serial numbers as date values.':
      'Time formats display date and time serial numbers as date values.',
    Percentage: 'Percentage',
    Fraction: 'Fraction',
    Scientific: 'Scientific',
    Text: 'Text',
    Custom: 'Custom',
    Left: 'Left',
    Center: 'Center',
    Right: 'Right',
    Top: 'Top',
    Bottom: 'Bottom',
    Overflow: 'Overflow',
    Clip: 'Clip',
    Wrap: 'Wrap',
  },
}
