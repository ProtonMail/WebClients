import { useSheetsMessages } from '../../SheetsDependenciesProvider'

import { useUI } from '../../ui-store'
import * as UI from '../ui'

export function MergeMenuItems() {
  const messages = useSheetsMessages()

  return (
    <>
      <UI.MenuItem
        disabled={useUI((ui) => !ui.format.merge.can.all || ui.info.isReadonly)}
        onClick={useUI.$.withFocusGrid(useUI.$.format.merge.all)}
      >
        {messages.mergeMenuItems['Merge all']}
      </UI.MenuItem>
      <UI.MenuItem
        disabled={useUI((ui) => !ui.format.merge.can.vertically || ui.info.isReadonly)}
        onClick={useUI.$.withFocusGrid(useUI.$.format.merge.vertically)}
      >
        {messages.mergeMenuItems['Merge vertically']}
      </UI.MenuItem>
      <UI.MenuItem
        disabled={useUI((ui) => !ui.format.merge.can.horizontally || ui.info.isReadonly)}
        onClick={useUI.$.withFocusGrid(useUI.$.format.merge.horizontally)}
      >
        {messages.mergeMenuItems['Merge horizontally']}
      </UI.MenuItem>
      <UI.MenuItem
        disabled={useUI((ui) => !ui.format.merge.can.unmerge || ui.info.isReadonly)}
        onClick={useUI.$.withFocusGrid(useUI.$.format.merge.unmerge)}
      >
        {messages.mergeMenuItems.Unmerge}
      </UI.MenuItem>
    </>
  )
}

export const mergeMenuItemsMessages = {
  mergeMenuItems: {
    'Merge all': `Merge all`,
    'Merge vertically': `Merge vertically`,
    'Merge horizontally': `Merge horizontally`,
    Unmerge: `Unmerge`,
  },
}
