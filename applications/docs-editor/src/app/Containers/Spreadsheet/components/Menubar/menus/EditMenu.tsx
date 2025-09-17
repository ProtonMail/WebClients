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
        <Cut />
        <Copy />
        <Paste />
        <PasteSpecialSubmenu />
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
      disabled={useUI((ui) => ui.history.undoDisabled)}
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
      disabled={useUI((ui) => ui.history.redoDisabled)}
    >
      {s('Redo')}
    </UI.MenuItem>
  )
}

function Cut() {
  // TODO: need RnC to provide useCopyPasteCut
  return <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.scissors} />}>{s('Cut')} (unimplemented)</UI.MenuItem>
}

function Copy() {
  // TODO: need RnC to provide useCopyPasteCut
  return <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="squares" />}>{s('Copy')} (unimplemented)</UI.MenuItem>
}

function Paste() {
  // TODO: need RnC to provide useCopyPasteCut
  return (
    <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.notepadChecklist} />}>{s('Paste')} (unimplemented)</UI.MenuItem>
  )
}

function PasteSpecialSubmenu() {
  // TODO: need RnC to provide useCopyPasteCut
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.notepadChecklist} />}>
        {s('Paste special')}
      </UI.SubMenuButton>
      <UI.SubMenu unmountOnHide>
        {/* TODO: platform-aware shortcut hints */}
        <UI.MenuItem hintSlot="⌘+Shift+V">{s('Values only')} (unimplemented)</UI.MenuItem>
        <UI.MenuItem hintSlot="⌘+Option+V">{s('Formatting only')} (unimplemented)</UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem>{s('Transposed')} (unimplemented)</UI.MenuItem>
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
    Transposed: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Transposed`,
    Find: c('sheets_2025:Spreadsheet editor menubar edit menu').t`Find`,
  }
}
