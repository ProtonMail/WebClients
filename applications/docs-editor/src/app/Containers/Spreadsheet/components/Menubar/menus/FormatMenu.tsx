import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'
import { c } from 'ttag'
import { createStringifier } from '../../../stringifier'
import * as UI from '../../ui'
import * as Icons from '../../icons'

const { s } = createStringifier(strings)

export interface FormatMenuProps extends Ariakit.MenuProviderProps {
  renderMenuButton: ReactElement
}

export function FormatMenu({ renderMenuButton, ...props }: FormatMenuProps) {
  return (
    <Ariakit.MenuProvider {...props}>
      <Ariakit.MenuButton render={renderMenuButton} />
      <UI.Menu>
        {/* TODO: basically all actions */}
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="palette" />}>{s('Theme')}</UI.SubMenuButton>
          <UI.SubMenu>{/* TODO: waiting for design */}</UI.SubMenu>
        </Ariakit.MenuProvider>
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.layoutGrid} />}>
            {s('Table formatting')}
          </UI.SubMenuButton>
          <UI.SubMenu>{/* TODO: waiting for design */}</UI.SubMenu>
        </Ariakit.MenuProvider>
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.brush} />}>{s('Cell styles')}</UI.SubMenuButton>
          <UI.SubMenu>{/* TODO: waiting for design */}</UI.SubMenu>
        </Ariakit.MenuProvider>
        <UI.MenuSeparator />
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.numbers} />}>{s('Number')}</UI.SubMenuButton>
          <UI.SubMenu>{/* TODO: waiting for design */}</UI.SubMenu>
        </Ariakit.MenuProvider>
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="text-bold" />}>{s('Text')}</UI.SubMenuButton>
          <UI.SubMenu>{/* TODO: waiting for design */}</UI.SubMenu>
        </Ariakit.MenuProvider>
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="text-align-left" />}>
            {s('Alignment')}
          </UI.SubMenuButton>
          <UI.SubMenu>{/* TODO: waiting for design */}</UI.SubMenu>
        </Ariakit.MenuProvider>
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.textWrap} />}>{s('Wrapping')}</UI.SubMenuButton>
          <UI.SubMenu>{/* TODO: waiting for design */}</UI.SubMenu>
        </Ariakit.MenuProvider>
        <UI.MenuSeparator />
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.fontSize} />}>{s('Font size')}</UI.SubMenuButton>
          <UI.SubMenu>{/* TODO: waiting for design */}</UI.SubMenu>
        </Ariakit.MenuProvider>
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.merge} />}>{s('Merge cells')}</UI.SubMenuButton>
          <UI.SubMenu>{/* TODO: waiting for design */}</UI.SubMenu>
        </Ariakit.MenuProvider>
        <UI.MenuSeparator />
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="broom" />}>{s('Conditional formatting')}</UI.MenuItem>
        <UI.MenuSeparator />
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="cross-big" />}>{s('Clear')}</UI.SubMenuButton>
          <UI.SubMenu>
            <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="eraser" />}>{s('Clear formatting')}</UI.MenuItem>
            <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="cross-big" />}>{s('Clear content')}</UI.MenuItem>
          </UI.SubMenu>
        </Ariakit.MenuProvider>
      </UI.Menu>
    </Ariakit.MenuProvider>
  )
}

function strings() {
  return {
    Theme: c('sheets_2025:Spreadsheet editor menubar format menu').t`Theme`,
    'Table formatting': c('sheets_2025:Spreadsheet editor menubar format menu').t`Table formatting`,
    'Cell styles': c('sheets_2025:Spreadsheet editor menubar format menu').t`Cell styles`,
    Number: c('sheets_2025:Spreadsheet editor menubar format menu').t`Number`,
    Text: c('sheets_2025:Spreadsheet editor menubar format menu').t`Text`,
    Alignment: c('sheets_2025:Spreadsheet editor menubar format menu').t`Alignment`,
    Wrapping: c('sheets_2025:Spreadsheet editor menubar format menu').t`Wrapping`,
    'Font size': c('sheets_2025:Spreadsheet editor menubar format menu').t`Font size`,
    'Merge cells': c('sheets_2025:Spreadsheet editor menubar format menu').t`Merge cells`,
    'Conditional formatting': c('sheets_2025:Spreadsheet editor menubar format menu').t`Conditional formatting`,
    Clear: c('sheets_2025:Spreadsheet editor menubar format menu').t`Clear`,
    'Clear formatting': c('sheets_2025:Spreadsheet editor menubar format menu').t`Clear formatting`,
    'Clear content': c('sheets_2025:Spreadsheet editor menubar format menu').t`Clear content`,
  }
}
