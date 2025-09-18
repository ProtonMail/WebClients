import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'
import { c } from 'ttag'
import { createStringifier } from '../../../stringifier'
import * as UI from '../../ui'
import * as Icons from '../../icons'
import { useUI } from '../../../ui-store'

const { s } = createStringifier(strings)

export interface DataMenuProps extends Ariakit.MenuProviderProps {
  renderMenuButton: ReactElement
}

export function DataMenu({ renderMenuButton, ...props }: DataMenuProps) {
  return (
    <Ariakit.MenuProvider {...props}>
      <Ariakit.MenuButton render={renderMenuButton} />
      <UI.Menu>
        <SortSubmenu />
        <CreateFilter />
        <UI.MenuSeparator />
        <ProtectRange />
        <DataValidation />
      </UI.Menu>
    </Ariakit.MenuProvider>
  )
}

function SortSubmenu() {
  return (
    <Ariakit.MenuProvider>
      {/* TODO: icon needs to be list-alphabetically-arrow-down but it's not yet in the icon set */}
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon legacyName="list-arrow-down" />}
        disabled={useUI((ui) => ui.info.isReadonly)}
      >
        {s('Sort sheet')}
      </UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(useUI.$.data.sortAscending)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Sort sheet by')} <b>{columnString(useUI((ui) => ui.info.activeColumnName))}</b> {s('(A to Z)')}
        </UI.MenuItem>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(useUI.$.data.sortDescending)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Sort sheet by')} <b>{columnString(useUI((ui) => ui.info.activeColumnName))}</b> {s('(Z to A)')}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function CreateFilter() {
  return (
    <UI.MenuItem
      leadingIconSlot={
        // TODO: need a different icon for "remove filter"
        useUI((ui) => ui.data.hasFilter) ? <UI.Icon legacyName="broom" /> : <UI.Icon legacyName="broom" />
      }
      onClick={useUI.$.withFocusGrid(useUI.$.data.toggleFilter)}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {useUI((ui) => ui.data.hasFilter) ? s('Remove filter') : s('Create a filter')}
    </UI.MenuItem>
  )
}

function ProtectRange() {
  return (
    <UI.MenuItem
      // TODO: need a different icon for "unlock range"
      leadingIconSlot={<UI.Icon legacyName={useUI((ui) => ui.data.isProtectedRange) ? 'lock' : 'lock'} />}
      onClick={useUI.$.withFocusGrid(useUI.$.data.toggleProtectRange)}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {useUI((ui) => ui.data.isProtectedRange) ? s('Unlock range') : s('Protect range')}
    </UI.MenuItem>
  )
}

function DataValidation() {
  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.tableCheck} />}
      onClick={useUI.$.data.validation.open}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {s('Data validation')}
    </UI.MenuItem>
  )
}

function columnString(columnLetter: string) {
  // translator: this is used in the context of three strings put together - "Sort sheet by | column X | (A to Z)" (the | symbol is used to show the separation between the different strings), and it's separate because "column X" needs to be bold, the order of these three strings cannot be changed and they will be separated by spaces
  return c('sheets_2025:Spreadsheet editor menubar data menu (sort submenu)').t`column ${columnLetter}`
}

function strings() {
  return {
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
  }
}
