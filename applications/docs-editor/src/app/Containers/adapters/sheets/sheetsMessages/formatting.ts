import { c } from 'ttag'
import type { SheetsMessages } from '../../../Spreadsheet/public'

export function createFormattingMessages(): Pick<
  SheetsMessages,
  | 'customCurrencyFormatDialog'
  | 'customDateAndTimeFormatDialog'
  | 'customDateAndTimeFormat'
  | 'customNumberFormatDialog'
  | 'cellFormatDialog'
  | 'borderData'
  | 'cellFormatOptions'
  | 'colorPicker'
  | 'mergeMenuItems'
  | 'numberFormatsMenu'
> {
  return {
    customCurrencyFormatDialog: {
      'Custom currencies': c('sheets_2025:Spreadsheet sidebar custom currency format dialog').t`Custom currencies`,
      'Currency symbol': c('sheets_2025:Spreadsheet sidebar custom currency format dialog').t`Currency symbol`,
      Cancel: c('sheets_2025:Spreadsheet sidebar custom currency format dialog').t`Cancel`,
      Apply: c('sheets_2025:Spreadsheet sidebar custom currency format dialog').t`Apply`,
      'Apply to create a custom currency': c('sheets_2025:Spreadsheet sidebar custom currency format dialog')
        .t`Apply to create a custom currency`,

      Symbol: c('sheets_2025:Spreadsheet customCurrencyFormatDialog').t`Symbol`,
      Format: c('sheets_2025:Spreadsheet customCurrencyFormatDialog').t`Format`,
    },
    customDateAndTimeFormatDialog: {
      'Custom date and time formats': c('sheets_2025:Spreadsheet custom date and time formats dialog')
        .t`Custom date and time formats`,
      Format: c('sheets_2025:Spreadsheet custom date and time formats dialog').t`Format`,
      Cancel: c('sheets_2025:Spreadsheet custom date and time formats dialog').t`Cancel`,
      Apply: c('sheets_2025:Spreadsheet custom date and time formats dialog').t`Apply`,
      Sample: c('sheets_2025:Spreadsheet custom date and time formats dialog').t`Sample`,
    },
    customDateAndTimeFormat: {
      Delete: c('sheets_2025:Spreadsheet custom date and time formats editor').t`Delete`,
      Date: c('sheets_2025:Spreadsheet custom date and time formats editor').t`Date`,
      Time: c('sheets_2025:Spreadsheet custom date and time formats editor').t`Time`,
      Duration: c('sheets_2025:Spreadsheet custom date and time formats editor').t`Duration`,
      Day: c('sheets_2025:Spreadsheet custom date and time formats editor').t`Day`,
      Month: c('sheets_2025:Spreadsheet custom date and time formats editor').t`Month`,
      Year: c('sheets_2025:Spreadsheet custom date and time formats editor').t`Year`,
      Hour: c('sheets_2025:Spreadsheet custom date and time formats editor').t`Hour`,
      Minute: c('sheets_2025:Spreadsheet custom date and time formats editor').t`Minute`,
      Second: c('sheets_2025:Spreadsheet custom date and time formats editor').t`Second`,
      Millisecond: c('sheets_2025:Spreadsheet custom date and time formats editor').t`Millisecond`,
      'AM/PM': c('sheets_2025:Spreadsheet custom date and time formats editor').t`AM/PM`,
      'Elapsed hours': c('sheets_2025:Spreadsheet custom date and time formats editor').t`Elapsed hours`,
      'Elapsed minutes': c('sheets_2025:Spreadsheet custom date and time formats editor').t`Elapsed minutes`,
      'Elapsed seconds': c('sheets_2025:Spreadsheet custom date and time formats editor').t`Elapsed seconds`,
      'Day without leading zero': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Day without leading zero`,
      'Day with leading zero': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Day with leading zero`,
      'Day as abbreviation': c('sheets_2025:Spreadsheet custom date and time formats editor').t`Day as abbreviation`,
      'Day as full name': c('sheets_2025:Spreadsheet custom date and time formats editor').t`Day as full name`,
      'Month without leading zero': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Month without leading zero`,
      'Month with leading zero': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Month with leading zero`,
      'Month as abbreviation': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Month as abbreviation`,
      'Month as full name': c('sheets_2025:Spreadsheet custom date and time formats editor').t`Month as full name`,
      'First letter of the month': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`First letter of the month`,
      'Two digit year': c('sheets_2025:Spreadsheet custom date and time formats editor').t`Two digit year`,
      'Full numeric year': c('sheets_2025:Spreadsheet custom date and time formats editor').t`Full numeric year`,
      'Hour without leading zero': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Hour without leading zero`,
      'Hour with leading zero': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Hour with leading zero`,
      'Minute without leading zero': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Minute without leading zero`,
      'Minute with leading zero': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Minute with leading zero`,
      'Second without leading zero': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Second without leading zero`,
      'Second with leading zero': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Second with leading zero`,
      'Precision to 1/10 of a second': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Precision to 1/10 of a second`,
      'Precision to 1/100 of a second': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Precision to 1/100 of a second`,
      'Precision to 1/1000 of a second': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Precision to 1/1000 of a second`,
      Full: c('sheets_2025:Spreadsheet custom date and time formats editor').t`Full`,
      'Elapsed hours without leading zero': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Elapsed hours without leading zero`,
      'Elapsed hours with leading zero': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Elapsed hours with leading zero`,
      'Elapsed minutes without leading zero': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Elapsed minutes without leading zero`,
      'Elapsed minutes with leading zero': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Elapsed minutes with leading zero`,
      'Elapsed seconds without leading zero': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Elapsed seconds without leading zero`,
      'Elapsed seconds with leading zero': c('sheets_2025:Spreadsheet custom date and time formats editor')
        .t`Elapsed seconds with leading zero`,
    },
    customNumberFormatDialog: {
      'Custom number formats': c('sheets_2025:Spreadsheet sidebar custom number format dialog')
        .t`Custom number formats`,
      'Custom number format': c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Custom number format`,
      'Apply to create a custom number format': c('sheets_2025:Spreadsheet sidebar custom number format dialog')
        .t`Apply to create a custom number format`,
      Format: c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Format`,
      Cancel: c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Cancel`,
      Apply: c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Apply`,
      Sample: c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Sample`,
      Positive: c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Positive`,
      Negative: c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Negative`,
      Zero: c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Zero`,
      Text: c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Text`,
    },
    cellFormatDialog: {
      Bold: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Bold`,
      Italic: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Italic`,
      Underline: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Underline`,
      Strikethrough: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Strikethrough`,
      Number: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Number`,
      Alignment: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Alignment`,
      Font: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Font`,
      Border: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Border`,
      Preview: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Preview`,
      'Choose Category': c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Choose Category`,
      'Decimal places': c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Decimal places`,
      'Thousands separator': c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Thousands separator`,
      'Currency Symbol': c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Currency Symbol`,
      Type: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Type`,
      Custom: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Custom`,
      'Use 1000 Separator (,)': c('sheets_2025:Spreadsheet sidebar cell format editor dialog')
        .t`Use 1000 Separator (,)`,
      'Font size': c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Font size`,
      Effects: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Effects`,
      Color: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Color`,
      'Horizontal Alignment': c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Horizontal Alignment`,
      Indent: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Indent`,
      'Vertical Alignment': c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Vertical Alignment`,
      'Text control': c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Text control`,
      Overflow: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Overflow`,
      Merge: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Merge`,
      'Merge all': c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Merge all`,
      'Merge vertically': c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Merge vertically`,
      'Merge horizontally': c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Merge horizontally`,
      Unmerge: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Unmerge`,
      'Border style': c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Border style`,
      Save: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Save`,
      Cancel: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Cancel`,
      'Format cells': c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`Format cells`,
      General: c('sheets_2025:Spreadsheet sidebar cell format editor dialog').t`General`,
      'Default (${defaultFont})': (defaultFont: string) =>
        c('sheets_2025:Spreadsheet editor toolbar').t`Default (${defaultFont})`,
    },
    borderData: {
      'All borders': c('sheets_2025:Spreadsheet border editor menu').t`All borders`,
      'Inner borders': c('sheets_2025:Spreadsheet border editor menu').t`Inner borders`,
      'Horizontal borders': c('sheets_2025:Spreadsheet border editor menu').t`Horizontal borders`,
      'Vertical borders': c('sheets_2025:Spreadsheet border editor menu').t`Vertical borders`,
      'Outer borders': c('sheets_2025:Spreadsheet border editor menu').t`Outer borders`,
      'Top border': c('sheets_2025:Spreadsheet border editor menu').t`Top border`,
      'Left border': c('sheets_2025:Spreadsheet border editor menu').t`Left border`,
      'Right border': c('sheets_2025:Spreadsheet border editor menu').t`Right border`,
      'Bottom border': c('sheets_2025:Spreadsheet border editor menu').t`Bottom border`,
      Solid: c('sheets_2025:Spreadsheet border editor menu').t`Solid`,
      'Solid medium': c('sheets_2025:Spreadsheet border editor menu').t`Solid medium`,
      'Solid thick': c('sheets_2025:Spreadsheet border editor menu').t`Solid thick`,
      Dashed: c('sheets_2025:Spreadsheet border editor menu').t`Dashed`,
      Dotted: c('sheets_2025:Spreadsheet border editor menu').t`Dotted`,
      Double: c('sheets_2025:Spreadsheet border editor menu').t`Double`,
      'No borders': c('sheets_2025:Spreadsheet border editor menu').t`No borders`,
    },
    cellFormatOptions: {
      General: c('sheets_2025:Spreadsheet cellFormatOptions').t`General`,
      'General format cells have no specific number format.': c('sheets_2025:Spreadsheet cellFormatOptions')
        .t`General format cells have no specific number format.`,
      Number: c('sheets_2025:Spreadsheet cellFormatOptions').t`Number`,
      'Number is used for general display of numbers.': c('sheets_2025:Spreadsheet cellFormatOptions')
        .t`Number is used for general display of numbers.`,
      Currency: c('sheets_2025:Spreadsheet cellFormatOptions').t`Currency`,
      'Currency formats are used for general monetary values.': c('sheets_2025:Spreadsheet cellFormatOptions')
        .t`Currency formats are used for general monetary values.`,
      Accounting: c('sheets_2025:Spreadsheet cellFormatOptions').t`Accounting`,
      Date: c('sheets_2025:Spreadsheet cellFormatOptions').t`Date`,
      'Date formats display date and time serial numbers as date values.': c(
        'sheets_2025:Spreadsheet cellFormatOptions',
      ).t`Date formats display date and time serial numbers as date values.`,
      Time: c('sheets_2025:Spreadsheet cellFormatOptions').t`Time`,
      'Time formats display date and time serial numbers as date values.': c(
        'sheets_2025:Spreadsheet cellFormatOptions',
      ).t`Time formats display date and time serial numbers as date values.`,
      Percentage: c('sheets_2025:Spreadsheet cellFormatOptions').t`Percentage`,
      Fraction: c('sheets_2025:Spreadsheet cellFormatOptions').t`Fraction`,
      Scientific: c('sheets_2025:Spreadsheet cellFormatOptions').t`Scientific`,
      Text: c('sheets_2025:Spreadsheet cellFormatOptions').t`Text`,
      Custom: c('sheets_2025:Spreadsheet cellFormatOptions').t`Custom`,
      Left: c('sheets_2025:Spreadsheet cellFormatOptions').t`Left`,
      Center: c('sheets_2025:Spreadsheet cellFormatOptions').t`Center`,
      Right: c('sheets_2025:Spreadsheet cellFormatOptions').t`Right`,
      Top: c('sheets_2025:Spreadsheet cellFormatOptions').t`Top`,
      Bottom: c('sheets_2025:Spreadsheet cellFormatOptions').t`Bottom`,
      Overflow: c('sheets_2025:Spreadsheet cellFormatOptions').t`Overflow`,
      Clip: c('sheets_2025:Spreadsheet cellFormatOptions').t`Clip`,
      Wrap: c('sheets_2025:Spreadsheet cellFormatOptions').t`Wrap`,
    },
    colorPicker: {
      Reset: c('sheets_2025:Color picker').t`Reset`,
      'Standard colors': c('sheets_2025:Color picker').t`Standard colors`,
      'Recent colors': c('sheets_2025:Color picker').t`Recent colors`,
      'Theme colors': c('sheets_2025:Color picker').t`Theme colors`,
    },
    mergeMenuItems: {
      'Merge all': c('sheets_2025:Spreadsheet editor cell merge options').t`Merge all`,
      'Merge vertically': c('sheets_2025:Spreadsheet editor cell merge options').t`Merge vertically`,
      'Merge horizontally': c('sheets_2025:Spreadsheet editor cell merge options').t`Merge horizontally`,
      Unmerge: c('sheets_2025:Spreadsheet editor cell merge options').t`Unmerge`,
    },
    numberFormatsMenu: {
      General: c('sheets_2025:Spreadsheet editor number formats menu').t`General`,
      'Plain text': c('sheets_2025:Spreadsheet editor number formats menu').t`Plain text`,
      Number: c('sheets_2025:Spreadsheet editor number formats menu').t`Number`,
      Percent: c('sheets_2025:Spreadsheet editor number formats menu').t`Percent`,
      Scientific: c('sheets_2025:Spreadsheet editor number formats menu').t`Scientific`,
      Accounting: c('sheets_2025:Spreadsheet editor number formats menu').t`Accounting`,
      Financial: c('sheets_2025:Spreadsheet editor number formats menu').t`Financial`,
      Currency: c('sheets_2025:Spreadsheet editor number formats menu').t`Currency`,
      'Currency rounded': c('sheets_2025:Spreadsheet editor number formats menu').t`Currency rounded`,
      'More currency': c('sheets_2025:Spreadsheet editor number formats menu').t`More currency`,
      '$ US Dollar': c('sheets_2025:Spreadsheet editor number formats menu').t`$ US Dollar`,
      '€ Euro': c('sheets_2025:Spreadsheet editor number formats menu').t`€ Euro`,
      '£ Pound': c('sheets_2025:Spreadsheet editor number formats menu').t`£ Pound`,
      '¥ Yen': c('sheets_2025:Spreadsheet editor number formats menu').t`¥ Yen`,
      'CN¥ Chinese Yuan': c('sheets_2025:Spreadsheet editor number formats menu').t`CN¥ Chinese Yuan`,
      '₹ Rupee': c('sheets_2025:Spreadsheet editor number formats menu').t`₹ Rupee`,
      Date: c('sheets_2025:Spreadsheet editor number formats menu').t`Date`,
      'Long date': c('sheets_2025:Spreadsheet editor number formats menu').t`Long date`,
      Time: c('sheets_2025:Spreadsheet editor number formats menu').t`Time`,
      'Date time': c('sheets_2025:Spreadsheet editor number formats menu').t`Date time`,
      Duration: c('sheets_2025:Spreadsheet editor number formats menu').t`Duration`,
      'Custom currency': c('sheets_2025:Spreadsheet editor number formats menu').t`Custom currency`,
      'Custom number': c('sheets_2025:Spreadsheet editor number formats menu').t`Custom number`,
      'Custom date and time': c('sheets_2025:Spreadsheet editor number formats menu').t`Custom date and time`,
      New: c('Info').t`New`,
    },
  }
}
