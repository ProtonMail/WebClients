import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'
import { c } from 'ttag'
import { createStringifier } from '../../../stringifier'
import * as UI from '../../ui'
import * as Icons from '../../icons'

const { s } = createStringifier(strings)

export interface EditMenuProps extends Ariakit.MenuProviderProps {
  renderMenuButton: ReactElement
}

export function EditMenu({ renderMenuButton, ...props }: EditMenuProps) {
  return (
    <Ariakit.MenuProvider {...props}>
      <Ariakit.MenuButton render={renderMenuButton} />
      <UI.Menu>
        {/* TODO: basically all actions */}
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="arrow-up-and-left" />}>{s('Undo')}</UI.MenuItem>
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="arrow-up-and-left" className="scale-x-[-1]" />}>
          {s('Redo')}
        </UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.scissors} />}>{s('Cut')}</UI.MenuItem>
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="squares" />}>{s('Copy')}</UI.MenuItem>
        <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.notepadChecklist} />}>{s('Paste')}</UI.MenuItem>
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.notepadChecklist} />}>
            {s('Paste special')}
          </UI.SubMenuButton>
          <UI.SubMenu>
            <UI.MenuItem>{s('Values only')}</UI.MenuItem>
            <UI.MenuItem>{s('Formatting only')}</UI.MenuItem>
            <UI.MenuSeparator />
            <UI.MenuItem>{s('Transposed')}</UI.MenuItem>
          </UI.SubMenu>
        </Ariakit.MenuProvider>
        <UI.MenuSeparator />
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="magnifier" />}>{s('Find')}</UI.MenuItem>
      </UI.Menu>
    </Ariakit.MenuProvider>
  )
}

function strings() {
  return {
    Undo: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Undo`,
    Redo: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Redo`,
    Cut: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Cut`,
    Copy: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Copy`,
    Paste: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Paste`,
    'Paste special': c('sheets_2025:Spreadsheet editor menubar edit menu').t`Paste special`,
    'Values only': c('sheets_2025:Spreadsheet editor menubar edit menu').t`Values only`,
    'Formatting only': c('sheets_2025:Spreadsheet editor menubar edit menu').t`Formatting only`,
    Transposed: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Transposed`,
    Find: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Find`,
  }
}
