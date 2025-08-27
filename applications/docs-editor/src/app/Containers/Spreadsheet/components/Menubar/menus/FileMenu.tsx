import * as Ariakit from '@ariakit/react'
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import type { ReactElement } from 'react'
import { c } from 'ttag'
import { useStringifier } from '../../../stringifier'
import type { ProtonSheetsUIState } from '../../../ui-state'
import * as UI from '../../ui'

export interface FileMenuProps extends Ariakit.MenuProviderProps {
  ui: ProtonSheetsUIState
  renderMenuButton: ReactElement
}

export function FileMenu({ ui, renderMenuButton, ...props }: FileMenuProps) {
  const s = useStrings()
  return (
    <Ariakit.MenuProvider {...props}>
      <Ariakit.MenuButton render={renderMenuButton} />
      <UI.Menu>
        {/* TODO: basically all actions */}
        {/* TODO: which icon do we want here? */}
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="file" />}>{s('New spreadsheet')}</UI.MenuItem>
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="file-arrow-in-up" />}>{s('Import')}</UI.MenuItem>
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="squares" />}>{s('Make a copy')}</UI.MenuItem>
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="arrows-cross" />}>{s('Move to folder')}</UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="clock-rotate-left" />}>
          {s('See version history')}
        </UI.MenuItem>
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="trash" />}>{s('Move to trash')}</UI.MenuItem>
        <UI.MenuSeparator />
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="printer" />}>{s('Print')}</UI.MenuItem>
        <Ariakit.MenuProvider>
          <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="arrow-down-to-square" />}>
            {s('Download')}
          </UI.SubMenuButton>
          <UI.SubMenu>
            <UI.MenuItem>{s('Microsoft Excel (.xlsx)')}</UI.MenuItem>
            <UI.MenuItem>{s('Comma Separated Values (.csv)')}</UI.MenuItem>
            <UI.MenuItem>{s('Tab Separated Values (.tsv)')}</UI.MenuItem>
          </UI.SubMenu>
        </Ariakit.MenuProvider>
        <UI.MenuSeparator />
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="info-circle" />}>{s('Help')}</UI.MenuItem>
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="brand-proton-sheets" />}>
          {s('View recent spreadsheets')}
        </UI.MenuItem>
        <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="brand-proton-drive" />}>
          {s('Open Proton Drive')}
        </UI.MenuItem>
        {/* TODO: add download logs option */}
      </UI.Menu>
    </Ariakit.MenuProvider>
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
