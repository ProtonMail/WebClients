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
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.cell} />}>{s('Cells')}</UI.SubMenuButton>
          <UI.SubMenu>
            <UI.MenuItem onClick={useUI.$.insert.cellsShiftRight}>{s('Insert cells and shift right')}</UI.MenuItem>
            <UI.MenuItem onClick={useUI.$.insert.cellsShiftDown}>{s('Insert cells and shift down')}</UI.MenuItem>
          </UI.SubMenu>
        </Ariakit.MenuProvider>
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.rows} />}>{s('Rows')}</UI.SubMenuButton>
          <UI.SubMenu>
            <UI.MenuItem onClick={useUI.$.insert.rowAbove}>{s('Insert 1 row above')}</UI.MenuItem>
            <UI.MenuItem onClick={useUI.$.insert.rowBelow}>{s('Insert 1 row below')}</UI.MenuItem>
          </UI.SubMenu>
        </Ariakit.MenuProvider>
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.columns} />}>{s('Columns')}</UI.SubMenuButton>
          <UI.SubMenu>
            <UI.MenuItem onClick={useUI.$.insert.columnLeft}>{s('Insert 1 column left')}</UI.MenuItem>
            <UI.MenuItem onClick={useUI.$.insert.columnRight}>{s('Insert 1 column right')}</UI.MenuItem>
          </UI.SubMenu>
        </Ariakit.MenuProvider>
        <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.table} />} onClick={useUI.$.insert.sheet}>
          {s('Sheet')}
        </UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.barChart} />} onClick={useUI.$.insert.chart}>
          {s('Chart')}
        </UI.MenuItem>
        {/* TODO: all actions below (except 'Note') */}
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="image" />}>{s('Image')}</UI.SubMenuButton>
          <UI.SubMenu>{/* TODO: waiting for design */}</UI.SubMenu>
        </Ariakit.MenuProvider>
        <UI.MenuSeparator />
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.sigma} />}>{s('Functions')}</UI.SubMenuButton>
          <UI.SubMenu>{/* TODO: waiting for design */}</UI.SubMenu>
        </Ariakit.MenuProvider>
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="link" />}>{s('Link')}</UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.dropdown} />}>{s('Dropdown')}</UI.MenuItem>
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="checkmark-circle" />}>{s('Checkbox')}</UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem onClick={useUI.$.insert.note}>{s('Note')}</UI.MenuItem>
      </UI.Menu>
    </Ariakit.MenuProvider>
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
    Functions: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Functions`,
    Link: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Link`,
    Dropdown: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Dropdown`,
    Checkbox: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Checkbox`,
    Note: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Note`,
  }
}
