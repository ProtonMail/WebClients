import type { SheetsMessages } from '../../../messages/SheetsMessages'
import { useSheetsMessages } from '../../../SheetsDependenciesProvider'
import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'

import * as UI from '../../ui'
import * as Icons from '../../icons'
import { useUI } from '../../../ui-store'
import { InsertFormulaMenu } from '../../shared/InsertFormulaMenu'

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
  const messages = useSheetsMessages()

  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={Icons.cell} />}
        disabled={useUI((ui) => ui.selection.isMultiple || ui.info.isReadonly)}
      >
        {messages.insertMenu.Cells}
      </UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(useUI.$.insert.cellsShiftRight)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.insertMenu['Insert cells and shift right']}
        </UI.MenuItem>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(useUI.$.insert.cellsShiftDown)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.insertMenu['Insert cells and shift down']}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function RowsSubmenu() {
  const messages = useSheetsMessages()

  const selectedRowCount = useUI((ui) => ui.info.selectedRowCount)
  const insertRowsAbove = useUI.$.insert.rowsAbove
  const insertRowsBelow = useUI.$.insert.rowsBelow
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={Icons.rows} />}
        disabled={useUI((ui) => ui.selection.isMultiple || ui.info.isReadonly)}
      >
        {messages.insertMenu.Rows}
      </UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(() => insertRowsAbove(selectedRowCount))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.insertMenu.Insert} <b>{rowsString(messages, selectedRowCount)}</b> {messages.insertMenu.above}
        </UI.MenuItem>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(() => insertRowsBelow(selectedRowCount))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.insertMenu.Insert} <b>{rowsString(messages, selectedRowCount)}</b> {messages.insertMenu.below}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function ColumnsSubmenu() {
  const messages = useSheetsMessages()

  const selectedColumnCount = useUI((ui) => ui.info.selectedColumnCount)
  const insertColumnsLeft = useUI.$.insert.columnsLeft
  const insertColumnsRight = useUI.$.insert.columnsRight
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={Icons.columns} />}
        disabled={useUI((ui) => ui.selection.isMultiple || ui.info.isReadonly)}
      >
        {messages.insertMenu.Columns}
      </UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(() => insertColumnsLeft(selectedColumnCount))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.insertMenu.Insert} <b>{columnsString(messages, selectedColumnCount)}</b> {messages.insertMenu.left}
        </UI.MenuItem>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(() => insertColumnsRight(selectedColumnCount))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.insertMenu.Insert} <b>{columnsString(messages, selectedColumnCount)}</b> {messages.insertMenu.right}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function Sheet() {
  const messages = useSheetsMessages()

  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.table} />}
      onClick={useUI.$.withFocusGrid(useUI.$.insert.sheet)}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.insertMenu.Sheet}
    </UI.MenuItem>
  )
}

function Chart() {
  const messages = useSheetsMessages()

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
      {messages.insertMenu.Chart}
    </UI.MenuItem>
  )
}

// https://protonag.atlassian.net/browse/REALTIME-33
// function ImageSubmenu() {
//   return (
//     <Ariakit.MenuProvider>
//       <UI.SubMenuButton leadingIconSlot={<UI.Icon data={image} />} disabled={useUI((ui) => ui.info.isReadonly)}>
//         {s('Image')}
//       </UI.SubMenuButton>
//       <UI.SubMenu>
//         {/* TODO: waiting for design */}
//         <UI.MenuItem leadingIconSlot={<UI.Icon data={clock} />}>Coming soon...</UI.MenuItem>
//       </UI.SubMenu>
//     </Ariakit.MenuProvider>
//   )
// }

function FunctionSubmenu() {
  const messages = useSheetsMessages()

  return (
    <InsertFormulaMenu asSubmenu>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.sigma} />} disabled={useUI((ui) => ui.info.isReadonly)}>
        {messages.insertMenu.Function}
      </UI.SubMenuButton>
    </InsertFormulaMenu>
  )
}

function Link() {
  const messages = useSheetsMessages()

  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.link} />}
      onClick={useUI.$.insert.link}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.insertMenu.Link}
    </UI.MenuItem>
  )
}

function Dropdown() {
  const messages = useSheetsMessages()

  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.dropdown} />}
      onClick={useUI.$.insert.dropdown}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.insertMenu.Dropdown}
    </UI.MenuItem>
  )
}

function Checkbox() {
  const messages = useSheetsMessages()

  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.checkmarkCircle} />}
      onClick={useUI.$.withFocusGrid(useUI.$.insert.checkbox)}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.insertMenu.Checkbox}
    </UI.MenuItem>
  )
}

function Note() {
  const messages = useSheetsMessages()

  return (
    // TODO: icon needs to be note-with-text but we don't have it yet
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.note} />}
      onClick={useUI.$.insert.note}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.insertMenu.Note}
    </UI.MenuItem>
  )
}

function columnsString(messages: SheetsMessages, numberOfColumns: number) {
  return messages.insertMenu['${numberOfColumns} column'](numberOfColumns)
}

function rowsString(messages: SheetsMessages, numberOfRows: number) {
  return messages.insertMenu['${numberOfRows} row'](numberOfRows)
}

export const insertMenuMessages = {
  insertMenu: {
    Cells: `Cells`,
    'Insert cells and shift right': `Insert cells and shift right`,
    'Insert cells and shift down': `Insert cells and shift down`,
    Insert: `Insert`,
    Rows: `Rows`,
    above: `above`,
    below: `below`,
    Columns: `Columns`,
    left: `left`,
    right: `right`,
    Sheet: `Sheet`,
    Chart: `Chart`,
    Image: `Image`,
    Function: `Function`,
    Link: `Link`,
    Dropdown: `Dropdown`,
    Checkbox: `Checkbox`,
    Note: `Note`,
    '${numberOfColumns} column': (numberOfColumns: number) =>
      numberOfColumns === 1 ? `${numberOfColumns} column` : `${numberOfColumns} columns`,
    '${numberOfRows} row': (numberOfRows: number) =>
      numberOfRows === 1 ? `${numberOfRows} row` : `${numberOfRows} rows`,
  },
}
