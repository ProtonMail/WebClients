import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'
import { c } from 'ttag'
import { createStringifier } from '../../../stringifier'
import * as UI from '../../ui'
import * as Icons from '../../icons'
import { useUI } from '../../../ui-store'

const { s } = createStringifier(strings)

export interface EditMenuProps extends Ariakit.MenuProviderProps {
  renderMenuButton: ReactElement
}

export function EditMenu({ renderMenuButton, ...props }: EditMenuProps) {
  return (
    <Ariakit.MenuProvider {...props}>
      <Ariakit.MenuButton render={renderMenuButton} />
      <UI.Menu unmountOnHide>
        <Undo />
        <Redo />
        <UI.MenuSeparator />
        {/* TODO: re-enable once fixed */}
        {/* <Cut /> */}
        <Copy />
        <Paste />
        {/* <PasteSpecialSubmenu /> */}
        <UI.MenuSeparator />
        <Find />
      </UI.Menu>
    </Ariakit.MenuProvider>
  )
}

function Undo() {
  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon legacyName="arrow-up-and-left" />}
      onClick={useUI.$.withFocusGrid(useUI.$.history.undo)}
      disabled={useUI((ui) => ui.history.undoDisabled || ui.info.isReadonly)}
    >
      {s('Undo')}
    </UI.MenuItem>
  )
}

function Redo() {
  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon legacyName="arrow-up-and-left" className="scale-x-[-1]" />}
      onClick={useUI.$.withFocusGrid(useUI.$.history.redo)}
      disabled={useUI((ui) => ui.history.redoDisabled || ui.info.isReadonly)}
    >
      {s('Redo')}
    </UI.MenuItem>
  )
}

// @ts-expect-error Temporarily disabled.
function Cut() {
  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.scissors} />}
      onClick={useUI.$.operation.cut}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {s('Cut')}
    </UI.MenuItem>
  )
}

function Copy() {
  return (
    <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="squares" />} onClick={useUI.$.operation.copy}>
      {s('Copy')}
    </UI.MenuItem>
  )
}

function Paste() {
  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.notepadChecklist} />}
      onClick={useUI.$.operation.paste.default}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {s('Paste')}
    </UI.MenuItem>
  )
}

// @ts-expect-error Temporarily disabled.
function PasteSpecialSubmenu() {
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={Icons.notepadChecklist} />}
        disabled={useUI((ui) => ui.info.isReadonly)}
      >
        {s('Paste special')}
      </UI.SubMenuButton>
      <UI.SubMenu unmountOnHide>
        {/* TODO: platform-aware shortcut hints */}
        <UI.MenuItem
          hintSlot="⌘+Shift+V"
          onClick={useUI.$.operation.paste.value}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Values only')}
        </UI.MenuItem>
        <UI.MenuItem
          hintSlot="⌘+Option+V"
          onClick={useUI.$.operation.paste.formatting}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {s('Formatting only')}
        </UI.MenuItem>
        <UI.MenuItem onClick={useUI.$.operation.paste.formula} disabled={useUI((ui) => ui.info.isReadonly)}>
          {s('Formula only')}
        </UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem onClick={useUI.$.operation.paste.transposed} disabled={useUI((ui) => ui.info.isReadonly)}>
          {s('Transposed')}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function Find() {
  return (
    <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="magnifier" />} onClick={useUI.$.search.open}>
      {s('Find')}
    </UI.MenuItem>
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
    'Formula only': c('sheets_2025:Spreadsheet editor menubar edit menu').t`Formula only`,
    Transposed: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Transposed`,
    Find: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Find`,
  }
}
