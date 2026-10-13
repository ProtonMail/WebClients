import { useSheetsMessages } from '../../../SheetsDependenciesProvider'
import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'

import * as UI from '../../ui'
import * as Icons from '../../icons'
import { useUI } from '../../../ui-store'

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
        <PasteSpecialSubmenu />
        <UI.MenuSeparator />
        <Find />
      </UI.Menu>
    </Ariakit.MenuProvider>
  )
}

function Undo() {
  const messages = useSheetsMessages()

  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.arrowUpAndLeft} />}
      onClick={useUI.$.withFocusGrid(useUI.$.history.undo)}
      disabled={useUI((ui) => ui.history.undoDisabled || ui.info.isReadonly)}
    >
      {messages.editMenu.Undo}
    </UI.MenuItem>
  )
}

function Redo() {
  const messages = useSheetsMessages()

  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.arrowUpAndLeft} className="scale-x-[-1]" />}
      onClick={useUI.$.withFocusGrid(useUI.$.history.redo)}
      disabled={useUI((ui) => ui.history.redoDisabled || ui.info.isReadonly)}
    >
      {messages.editMenu.Redo}
    </UI.MenuItem>
  )
}

// @ts-expect-error Temporarily disabled.
function Cut() {
  const messages = useSheetsMessages()

  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.scissors} />}
      onClick={useUI.$.operation.cut}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.editMenu.Cut}
    </UI.MenuItem>
  )
}

function Copy() {
  const messages = useSheetsMessages()

  return (
    <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.squares} />} onClick={useUI.$.operation.copy}>
      {messages.editMenu.Copy}
    </UI.MenuItem>
  )
}

function Paste() {
  const messages = useSheetsMessages()

  return (
    <UI.MenuItem
      leadingIconSlot={<UI.Icon data={Icons.notepadChecklist} />}
      onClick={useUI.$.operation.paste.default}
      disabled={useUI((ui) => ui.info.isReadonly)}
    >
      {messages.editMenu.Paste}
    </UI.MenuItem>
  )
}

function PasteSpecialSubmenu() {
  const messages = useSheetsMessages()

  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={Icons.notepadChecklist} />}
        disabled={useUI((ui) => ui.info.isReadonly)}
      >
        {messages.editMenu['Paste special']}
      </UI.SubMenuButton>
      <UI.SubMenu unmountOnHide>
        {/* TODO: platform-aware shortcut hints */}
        <UI.MenuItem
          hintSlot="⌘+Shift+V"
          onClick={useUI.$.operation.paste.value}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.editMenu['Values only']}
        </UI.MenuItem>
        <UI.MenuItem
          hintSlot="⌘+Option+V"
          onClick={useUI.$.operation.paste.formatting}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.editMenu['Formatting only']}
        </UI.MenuItem>
        <UI.MenuItem onClick={useUI.$.operation.paste.formula} disabled={useUI((ui) => ui.info.isReadonly)}>
          {messages.editMenu['Formula only']}
        </UI.MenuItem>
        <UI.MenuItem onClick={useUI.$.operation.paste.link} disabled={useUI((ui) => ui.info.isReadonly)}>
          {messages.editMenu['Link only']}
        </UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem onClick={useUI.$.operation.paste.transposed} disabled={useUI((ui) => ui.info.isReadonly)}>
          {messages.editMenu.Transposed}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function Find() {
  const messages = useSheetsMessages()

  return (
    <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.magnifier} />} onClick={useUI.$.search.open}>
      {messages.editMenu.Find}
    </UI.MenuItem>
  )
}

export const editMenuMessages = {
  editMenu: {
    Undo: `Undo`,
    Redo: `Redo`,
    Cut: `Cut`,
    Copy: `Copy`,
    Paste: `Paste`,
    'Paste special': `Paste special`,
    'Values only': `Values only`,
    'Formatting only': `Formatting only`,
    'Formula only': `Formula only`,
    'Link only': `Link only`,
    Transposed: `Transposed`,
    Find: `Find`,
  },
}
