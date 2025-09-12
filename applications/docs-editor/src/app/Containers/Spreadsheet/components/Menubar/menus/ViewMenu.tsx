import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'
import { c } from 'ttag'
import { createStringifier } from '../../../stringifier'
import * as UI from '../../ui'
import * as Icons from '../../icons'

const { s } = createStringifier(strings)

export interface ViewMenuProps extends Ariakit.MenuProviderProps {
  renderMenuButton: ReactElement
}

export function ViewMenu({ renderMenuButton, ...props }: ViewMenuProps) {
  return (
    <Ariakit.MenuProvider {...props}>
      <Ariakit.MenuButton render={renderMenuButton} />
      <UI.Menu>
        {/* TODO: basically all actions */}
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="eye" />}>{s('Show')}</UI.SubMenuButton>
          <UI.SubMenu>
            <UI.MenuItemCheckbox name="formula-bar">{s('Formula bar')}</UI.MenuItemCheckbox>
            <UI.MenuItemCheckbox name="guidelines">{s('Guidelines')}</UI.MenuItemCheckbox>
          </UI.SubMenu>
        </Ariakit.MenuProvider>
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.freezeTable} />}>{s('Freeze')}</UI.SubMenuButton>
          <UI.SubMenu>{/* TODO: waiting for design */}</UI.SubMenu>
        </Ariakit.MenuProvider>
        <UI.MenuSeparator />
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.zoomIn} />}>{s('Zoom')}</UI.SubMenuButton>
          <UI.SubMenu>{/* TODO: waiting for design */}</UI.SubMenu>
        </Ariakit.MenuProvider>
      </UI.Menu>
    </Ariakit.MenuProvider>
  )
}

function strings() {
  return {
    Show: c('sheets_2025:Spreadsheet editor menubar view menu').t`Show`,
    'Formula bar': c('sheets_2025:Spreadsheet editor menubar view menu').t`Formula bar`,
    Guidelines: c('sheets_2025:Spreadsheet editor menubar view menu').t`Guidelines`,
    Freeze: c('sheets_2025:Spreadsheet editor menubar view menu').t`Freeze`,
    Zoom: c('sheets_2025:Spreadsheet editor menubar view menu').t`Zoom`,
  }
}
