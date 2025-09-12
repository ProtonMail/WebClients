import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'
import { c } from 'ttag'
import { createStringifier } from '../../../stringifier'
import * as UI from '../../ui'
import * as Icons from '../../icons'

const { s } = createStringifier(strings)

export interface DataMenuProps extends Ariakit.MenuProviderProps {
  renderMenuButton: ReactElement
}

export function DataMenu({ renderMenuButton, ...props }: DataMenuProps) {
  return (
    <Ariakit.MenuProvider {...props}>
      <Ariakit.MenuButton render={renderMenuButton} />
      <UI.Menu>
        {/* TODO: basically all actions */}
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.notepadChecklist} />}>
            {s('Sort sheet')}
          </UI.SubMenuButton>
          <UI.SubMenu>{/* TODO: waiting for design */}</UI.SubMenu>
        </Ariakit.MenuProvider>
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="broom" />}>{s('Create a filter')}</UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="lock" />}>{s('Protect range')}</UI.MenuItem>
        <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.tableCheck} />}>{s('Data validation')}</UI.MenuItem>
      </UI.Menu>
    </Ariakit.MenuProvider>
  )
}

function strings() {
  return {
    'Sort sheet': c('sheets_2025:Spreadsheet editor menubar data menu').t`Sort sheet`,
    'Create a filter': c('sheets_2025:Spreadsheet editor menubar data menu').t`Create a filter`,
    'Protect range': c('sheets_2025:Spreadsheet editor menubar data menu').t`Protect range`,
    'Data validation': c('sheets_2025:Spreadsheet editor menubar data menu').t`Data validation`,
  }
}
