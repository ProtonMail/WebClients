import type { ProtonSheetsState } from '../../state'
import { Item, Menu, MenuItem, MenuSeparator, SubMenu } from './primitives'
import { c } from 'ttag'

export type InsertMenuProps = {
  state: ProtonSheetsState
}

export function InsertMenu({ state }: InsertMenuProps) {
  return (
    <Menu
      menuProps={{ autoFocusOnHide: true }}
      renderMenuButton={
        <Item size="full" icon="plus-circle">{c('sheets_2025:Spreadsheet editor toolbar').t`Insert`}</Item>
      }
    >
      <SubMenu renderMenuItem={<MenuItem>{c('sheets_2025:Spreadsheet editor toolbar').t`Cells`}</MenuItem>}>
        <MenuItem
          onClick={() => state.onInsertCellsShiftRight(state.activeSheetId, state.activeCell, state.selections)}
        >{c('sheets_2025:Spreadsheet editor toolbar').t`Insert cells and shift right`}</MenuItem>
        <MenuItem
          onClick={() => state.onInsertCellsShiftDown(state.activeSheetId, state.activeCell, state.selections)}
        >{c('sheets_2025:Spreadsheet editor toolbar').t`Insert cells and shift down`}</MenuItem>
      </SubMenu>
      <SubMenu renderMenuItem={<MenuItem>{c('sheets_2025:Spreadsheet editor toolbar').t`Rows`}</MenuItem>}>
        <MenuItem onClick={() => state.onInsertRow(state.activeSheetId, state.activeCell.rowIndex, 1)}>{c(
          'sheets_2025:Spreadsheet editor toolbar',
        ).t`Insert one row above`}</MenuItem>
        <MenuItem onClick={() => state.onInsertRow(state.activeSheetId, state.activeCell.rowIndex + 1, 1)}>{c(
          'sheets_2025:Spreadsheet editor toolbar',
        ).t`Insert one row below`}</MenuItem>
      </SubMenu>
      <SubMenu renderMenuItem={<MenuItem>{c('sheets_2025:Spreadsheet editor toolbar').t`Columns`}</MenuItem>}>
        <MenuItem onClick={() => state.onInsertColumn(state.activeSheetId, state.activeCell.columnIndex, 1)}>{c(
          'sheets_2025:Spreadsheet editor toolbar',
        ).t`Insert one column left`}</MenuItem>
        <MenuItem onClick={() => state.onInsertColumn(state.activeSheetId, state.activeCell.columnIndex + 1, 1)}>{c(
          'sheets_2025:Spreadsheet editor toolbar',
        ).t`Insert one column right`}</MenuItem>
      </SubMenu>
      <MenuItem onClick={() => state.onCreateNewSheet()}>{c('sheets_2025:Spreadsheet editor toolbar')
        .t`Sheet`}</MenuItem>
      <MenuSeparator />
      <MenuItem
        onClick={() => state.chartsState.onCreateChart(state.activeSheetId, state.activeCell, state.selections)}
      >{c('sheets_2025:Spreadsheet editor toolbar').t`Chart`}</MenuItem>
      {/* TODO: the items below are blocked by other pieces of UI */}
      {/* <SubMenu renderMenuItem={<MenuItem>{c('sheets_2025:Spreadsheet editor toolbar').t`Image`}</MenuItem>}>
        <MenuItem>{c('sheets_2025:Spreadsheet editor toolbar').t`Insert image in cell`}</MenuItem>
        <MenuItem>{c('sheets_2025:Spreadsheet editor toolbar').t`Insert image over cell`}</MenuItem>
      </SubMenu>
      <MenuSeparator />
      <MenuItem>{c('sheets_2025:Spreadsheet editor toolbar').t`Link`}</MenuItem>
      <MenuSeparator />
      <MenuItem>{c('sheets_2025:Spreadsheet editor toolbar').t`Dropdown`}</MenuItem>
      <MenuItem>{c('sheets_2025:Spreadsheet editor toolbar').t`Checkbox`}</MenuItem> */}
      <MenuSeparator />
      <MenuItem onClick={() => state.onInsertNote?.(state.activeSheetId, state.activeCell, state.selections)}>{c(
        'sheets_2025:Spreadsheet editor toolbar',
      ).t`Note`}</MenuItem>
    </Menu>
  )
}
