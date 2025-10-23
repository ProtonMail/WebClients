import { createStringifier } from '../../stringifier'
import { useUI } from '../../ui-store'
import * as UI from '../ui'
import { c } from 'ttag'

const { s } = createStringifier(strings)

export function MergeMenuItems() {
  return (
    <>
      <UI.MenuItem
        disabled={useUI((ui) => !ui.format.merge.can.all || ui.info.isReadonly)}
        onClick={useUI.$.withFocusGrid(useUI.$.format.merge.all)}
      >
        {s('Merge all')}
      </UI.MenuItem>
      <UI.MenuItem
        disabled={useUI((ui) => !ui.format.merge.can.vertically || ui.info.isReadonly)}
        onClick={useUI.$.withFocusGrid(useUI.$.format.merge.vertically)}
      >
        {s('Merge vertically')}
      </UI.MenuItem>
      <UI.MenuItem
        disabled={useUI((ui) => !ui.format.merge.can.horizontally || ui.info.isReadonly)}
        onClick={useUI.$.withFocusGrid(useUI.$.format.merge.horizontally)}
      >
        {s('Merge horizontally')}
      </UI.MenuItem>
      <UI.MenuItem
        disabled={useUI((ui) => !ui.format.merge.can.unmerge || ui.info.isReadonly)}
        onClick={useUI.$.withFocusGrid(useUI.$.format.merge.unmerge)}
      >
        {s('Unmerge')}
      </UI.MenuItem>
    </>
  )
}

function strings() {
  return {
    'Merge all': c('sheets_2025:Spreadsheet editor cell merge options').t`Merge all`,
    'Merge vertically': c('sheets_2025:Spreadsheet editor cell merge options').t`Merge vertically`,
    'Merge horizontally': c('sheets_2025:Spreadsheet editor cell merge options').t`Merge horizontally`,
    Unmerge: c('sheets_2025:Spreadsheet editor cell merge options').t`Unmerge`,
  }
}
