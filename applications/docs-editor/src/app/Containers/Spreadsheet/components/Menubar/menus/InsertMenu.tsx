import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'
import { c } from 'ttag'
import { useStringifier } from '../../../stringifier'
import type { ProtonSheetsUIState } from '../../../ui-state'
import * as UI from '../../ui'

export interface InsertMenuProps extends Ariakit.MenuProviderProps {
  ui: ProtonSheetsUIState
  renderMenuButton: ReactElement
}

export function InsertMenu({ ui, renderMenuButton, ...props }: InsertMenuProps) {
  const s = useStrings()
  return (
    <Ariakit.MenuProvider {...props}>
      <Ariakit.MenuButton render={renderMenuButton} />
      <UI.Menu>
        <Ariakit.MenuProvider>
          <UI.SubMenuButton>{s('Cells')}</UI.SubMenuButton>
          <UI.SubMenu>
            <UI.MenuItem onClick={ui.insert.cellsShiftRight}>{s('Insert cells and shift right')}</UI.MenuItem>
            <UI.MenuItem onClick={ui.insert.cellsShiftDown}>{s('Insert cells and shift down')}</UI.MenuItem>
          </UI.SubMenu>
        </Ariakit.MenuProvider>
        <Ariakit.MenuProvider>
          <UI.SubMenuButton>{s('Rows')}</UI.SubMenuButton>
          <UI.SubMenu>
            <UI.MenuItem onClick={ui.insert.rowAbove}>{s('Insert 1 row above')}</UI.MenuItem>
            <UI.MenuItem onClick={ui.insert.rowBelow}>{s('Insert 1 row below')}</UI.MenuItem>
          </UI.SubMenu>
        </Ariakit.MenuProvider>
        <Ariakit.MenuProvider>
          <UI.SubMenuButton>{s('Columns')}</UI.SubMenuButton>
          <UI.SubMenu>
            <UI.MenuItem onClick={ui.insert.columnLeft}>{s('Insert 1 column left')}</UI.MenuItem>
            <UI.MenuItem onClick={ui.insert.columnRight}>{s('Insert 1 column right')}</UI.MenuItem>
          </UI.SubMenu>
        </Ariakit.MenuProvider>
        <UI.MenuItem onClick={ui.insert.sheet}>{s('Sheet')}</UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem onClick={ui.insert.chart}>{s('Chart')}</UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem onClick={ui.insert.note}>{s('Note')}</UI.MenuItem>
      </UI.Menu>
    </Ariakit.MenuProvider>
  )
}

function useStrings() {
  return useStringifier(() => ({
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
    Note: c('sheets_2025:Spreadsheet editor menubar insert menu').t`Note`,
  }))
}
