import type { SheetsMessages } from '../../../messages/SheetsMessages'
import { useSheetsMessages } from '../../../SheetsDependenciesProvider'
import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'

import * as UI from '../../ui'
import * as Icons from '../../icons'
import { ZOOM_DEFAULT, ZOOM_SUGGESTIONS } from '../../../constants'
import { scaleToPercentage } from '../../utils'
import { useUI } from '../../../ui-store'

export interface ViewMenuProps extends Ariakit.MenuProviderProps {
  renderMenuButton: ReactElement
}

export function ViewMenu({ renderMenuButton, ...props }: ViewMenuProps) {
  return (
    <Ariakit.MenuProvider {...props}>
      <Ariakit.MenuButton render={renderMenuButton} />
      <UI.Menu unmountOnHide>
        <ShowSubmenu />
        <FreezeSubmenu />
        <UI.MenuSeparator />
        <HiddenSheetsSubmenu />
        <UI.MenuSeparator />
        <ZoomSubmenu />
      </UI.Menu>
    </Ariakit.MenuProvider>
  )
}

function HiddenSheetsSubmenu() {
  const messages = useSheetsMessages()

  const hiddenSheets = useUI((ui) => ui.sheets.hidden)
  const showSheet = useUI.$.sheets.show
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.eyeSlash} />} disabled={hiddenSheets.length === 0}>
        {messages.viewMenu['Hidden sheets']} {hiddenSheets.length > 0 ? `(${hiddenSheets.length})` : ''}
      </UI.SubMenuButton>
      <UI.SubMenu unmountOnHide>
        {hiddenSheets.map((sheet) => (
          <UI.MenuItem key={sheet.sheetId} onClick={() => showSheet(sheet.sheetId)}>
            {messages.viewMenu.Show} <span className="font-bold">{sheet.title}</span>
          </UI.MenuItem>
        ))}
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

// TODO: this implementation, for some reason (probably an Ariakit bug), causes an infinite loop
// that blocks the main thread and causes the browser to become unresponsive.
// function ShowSubmenu() {
//   const showFormulaBar = useUI((ui) => ui.view.formulaBar.enabled)
//   const showGridlines = useUI((ui) => ui.view.gridLines.enabled)
//   const values = useMemo(() => {
//     const values = { view: [] as string[] }
//     if (showFormulaBar) {
//       values.view.push('formula-bar')
//     }
//     if (showGridlines) {
//       values.view.push('gridlines')
//     }
//     return values
//   }, [showFormulaBar, showGridlines])
//   return (
//     <Ariakit.MenuProvider values={values}>
//       <UI.SubMenuButton leadingIconSlot={<UI.Icon data={eye} />}>{s('Show')}</UI.SubMenuButton>
//       <UI.SubMenu unmountOnHide>
//         <UI.MenuItemCheckbox name="view" value="formula-bar">
//           {s('Formula bar')}
//         </UI.MenuItemCheckbox>
//         <UI.MenuItemCheckbox name="view" value="gridlines">
//           {s('Gridlines')}
//         </UI.MenuItemCheckbox>
//       </UI.SubMenu>
//     </Ariakit.MenuProvider>
//   )
// }

