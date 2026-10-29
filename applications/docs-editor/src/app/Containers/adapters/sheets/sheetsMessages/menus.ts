import { c, msgid } from 'ttag'
import type { SheetsMessages } from '../../../Spreadsheet/public'

export function createMenusMessages(): Pick<
  SheetsMessages,
  'menus' | 'contextMenu' | 'dataMenu' | 'editMenu' | 'fileMenu' | 'formatMenu' | 'insertMenu' | 'viewMenu'
> {
  return {
    menus: {
      file: c('sheets_2025:Spreadsheet editor menubar title').t`File`,
      edit: c('sheets_2025:Spreadsheet editor menubar title').t`Edit`,
      view: c('sheets_2025:Spreadsheet editor menubar title').t`View`,
      insert: c('sheets_2025:Spreadsheet editor menubar title').t`Insert`,
      format: c('sheets_2025:Spreadsheet editor menubar title').t`Format`,
      data: c('sheets_2025:Spreadsheet editor menubar title').t`Data`,
    },
    contextMenu: {
      '(Blanks)': c('sheets_2025:Spreadsheet context menu').t`(Blanks)`,
      Copy: c('sheets_2025:Spreadsheet context menu').t`Copy`,
      Paste: c('sheets_2025:Spreadsheet context menu').t`Paste`,
      Clear: c('sheets_2025:Spreadsheet context menu').t`Clear`,
      'Clear formatting': c('sheets_2025:Spreadsheet context menu').t`Clear formatting`,
      'Clear content': c('sheets_2025:Spreadsheet context menu').t`Clear content`,
      'Insert table row': c('sheets_2025:Spreadsheet context menu').t`Insert table row`,
      'Insert table column to the left': c('sheets_2025:Spreadsheet context menu').t`Insert table column to the left`,
      'Insert table column to the right': c('sheets_2025:Spreadsheet context menu').t`Insert table column to the right`,
      'Insert link': c('sheets_2025:Spreadsheet context menu').t`Insert link`,
      'Insert cells and shift cells right': c('sheets_2025:Spreadsheet context menu')
        .t`Insert cells and shift cells right`,
      'Insert cells and shift cells down': c('sheets_2025:Spreadsheet context menu')
        .t`Insert cells and shift cells down`,
      Delete: c('sheets_2025:Spreadsheet context menu').t`Delete`,
      'Delete column': c('sheets_2025:Spreadsheet context menu').t`Delete column`,
      'Delete row': c('sheets_2025:Spreadsheet context menu').t`Delete row`,
      'Delete table row': c('sheets_2025:Spreadsheet context menu').t`Delete table row`,
      'Delete table column': c('sheets_2025:Spreadsheet context menu').t`Delete table column`,
      'Delete cells and shift cells left': c('sheets_2025:Spreadsheet context menu')
        .t`Delete cells and shift cells left`,
      'Delete cells and shift cells up': c('sheets_2025:Spreadsheet context menu').t`Delete cells and shift cells up`,
      'Hide column': c('sheets_2025:Spreadsheet context menu').t`Hide column`,
      'Hide row': c('sheets_2025:Spreadsheet context menu').t`Hide row`,
      'Resize column': c('sheets_2025:Spreadsheet context menu').t`Resize column`,
      'Resize row': c('sheets_2025:Spreadsheet context menu').t`Resize row`,
      'Auto fit to data': c('sheets_2025:Spreadsheet context menu').t`Auto fit to data`,
      Custom: c('sheets_2025:Spreadsheet context menu').t`Custom`,
      'Freeze up to column': c('sheets_2025:Spreadsheet context menu').t`Freeze up to column`,
      'Unfreeze columns': c('sheets_2025:Spreadsheet context menu').t`Unfreeze columns`,
      'Freeze up to row': c('sheets_2025:Spreadsheet context menu').t`Freeze up to row`,
      'Unfreeze rows': c('sheets_2025:Spreadsheet context menu').t`Unfreeze rows`,
      'Sort sheet A to Z': c('sheets_2025:Spreadsheet context menu').t`Sort sheet A to Z`,
      'Sort sheet Z to A': c('sheets_2025:Spreadsheet context menu').t`Sort sheet Z to A`,
      Sort: c('sheets_2025:Spreadsheet context menu').t`Sort`,
      'Sort range A → Z': c('sheets_2025:Spreadsheet context menu').t`Sort range A → Z`,
      'Sort range Z → A': c('sheets_2025:Spreadsheet context menu').t`Sort range Z → A`,
      Filter: c('sheets_2025:Spreadsheet context menu').t`Filter`,
      'Cell value': c('sheets_2025:Spreadsheet context menu').t`Cell value`,
      Insert: c('sheets_2025:Spreadsheet context menu (columns/rows)').t`Insert`,
      above: c('sheets_2025:Spreadsheet context menu (columns/rows)').t`above`,
      below: c('sheets_2025:Spreadsheet context menu (columns/rows)').t`below`,
      left: c('sheets_2025:Spreadsheet context menu (columns/rows)').t`left`,
      right: c('sheets_2025:Spreadsheet context menu (columns/rows)').t`right`,
      Table: c('sheets_2025:Spreadsheet context menu').t`Table`,
      'Convert to range': c('sheets_2025:Spreadsheet context menu').t`Convert to range`,
      'Edit table': c('sheets_2025:Spreadsheet context menu').t`Edit table`,
      'Convert to table': c('sheets_2025:Spreadsheet context menu').t`Convert to table`,
      'Create a filter': c('sheets_2025:Spreadsheet context menu').t`Create a filter`,
      'Remove filter': c('sheets_2025:Spreadsheet context menu').t`Remove filter`,
      'Conditional format': c('sheets_2025:Spreadsheet context menu').t`Conditional format`,
      'Data validation': c('sheets_2025:Spreadsheet context menu').t`Data validation`,
      'Insert note': c('sheets_2025:Spreadsheet context menu').t`Insert note`,
      'Define named range': c('sheets_2025:Spreadsheet context menu').t`Define named range`,
      'More cell actions': c('sheets_2025:Spreadsheet context menu').t`More cell actions`,
      'AI Quick Edit': c('sheets_2025:Spreadsheet context menu').t`AI Quick Edit`,
      'Paste special': c('sheets_2025:Spreadsheet context menu').t`Paste special`,
      'Values only': c('sheets_2025:Spreadsheet context menu').t`Values only`,
      'Formatting only': c('sheets_2025:Spreadsheet context menu').t`Formatting only`,
      'Formula only': c('sheets_2025:Spreadsheet context menu').t`Formula only`,
      'Link only': c('sheets_2025:Spreadsheet context menu').t`Link only`,
      Transposed: c('sheets_2025:Spreadsheet context menu').t`Transposed`,
      Comma: c('sheets_2025:Spreadsheet context menu').t`Comma`,
      Semicolon: c('sheets_2025:Spreadsheet context menu').t`Semicolon`,
      Period: c('sheets_2025:Spreadsheet context menu').t`Period`,
      Space: c('sheets_2025:Spreadsheet context menu').t`Space`,
      Pipe: c('sheets_2025:Spreadsheet context menu').t`Pipe`,
    },
    dataMenu: {
      'Sort sheet': c('sheets_2025:Spreadsheet editor menubar data menu').t`Sort sheet`,
      // translator: this is used in the context of three strings put together - "Sort sheet by | column X | (A to Z)" (the | symbol is used to show the separation between the different strings), and it's separate because "column X" needs to be bold, the order of these three strings cannot be changed and they will be separated by spaces
      'Sort sheet by': c('sheets_2025:Spreadsheet editor menubar data menu (sort submenu)').t`Sort sheet by`,
      // translator: this is used in the context of three strings put together - "Sort sheet by | column X | (A to Z)" (the | symbol is used to show the separation between the different strings), and it's separate because "column X" needs to be bold, the order of these three strings cannot be changed and they will be separated by spaces
      '(A to Z)': c('sheets_2025:Spreadsheet editor menubar data menu (sort submenu)').t`(A to Z)`,
      // translator: this is used in the context of three strings put together - "Sort sheet by | column X | (Z to A)" (the | symbol is used to show the separation between the different strings), and it's separate because "column X" needs to be bold, the order of these three strings cannot be changed and they will be separated by spaces
      '(Z to A)': c('sheets_2025:Spreadsheet editor menubar data menu (sort submenu)').t`(Z to A)`,
      'Create a filter': c('sheets_2025:Spreadsheet editor menubar data menu').t`Create a filter`,
      'Remove filter': c('sheets_2025:Spreadsheet editor menubar data menu').t`Remove filter`,
      'Protect range': c('sheets_2025:Spreadsheet editor menubar data menu').t`Protect range`,
      'Unlock range': c('sheets_2025:Spreadsheet editor menubar data menu').t`Unlock range`,
      'Data validation': c('sheets_2025:Spreadsheet editor menubar data menu').t`Data validation`,
      'column ${columnLetter}': (columnLetter: string) => {
        // translator: this is used in the context of three strings put together - "Sort sheet by | column X | (A to Z)" (the | symbol is used to show the separation between the different strings), and it's separate because "column X" needs to be bold, the order of these three strings cannot be changed and they will be separated by spaces
        return c('sheets_2025:Spreadsheet editor menubar data menu (sort submenu)').t`column ${columnLetter}`
      },
    },
    editMenu: {
      Undo: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Undo`,
      Redo: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Redo`,
      Cut: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Cut`,
      Copy: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Copy`,
      Paste: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Paste`,
      'Paste special': c('sheets_2025:Spreadsheet editor menubar edit menu').t`Paste special`,
      'Values only': c('sheets_2025:Spreadsheet editor menubar edit menu').t`Values only`,
      'Formatting only': c('sheets_2025:Spreadsheet editor menubar edit menu').t`Formatting only`,
      'Formula only': c('sheets_2025:Spreadsheet editor menubar edit menu').t`Formula only`,
      'Link only': c('sheets_2025:Spreadsheet editor menubar edit menu').t`Link only`,
      Transposed: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Transposed`,
      Find: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Find`,
    },
    fileMenu: {
      'New spreadsheet': c('sheets_2025:Spreadsheet editor menubar file menu').t`New spreadsheet`,
      'New document': c('sheets_2025:Spreadsheet editor menubar file menu').t`New document`,
      Import: c('sheets_2025:Spreadsheet editor menubar file menu').t`Import`,
      'Make a copy': c('sheets_2025:Spreadsheet editor menubar file menu').t`Make a copy`,
      'Move to folder': c('sheets_2025:Spreadsheet editor menubar file menu').t`Move to folder`,
      'See version history': c('sheets_2025:Spreadsheet editor menubar file menu').t`See version history`,
      'Move to trash': c('sheets_2025:Spreadsheet editor menubar file menu').t`Move to trash`,
      Print: c('sheets_2025:Spreadsheet editor menubar file menu').t`Print`,
      Download: c('sheets_2025:Spreadsheet editor menubar file menu').t`Download`,
      'Microsoft Excel (.xlsx)': c('sheets_2025:Spreadsheet editor menubar file menu').t`Microsoft Excel (.xlsx)`,
      'OpenDocument Spreadsheet (.ods) (Beta)': c('sheets_2025:Spreadsheet editor menubar file menu')
        .t`OpenDocument Spreadsheet (.ods) (Beta)`,
      'Comma Separated Values (.csv)': c('sheets_2025:Spreadsheet editor menubar file menu')
        .t`Comma Separated Values (.csv)`,
      'Tab Separated Values (.tsv)': c('sheets_2025:Spreadsheet editor menubar file menu')
        .t`Tab Separated Values (.tsv)`,
      Help: c('sheets_2025:Spreadsheet editor menubar file menu').t`Help`,
      'View recent spreadsheets': c('sheets_2025:Spreadsheet editor menubar file menu').t`View recent spreadsheets`,
      // eslint-disable-next-line proton/restricted-syntax -- Keep the existing literal gettext identity for catalog compatibility.
      'Open Proton Drive': c('sheets_2025:Spreadsheet editor menubar file menu').t`Open Proton Drive`,
      'Download logs': c('sheets_2025:Spreadsheet editor menubar file menu').t`Download logs`,
      'Toggle debug mode': c('sheets_2025:Spreadsheet editor menubar file menu').t`Toggle debug mode`,
      Settings: c('sheets_2025:Spreadsheet editor menubar file menu').t`Settings`,
    },
    formatMenu: {
      Theme: c('sheets_2025:Spreadsheet editor menubar format menu').t`Theme`,
      'Table formatting': c('sheets_2025:Spreadsheet editor menubar format menu').t`Table formatting`,
      'Cell styles': c('sheets_2025:Spreadsheet editor menubar format menu').t`Cell styles`,
      Number: c('sheets_2025:Spreadsheet editor menubar format menu').t`Number`,
      Text: c('sheets_2025:Spreadsheet editor menubar format menu').t`Text`,
      Bold: c('sheets_2025:Spreadsheet editor menubar format menu').t`Bold`,
      Italic: c('sheets_2025:Spreadsheet editor menubar format menu').t`Italic`,
      Underline: c('sheets_2025:Spreadsheet editor menubar format menu').t`Underline`,
      Strikethrough: c('sheets_2025:Spreadsheet editor menubar format menu').t`Strikethrough`,
      Alignment: c('sheets_2025:Spreadsheet editor menubar format menu').t`Alignment`,
      Left: c('sheets_2025:Spreadsheet editor menubar format menu (alignment)').t`Left`,
      Center: c('sheets_2025:Spreadsheet editor menubar format menu (alignment)').t`Center`,
      Right: c('sheets_2025:Spreadsheet editor menubar format menu (alignment)').t`Right`,
      Top: c('sheets_2025:Spreadsheet editor menubar format menu (alignment)').t`Top`,
      Middle: c('sheets_2025:Spreadsheet editor menubar format menu (alignment)').t`Middle`,
      Bottom: c('sheets_2025:Spreadsheet editor menubar format menu (alignment)').t`Bottom`,
      Wrapping: c('sheets_2025:Spreadsheet editor menubar format menu').t`Wrapping`,
      Overflow: c('sheets_2025:Spreadsheet editor menubar format menu (wrapping)').t`Overflow`,
      Wrap: c('sheets_2025:Spreadsheet editor menubar format menu (wrapping)').t`Wrap`,
      Clip: c('sheets_2025:Spreadsheet editor menubar format menu (wrapping)').t`Clip`,
      'Font size': c('sheets_2025:Spreadsheet editor menubar format menu').t`Font size`,
      'Merge cells': c('sheets_2025:Spreadsheet editor cell merge options').t`Merge cells`,
      'Conditional formatting': c('sheets_2025:Spreadsheet editor menubar format menu').t`Conditional formatting`,
      Clear: c('sheets_2025:Spreadsheet editor menubar format menu').t`Clear`,
      'Clear formatting': c('sheets_2025:Spreadsheet editor menubar format menu').t`Clear formatting`,
      'Clear content': c('sheets_2025:Spreadsheet editor menubar format menu').t`Clear content`,

      'Coming soon...': c('sheets_2025:Spreadsheet formatMenu').t`Coming soon...`,
    },
    insertMenu: {
      Cells: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Cells`,
      'Insert cells and shift right': c('sheets_2025:Spreadsheet editor menubar insert menu')
        .t`Insert cells and shift right`,
      'Insert cells and shift down': c('sheets_2025:Spreadsheet editor menubar insert menu')
        .t`Insert cells and shift down`,
      // translator: this is used in the context of three strings put together - "Insert | N rows/columns | above/below" (the | symbol is used to show the separation between the three strings, and the / symbol is used to denote variants), and it's separate because "X columns/rows" needs to be bold, the order of these three strings cannot be changed and they will be separated by spaces
      Insert: c('sheets_2025:Spreadsheet editor menubar insert menu (columns/rows submenus)').t`Insert`,
      Rows: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Rows`,
      // translator: this is used in the context of three strings put together - "Insert | N rows | above" (the | symbol is used to show the separation between the three strings, and the / symbol is used to denote variants), and it's separate because "X rows" needs to be bold, the order of these three strings cannot be changed and they will be separated by spaces
      above: c('sheets_2025:Spreadsheet editor menubar insert menu (columns/rows submenus)').t`above`,
      // translator: this is used in the context of three strings put together - "Insert | N rows | below" (the | symbol is used to show the separation between the three strings, and the / symbol is used to denote variants), and it's separate because "X rows" needs to be bold, the order of these three strings cannot be changed and they will be separated by spaces
      below: c('sheets_2025:Spreadsheet editor menubar insert menu (columns/rows submenus)').t`below`,
      Columns: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Columns`,
      // translator: this is used in the context of three strings put together - "Insert | N columns | left" (the | symbol is used to show the separation between the three strings, and the / symbol is used to denote variants), and it's separate because "X columns" needs to be bold, the order of these three strings cannot be changed and they will be separated by spaces
      left: c('sheets_2025:Spreadsheet editor menubar insert menu (columns/rows submenus)').t`left`,
      // translator: this is used in the context of three strings put together - "Insert | N columns | right" (the | symbol is used to show the separation between the three strings, and the / symbol is used to denote variants), and it's separate because "X columns" needs to be bold, the order of these three strings cannot be changed and they will be separated by spaces
      right: c('sheets_2025:Spreadsheet editor menubar insert menu (columns/rows submenus)').t`right`,
      Sheet: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Sheet`,
      Chart: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Chart`,
      Image: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Image`,
      Function: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Function`,
      Link: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Link`,
      Dropdown: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Dropdown`,
      Checkbox: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Checkbox`,
      Note: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Note`,
      '${numberOfColumns} column': (numberOfColumns: number) => {
        // translator: this is used in the context of three strings put together - "Insert | N columns | above/below" (the | symbol is used to show the separation between the three strings, and the / symbol is used to denote variants), and it's separate because "X columns/rows" needs to be bold, the order of these three strings cannot be changed and they will be separated by spaces
        return c('sheets_2025:Spreadsheet editor menubar insert menu (columns/rows submenus)').ngettext(
          msgid`${numberOfColumns} column`,
          `${numberOfColumns} columns`,
          numberOfColumns,
        )
      },
      '${numberOfRows} row': (numberOfRows: number) => {
        // translator: this is used in the context of three strings put together - "Insert | N rows | above/below" (the | symbol is used to show the separation between the three strings, and the / symbol is used to denote variants), and it's separate because "X columns/rows" needs to be bold, the order of these three strings cannot be changed and they will be separated by spaces
        return c('sheets_2025:Spreadsheet editor menubar insert menu (columns/rows submenus)').ngettext(
          msgid`${numberOfRows} row`,
          `${numberOfRows} rows`,
          numberOfRows,
        )
      },
    },
    viewMenu: {
      Show: c('sheets_2025:Spreadsheet editor menubar view menu').t`Show`,
      'Formula bar': c('sheets_2025:Spreadsheet editor menubar view menu').t`Formula bar`,
      Gridlines: c('sheets_2025:Spreadsheet editor menubar view menu').t`Gridlines`,
      Freeze: c('sheets_2025:Spreadsheet editor menubar view menu').t`Freeze`,
      // translator: this is used in the context of two strings put together - (freeze) "Up to | row X" or (freeze) "up to | column X" (the | symbol is used to show the separation between the two strings), and it's separate because "row X" (or "column X") needs to be bold, the order of these two strings cannot be changed and they will be separated by spaces
      'Up to': c('sheets_2025:Spreadsheet editor menubar view menu (freeze submenu)').t`Up to`,
      Zoom: c('sheets_2025:Spreadsheet editor menubar view menu').t`Zoom`,
      'Hidden sheets': c('sheets_2025:Spreadsheet editor menubar view menu (hidden sheets submenu)').t`Hidden sheets`,
      'column ${columnLetter}': (columnLetter: string) => {
        // translator: this is used in the context of two strings put together - (freeze) "Up to | column X" (the | symbol is used to show the separation between the two strings), and it's separate because "column X" needs to be bold, the order of these two strings cannot be changed and they will be separated by spaces
        return c('sheets_2025:Spreadsheet editor menubar view menu (freeze submenu)').t`column ${columnLetter}`
      },
      'row ${rowNumber}': (rowNumber: number) => {
        // translator: this is used in the context of two strings put together - (freeze) "Up to | row X" (the | symbol is used to show the separation between the two strings), and it's separate because "row X" needs to be bold, the order of these two strings cannot be changed and they will be separated by spaces
        return c('sheets_2025:Spreadsheet editor menubar view menu (freeze submenu)').t`row ${rowNumber}`
      },

      'No rows': c('sheets_2025:Spreadsheet viewMenu').t`No rows`,
      '1 row': c('sheets_2025:Spreadsheet viewMenu').t`1 row`,
      '2 rows': c('sheets_2025:Spreadsheet viewMenu').t`2 rows`,
      'No columns': c('sheets_2025:Spreadsheet viewMenu').t`No columns`,
      '1 column': c('sheets_2025:Spreadsheet viewMenu').t`1 column`,
      '2 columns': c('sheets_2025:Spreadsheet viewMenu').t`2 columns`,
    },
  }
}
