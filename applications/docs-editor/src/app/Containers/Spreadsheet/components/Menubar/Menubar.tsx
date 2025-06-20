import clsx from '@proton/utils/clsx'
import type { ProtonSheetsUIState } from '../../ui-state'
import * as Ariakit from '@ariakit/react'
import { useStringifier } from '../../stringifier'
import { c } from 'ttag'
import { MenubarItem } from './MenubarItem'
import { FileMenu } from './menus/FileMenu'
import { InsertMenu } from './menus/InsertMenu'

export interface MenubarProps extends Ariakit.MenubarProps {
  ui: ProtonSheetsUIState
}

export function Menubar({ ui, ...props }: MenubarProps) {
  const s = useStrings()
  return (
    <div className="px-5">
      <Ariakit.Menubar {...props} className={clsx('flex gap-5', props.className)}>
        <FileMenu ui={ui} renderMenuButton={<MenubarItem>{s('File')}</MenubarItem>} />
        {/* TODO: edit menu */}
        {/* TODO: view menu */}
        <InsertMenu ui={ui} renderMenuButton={<MenubarItem>{s('Insert')}</MenubarItem>} />
        {/* TODO: format menu */}
        {/* TODO: data menu */}
      </Ariakit.Menubar>
    </div>
  )
}

function useStrings() {
  return useStringifier(() => ({
    File: c('sheets_2025:Spreadsheet editor menubar title').t`File`,
    Insert: c('sheets_2025:Spreadsheet editor menubar title').t`Insert`,
  }))
}
