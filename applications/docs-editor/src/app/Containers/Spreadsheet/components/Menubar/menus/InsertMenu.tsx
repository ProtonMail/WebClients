import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'
import { c } from 'ttag'
import { createStringifier } from '../../../stringifier'
import * as UI from '../../ui'
import * as Icons from '../../icons'
import { useUI } from '../../../ui-store'

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
        <ImageSubmenu />
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
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.cell} />}>{s('Cells')}</UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem onClick={useUI.$.withFocusGrid(useUI.$.insert.cellsShiftRight)}>
          {s('Insert cells and shift right')}
        </UI.MenuItem>
        <UI.MenuItem onClick={useUI.$.withFocusGrid(useUI.$.insert.cellsShiftDown)}>
          {s('Insert cells and shift down')}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function RowsSubmenu() {
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.rows} />}>{s('Rows')}</UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem onClick={useUI.$.withFocusGrid(useUI.$.insert.rowAbove)}>{s('Insert 1 row above')}</UI.MenuItem>
        <UI.MenuItem onClick={useUI.$.withFocusGrid(useUI.$.insert.rowBelow)}>{s('Insert 1 row below')}</UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function ColumnsSubmenu() {
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.columns} />}>{s('Columns')}</UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem onClick={useUI.$.withFocusGrid(useUI.$.insert.columnLeft)}>
          {s('Insert 1 column left')}
        </UI.MenuItem>
        <UI.MenuItem onClick={useUI.$.withFocusGrid(useUI.$.insert.columnRight)}>
          {s('Insert 1 column right')}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function Sheet() {
  return (
    <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.table} />} onClick={useUI.$.withFocusGrid(useUI.$.insert.sheet)}>
      {s('Sheet')}
    </UI.MenuItem>
  )
}

function Chart() {
  return (
    <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.barChart} />} onClick={useUI.$.insert.chart}>
      {s('Chart')}
    </UI.MenuItem>
  )
}

function ImageSubmenu() {
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="image" />}>{s('Image')}</UI.SubMenuButton>
      <UI.SubMenu>
        {/* TODO: waiting for design */}
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="clock" />}>Coming soon...</UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function FunctionSubmenu() {
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.sigma} />}>{s('Function')}</UI.SubMenuButton>
      <UI.SubMenu>
        {/* TODO: implement */}
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="clock" />}>Coming soon...</UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function Link() {
  return (
    <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="link" />} onClick={useUI.$.insert.link}>
      {s('Link')}
    </UI.MenuItem>
  )
}

function Dropdown() {
  return (
    <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.dropdown} />} onClick={useUI.$.insert.dropdown}>
      {s('Dropdown')}
    </UI.MenuItem>
  )
}

function Checkbox() {
  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon legacyName="checkmark-circle" />}
      onClick={useUI.$.withFocusGrid(useUI.$.insert.checkbox)}
    >
      {s('Checkbox')}
    </UI.MenuItem>
  )
}

function Note() {
  return (
    // TODO: icon needs to be note-with-text but we don't have it yet
    <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="note" />} onClick={useUI.$.insert.note}>
      {s('Note')}
    </UI.MenuItem>
  )
}

function strings() {
  return {
    Cells: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Cells`,
    'Insert cells and shift right': c('sheets_2025:Spreadsheet editor menubar insert menu')
      .t`Insert cells and shift right`,
    'Insert cells and shift down': c('sheets_2025:Spreadsheet editor menubar insert menu')
      .t`Insert cells and shift down`,
    Rows: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Rows`,
    'Insert 1 row above': c('sheets_2025:Spreadsheet editor menubar insert menu').t`Insert 1 row above`,
    'Insert 1 row below': c('sheets_2025:Spreadsheet editor menubar insert menu').t`Insert 1 row below`,
    Columns: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Columns`,
    'Insert 1 column left': c('sheets_2025:Spreadsheet editor menubar insert menu').t`Insert 1 column left`,
    'Insert 1 column right': c('sheets_2025:Spreadsheet editor menubar insert menu').t`Insert 1 column right`,
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
