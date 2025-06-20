import type { ReactElement } from 'react'
import { useStringifier } from '../../../stringifier'
import type { ProtonSheetsUIState } from '../../../ui-state'
import * as UI from '../../ui'
import { c } from 'ttag'
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants'

export interface FileMenuProps extends UI.MenuProviderProps {
  ui: ProtonSheetsUIState
  renderMenuButton: ReactElement
}

export function FileMenu({ ui, renderMenuButton, ...props }: FileMenuProps) {
  const s = useStrings()
  return (
    <UI.MenuProvider {...props}>
      <UI.MenuButton render={renderMenuButton} />
      <UI.Menu>
        {/* TODO: basically all actions */}
        {/* TODO: which icon do we want here? */}
        <UI.MenuItem icon="question-circle">{s('New spreadsheet')}</UI.MenuItem>
        <UI.MenuItem icon="file-arrow-in-up">{s('Import')}</UI.MenuItem>
        <UI.MenuItem icon="squares">{s('Make a copy')}</UI.MenuItem>
        <UI.MenuItem icon="arrows-cross">{s('Move to folder')}</UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem icon="clock-rotate-left">{s('See version history')}</UI.MenuItem>
        <UI.MenuItem icon="trash">{s('Move to trash')}</UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem icon="printer">{s('Print')}</UI.MenuItem>
        <UI.MenuProvider>
          <UI.MenuButton
            render={
              <UI.MenuItem isSubmenuTrigger icon="arrow-down-to-square">
                {s('Download')}
              </UI.MenuItem>
            }
          />
          <UI.Menu>
            <UI.MenuItem>{s('Microsoft Excel (.xlsx)')}</UI.MenuItem>
            <UI.MenuItem>{s('Comma Separated Values (.csv)')}</UI.MenuItem>
            <UI.MenuItem>{s('Tab Separated Values (.tsv)')}</UI.MenuItem>
          </UI.Menu>
        </UI.MenuProvider>
        <UI.MenuSeparator />
        <UI.MenuItem icon="info-circle">{s('Help')}</UI.MenuItem>
        <UI.MenuItem icon="brand-proton-sheets">{s('View recent spreadsheets')}</UI.MenuItem>
        <UI.MenuItem icon="brand-proton-drive">{s('Open Proton Drive')}</UI.MenuItem>
        {/* TODO: add download logs option */}
      </UI.Menu>
    </UI.MenuProvider>
  )
}

function useStrings() {
  return useStringifier(() => ({
    'New spreadsheet': c('sheets_2025:Spreadsheet editor menubar file menu').t`New spreadsheet`,
    Import: c('sheets_2025:Spreadsheet editor menubar file menu').t`Import`,
    'Make a copy': c('sheets_2025:Spreadsheet editor menubar file menu').t`Make a copy`,
    'Move to folder': c('sheets_2025:Spreadsheet editor menubar file menu').t`Move to folder`,
    'See version history': c('sheets_2025:Spreadsheet editor menubar file menu').t`See version history`,
    'Move to trash': c('sheets_2025:Spreadsheet editor menubar file menu').t`Move to trash`,
    Print: c('sheets_2025:Spreadsheet editor menubar file menu').t`Print`,
    Download: c('sheets_2025:Spreadsheet editor menubar file menu').t`Download`,
    'Microsoft Excel (.xlsx)': c('sheets_2025:Spreadsheet editor menubar file menu').t`Microsoft Excel (.xlsx)`,
    'Comma Separated Values (.csv)': c('sheets_2025:Spreadsheet editor menubar file menu')
      .t`Comma Separated Values (.csv)`,
    'Tab Separated Values (.tsv)': c('sheets_2025:Spreadsheet editor menubar file menu').t`Tab Separated Values (.tsv)`,
    Help: c('sheets_2025:Spreadsheet editor menubar file menu').t`Help`,
    'View recent spreadsheets': c('sheets_2025:Spreadsheet editor menubar file menu').t`View recent spreadsheets`,
    'Open Proton Drive': c('sheets_2025:Spreadsheet editor menubar file menu').t`Open ${DRIVE_APP_NAME}`,
    'Download logs': c('sheets_2025:Spreadsheet editor menubar file menu').t`Download logs`,
  }))
}
