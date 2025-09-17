import * as Ariakit from '@ariakit/react'
import type { ReactElement } from 'react'
import { c } from 'ttag'
import { createStringifier } from '../../../stringifier'
import * as UI from '../../ui'
import * as Icons from '../../icons'
import { ZOOM_DEFAULT, ZOOM_SUGGESTIONS } from '../../../constants'
import { scaleToPercentage } from '../../utils'
import { useUI } from '../../../ui-store'

const { s } = createStringifier(strings)

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
        <ZoomSubmenu />
      </UI.Menu>
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
//       <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="eye" />}>{s('Show')}</UI.SubMenuButton>
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
  const showFormulaBar = useUI((ui) => ui.view.formulaBar.enabled)
  const showGridlines = useUI((ui) => ui.view.gridLines.enabled)
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="eye" />}>{s('Show')}</UI.SubMenuButton>
      <UI.SubMenu unmountOnHide>
        <UI.MenuItem
          leadingIndent
          selectedIndicator={showFormulaBar}
          onClick={useUI.$.withFocusGrid(useUI.$.view.formulaBar.toggle)}
        >
          {s('Formula bar')}
        </UI.MenuItem>
        <UI.MenuItem
          leadingIndent
          selectedIndicator={showGridlines}
          onClick={useUI.$.withFocusGrid(useUI.$.view.gridLines.toggle)}
        >
          {s('Gridlines')}
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function FreezeSubmenu() {
  const freezeRows = useUI.$.view.freezeRows
  const freezeColumns = useUI.$.view.freezeColumns
  const activeRowIndex = useUI((ui) => ui.info.activeRowIndex)
  const activeColumnIndex = useUI((ui) => ui.info.activeColumnIndex)
  const activeColumnName = useUI((ui) => ui.info.activeColumnName)
  return (
    <Ariakit.MenuProvider>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.freezeTable} />}>{s('Freeze')}</UI.SubMenuButton>
      <UI.SubMenu unmountOnHide>
        <UI.MenuItem onClick={useUI.$.withFocusGrid(useUI.$.view.unfreezeRows)}>No rows</UI.MenuItem>
        <UI.MenuItem onClick={useUI.$.withFocusGrid(() => freezeRows(1))}>1 row</UI.MenuItem>
        <UI.MenuItem onClick={useUI.$.withFocusGrid(() => freezeRows(2))}>2 rows</UI.MenuItem>
        <UI.MenuItem onClick={useUI.$.withFocusGrid(() => freezeRows(activeRowIndex))}>
          {s('Up to')} <b>{rowString(activeRowIndex)}</b>
        </UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem onClick={useUI.$.withFocusGrid(useUI.$.view.unfreezeColumns)}>No columns</UI.MenuItem>
        <UI.MenuItem onClick={useUI.$.withFocusGrid(() => freezeColumns(1))}>1 column</UI.MenuItem>
        <UI.MenuItem onClick={useUI.$.withFocusGrid(() => freezeColumns(2))}>2 columns</UI.MenuItem>
        <UI.MenuItem onClick={useUI.$.withFocusGrid(() => freezeColumns(activeColumnIndex))}>
          {s('Up to')} <b>{columnString(activeColumnName)}</b>
        </UI.MenuItem>
      </UI.SubMenu>
    </Ariakit.MenuProvider>
  )
}

function ZoomSubmenu() {
  const zoomValue = useUI((ui) => ui.zoom.value) ?? ZOOM_DEFAULT
  const setZoom = useUI.$.zoom.set
  return (
    <Ariakit.MenuProvider values={{ zoom: zoomValue }}>
      <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.zoomIn} />}>{s('Zoom')}</UI.SubMenuButton>
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

function columnString(columnLetter: string) {
  // translator: this is used in the context of two strings put together - (freeze) "Up to | column X" (the | symbol is used to show the separation between the two strings), and it's separate because "column X" needs to be bold, the order of these two strings cannot be changed and they will be separated by spaces
  return c('sheets_2025:Spreadsheet editor menubar view menu (freeze submenu)').t`column ${columnLetter}`
}

function rowString(rowNumber: number) {
  // translator: this is used in the context of two strings put together - (freeze) "Up to | row X" (the | symbol is used to show the separation between the two strings), and it's separate because "row X" needs to be bold, the order of these two strings cannot be changed and they will be separated by spaces
  return c('sheets_2025:Spreadsheet editor menubar view menu (freeze submenu)').t`row ${rowNumber}`
}

function strings() {
  return {
    Show: c('sheets_2025:Spreadsheet editor menubar view menu').t`Show`,
    'Formula bar': c('sheets_2025:Spreadsheet editor menubar view menu').t`Formula bar`,
    Gridlines: c('sheets_2025:Spreadsheet editor menubar view menu').t`Gridlines`,
    Freeze: c('sheets_2025:Spreadsheet editor menubar view menu').t`Freeze`,
    // translator: this is used in the context of two strings put together - (freeze) "Up to | row X" or (freeze) "up to | column X" (the | symbol is used to show the separation between the two strings), and it's separate because "row X" (or "column X") needs to be bold, the order of these two strings cannot be changed and they will be separated by spaces
    'Up to': c('sheets_2025:Spreadsheet editor menubar view menu (freeze submenu)').t`Up to`,
    Zoom: c('sheets_2025:Spreadsheet editor menubar view menu').t`Zoom`,
  }
}
