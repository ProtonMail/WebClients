import type { SheetsMessages } from '../../../messages/SheetsMessages'
import { useSheetsMessages } from '../../../SheetsDependenciesProvider'
import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'

import * as UI from '../../ui'
import * as Icons from '../../icons'
import { useUI } from '../../../ui-store'

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
        {/* <ProtectRange /> */}
        <DataValidation />
      </UI.Menu>
    </Ariakit.MenuProvider>
  )
}

function SortSubmenu() {
  const messages = useSheetsMessages()

  return (
    <Ariakit.MenuProvider>
      {/* TODO: icon needs to be list-alphabetically-arrow-down but it's not yet in the icon set */}
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={Icons.listArrowDown} />}
        disabled={useUI((ui) => ui.info.isReadonly)}
      >
        {messages.dataMenu['Sort sheet']}
      </UI.SubMenuButton>
      <UI.SubMenu>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(useUI.$.data.sortAscending)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.dataMenu['Sort sheet by']}{' '}
          <b>
            {columnString(
              messages,
              useUI((ui) => ui.info.activeColumnName),
            )}
          </b>{' '}
          {messages.dataMenu['(A to Z)']}
        </UI.MenuItem>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(useUI.$.data.sortDescending)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.dataMenu['Sort sheet by']}{' '}
          <b>
            {columnString(
              messages,
              useUI((ui) => ui.info.activeColumnName),
            )}
          </b>{' '}
          {messages.dataMenu['(Z to A)']}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function CreateFilter() {
  const messages = useSheetsMessages()

  return (
    <UI.MenuItem
      leadingIconSlot={
        <UI.Icon
          data={
            // TODO: need a different icon for "remove filter"
            useUI((ui) => ui.data.hasFilter) ? Icons.filter : Icons.filter
          }
        />
      }
      onClick={useUI.$.withFocusGrid(useUI.$.data.toggleFilter)}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {useUI((ui) => ui.data.hasFilter) ? messages.dataMenu['Remove filter'] : messages.dataMenu['Create a filter']}
    </UI.MenuItem>
  )
}

// TODO: need to carefully design this feature
// function ProtectRange() {
//   return (
//     <UI.MenuItem
//       // TODO: need a different icon for "unlock range"
//       leadingIconSlot={<UI.Icon data={lock} />}
//       onClick={useUI.$.withFocusGrid(useUI.$.data.toggleProtectRange)}
//       disabled={useUI((ui) => ui.info.isReadonly)}
//     >
//       {useUI((ui) => ui.data.isProtectedRange) ? s('Unlock range') : s('Protect range')}
//     </UI.MenuItem>
//   )
// }

function DataValidation() {
  const messages = useSheetsMessages()

  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.tableCheck} />}
      onClick={useUI.$.data.validation.open}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.dataMenu['Data validation']}
    </UI.MenuItem>
  )
}

function columnString(messages: SheetsMessages, columnLetter: string) {
  return messages.dataMenu['column ${columnLetter}'](columnLetter)
}

export const dataMenuMessages = {
  dataMenu: {
    'Sort sheet': `Sort sheet`,
    'Sort sheet by': `Sort sheet by`,
    '(A to Z)': `(A to Z)`,
    '(Z to A)': `(Z to A)`,
    'Create a filter': `Create a filter`,
    'Remove filter': `Remove filter`,
    'Protect range': `Protect range`,
    'Unlock range': `Unlock range`,
    'Data validation': `Data validation`,
    'column ${columnLetter}': (columnLetter: string) => `column ${columnLetter}`,
  },
}