function ShowSubmenu() {
  const messages = useSheetsMessages()

  const showFormulaBar = useUI((ui) => ui.view.formulaBar.enabled)
  const showGridlines = useUI((ui) => ui.view.gridLines.enabled)
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.eye} />}>{messages.viewMenu.Show}</UI.SubMenuButton>
      <UI.SubMenu unmountOnHide>
        <UI.MenuItem
          leadingIndent
          selectedIndicator={showFormulaBar}
          onClick={useUI.$.withFocusGrid(useUI.$.view.formulaBar.toggle)}
        >
          {messages.viewMenu['Formula bar']}
        </UI.MenuItem>
        <UI.MenuItem
          leadingIndent
          selectedIndicator={showGridlines}
          onClick={useUI.$.withFocusGrid(useUI.$.view.gridLines.toggle)}
        >
          {messages.viewMenu.Gridlines}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function FreezeSubmenu() {
  const messages = useSheetsMessages()

  const freezeRows = useUI.$.view.freezeRows
  const freezeColumns = useUI.$.view.freezeColumns
  const activeRowIndex = useUI((ui) => ui.info.activeRowIndex)
  const activeColumnIndex = useUI((ui) => ui.info.activeColumnIndex)
  const activeColumnName = useUI((ui) => ui.info.activeColumnName)
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton
        leadingIconSlot={<UI.Icon data={Icons.freezeTable} />}
        disabled={useUI((ui) => ui.info.isReadonly)}
      >
        {messages.viewMenu.Freeze}
      </UI.SubMenuButton>
      <UI.SubMenu unmountOnHide>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(useUI.$.view.unfreezeRows)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.viewMenu['No rows']}
        </UI.MenuItem>
        <UI.MenuItem onClick={useUI.$.withFocusGrid(() => freezeRows(1))} disabled={useUI((ui) => ui.info.isReadonly)}>
          {messages.viewMenu['1 row']}
        </UI.MenuItem>
        <UI.MenuItem onClick={useUI.$.withFocusGrid(() => freezeRows(2))} disabled={useUI((ui) => ui.info.isReadonly)}>
          {messages.viewMenu['2 rows']}
        </UI.MenuItem>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(() => freezeRows(activeRowIndex))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.viewMenu['Up to']} <b>{rowString(messages, activeRowIndex)}</b>
        </UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(useUI.$.view.unfreezeColumns)}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.viewMenu['No columns']}
        </UI.MenuItem>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(() => freezeColumns(1))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.viewMenu['1 column']}
        </UI.MenuItem>
        <UI.MenuItem onClick={useUI.$.withFocusGrid(() => freezeColumns(2))}>
          {messages.viewMenu['2 columns']}
        </UI.MenuItem>
        <UI.MenuItem
          onClick={useUI.$.withFocusGrid(() => freezeColumns(activeColumnIndex))}
          disabled={useUI((ui) => ui.info.isReadonly)}
        >
          {messages.viewMenu['Up to']} <b>{columnString(messages, activeColumnName)}</b>
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function ZoomSubmenu() {
  const messages = useSheetsMessages()

  const zoomValue = useUI((ui) => ui.zoom.value) ?? ZOOM_DEFAULT
  const setZoom = useUI.$.zoom.set
  return (
    <Ariakit.MenuProvider values={{ zoom: zoomValue }}>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.zoomIn} />}>{messages.viewMenu.Zoom}</UI.SubMenuButton>
      <UI.SubMenu unmountOnHide>
        {ZOOM_SUGGESTIONS.map((scale) => (
          <UI.MenuItemRadio name="zoom" key={scale} value={scale} onClick={() => setZoom(scale)}>
            {scaleToPercentage(scale)}
          </UI.MenuItemRadio>
        ))}
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function columnString(messages: SheetsMessages, columnLetter: string) {
  return messages.viewMenu['column ${columnLetter}'](columnLetter)
}

function rowString(messages: SheetsMessages, rowNumber: number) {
  return messages.viewMenu['row ${rowNumber}'](rowNumber)
}

export const viewMenuMessages = {
  viewMenu: {
    Show: `Show`,
    'Formula bar': `Formula bar`,
    Gridlines: `Gridlines`,
    Freeze: `Freeze`,
    'Up to': `Up to`,
    Zoom: `Zoom`,
    'Hidden sheets': `Hidden sheets`,
    'column ${columnLetter}': (columnLetter: string) => `column ${columnLetter}`,
    'row ${rowNumber}': (rowNumber: number) => `row ${rowNumber}`,

    'No rows': 'No rows',
    '1 row': '1 row',
    '2 rows': '2 rows',
    'No columns': 'No columns',
    '1 column': '1 column',
    '2 columns': '2 columns',
  },
}
