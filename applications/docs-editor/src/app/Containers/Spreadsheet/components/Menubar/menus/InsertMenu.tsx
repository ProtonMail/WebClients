import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'
import { c, msgid } from 'ttag'
import { createStringifier } from '../../../stringifier'
import * as UI from '../../ui'
import * as Icons from '../../icons'
import { useUI } from '../../../ui-store'
import { InsertFormulaMenu } from '../../shared/InsertFormulaMenu'

const { s } = createStringifier(strings)

export interface InsertMenuProps extends Ariakit.MenuProviderProps {
  renderMenuButton: ReactElement
}

export function InsertMenu({ renderMenuButton, ...props }: InsertMenuProps) {
  return (
    <Ariakit.MenuProvider {...props}>
      <Ariakit.MenuButton render={renderMenuButton} />
      <UI.Menu>
        <CellsSubmenu />
        <RowsSubmenu />
        <ColumnsSubmenu />
        <Sheet />
        <UI.MenuSeparator />
        <Chart />
        {/* <ImageSubmenu /> */}
        <UI.MenuSeparator />
        <FunctionSubmenu />
        <Link />
        <UI.MenuSeparator />
        <Dropdown />
        <Checkbox />
        <UI.MenuSeparator />
        <Note />
      </UI.Menu>
    </Ariakit.MenuProvider>
  )
}

function CellsSubmenu() {
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={Icons.cell} />}
        disabled={useUI((ui) => ui.selection.isMultiple || ui.info.isReadonly)}
      >
        {s('Cells')}
      </UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(useUI.$.insert.cellsShiftRight)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Insert cells and shift right')}
        </UI.MenuItem>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(useUI.$.insert.cellsShiftDown)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Insert cells and shift down')}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function RowsSubmenu() {
  const selectedRowCount = useUI((ui) => ui.info.selectedRowCount)
  const insertRowsAbove = useUI.$.insert.rowsAbove
  const insertRowsBelow = useUI.$.insert.rowsBelow
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={Icons.rows} />}
        disabled={useUI((ui) => ui.selection.isMultiple || ui.info.isReadonly)}
      >
        {s('Rows')}
      </UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(() => insertRowsAbove(selectedRowCount))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Insert')} <b>{rowsString(selectedRowCount)}</b> {s('above')}
        </UI.MenuItem>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(() => insertRowsBelow(selectedRowCount))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Insert')} <b>{rowsString(selectedRowCount)}</b> {s('below')}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function ColumnsSubmenu() {
  const selectedColumnCount = useUI((ui) => ui.info.selectedColumnCount)
  const insertColumnsLeft = useUI.$.insert.columnsLeft
  const insertColumnsRight = useUI.$.insert.columnsRight
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={Icons.columns} />}
        disabled={useUI((ui) => ui.selection.isMultiple || ui.info.isReadonly)}
      >
        {s('Columns')}
      </UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(() => insertColumnsLeft(selectedColumnCount))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Insert')} <b>{columnsString(selectedColumnCount)}</b> {s('left')}
        </UI.MenuItem>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(() => insertColumnsRight(selectedColumnCount))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Insert')} <b>{columnsString(selectedColumnCount)}</b> {s('right')}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function Sheet() {
  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.table} />}
      onClick={useUI.$.withFocusGrid(useUI.$.insert.sheet)}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {s('Sheet')}
    </UI.MenuItem>
  )
}

function Chart() {
  const insertChart = useUI.$.insert.chart
  const onRequestEditChart = useUI((ui) => ui.legacy.chartsState.onRequestEditChart)

  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.barChart} />}
      onClick={() => {
        const chart = insertChart()
        onRequestEditChart(chart)
      }}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {s('Chart')}
    </UI.MenuItem>
  )
}

// https://protonag.atlassian.net/browse/REALTIME-33
// function ImageSubmenu() {
//   return (
//     <Ariakit.MenuProvider>
//       <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="image" />} disabled={useUI((ui) => ui.info.isReadonly)}>
//         {s('Image')}
//       </UI.SubMenuButton>
//       <UI.SubMenu>
//         {/* TODO: waiting for design */}
//         <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="clock" />}>Coming soon...</UI.MenuItem>
//       </UI.SubMenu>
//     </Ariakit.MenuProvider>
//   )
// }

function FunctionSubmenu() {
  return (
    <InsertFormulaMenu asSubmenu>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.sigma} />} disabled={useUI((ui) => ui.info.isReadonly)}>
        {s('Function')}
      </UI.SubMenuButton>
    </InsertFormulaMenu>
  )
}

function Link() {
  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon legacyName="link" />}
      onClick={useUI.$.insert.link}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {s('Link')}
    </UI.MenuItem>
  )
}

function Dropdown() {
  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.dropdown} />}
      onClick={useUI.$.insert.dropdown}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {s('Dropdown')}
    </UI.MenuItem>
  )
}

function Checkbox() {
  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon legacyName="checkmark-circle" />}
      onClick={useUI.$.withFocusGrid(useUI.$.insert.checkbox)}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {s('Checkbox')}
    </UI.MenuItem>
  )
}

function Note() {
  return (
    // TODO: icon needs to be note-with-text but we don't have it yet
    <UI.MenuItem
      leadingIconSlot={<UI.Icon legacyName="note" />}
      onClick={useUI.$.insert.note}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {s('Note')}
    </UI.MenuItem>
  )
}

function columnsString(numberOfColumns: number) {
  // translator: this is used in the context of three strings put together - "Insert | N columns | above/below" (the | symbol is used to show the separation between the three strings, and the / symbol is used to denote variants), and it's separate because "X columns/rows" needs to be bold, the order of these three strings cannot be changed and they will be separated by spaces
  return c('sheets_2025:Spreadsheet editor menubar insert menu (columns/rows submenus)').ngettext(
    msgid`${numberOfColumns} column`,
    `${numberOfColumns} columns`,
    numberOfColumns,
  )
}

function rowsString(numberOfRows: number) {
  // translator: this is used in the context of three strings put together - "Insert | N rows | above/below" (the | symbol is used to show the separation between the three strings, and the / symbol is used to denote variants), and it's separate because "X columns/rows" needs to be bold, the order of these three strings cannot be changed and they will be separated by spaces
  return c('sheets_2025:Spreadsheet editor menubar insert menu (columns/rows submenus)').ngettext(
    msgid`${numberOfRows} row`,
    `${numberOfRows} rows`,
    numberOfRows,
  )
}

function strings() {
  return {
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
  }
}
