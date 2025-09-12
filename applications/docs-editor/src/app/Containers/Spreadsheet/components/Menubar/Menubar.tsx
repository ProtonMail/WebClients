import clsx from '@proton/utils/clsx'
import * as Ariakit from '@ariakit/react'
import { createStringifier } from '../../stringifier'
import { c } from 'ttag'
import { MenubarItem } from './MenubarItem'
import { FileMenu } from './menus/FileMenu'
import { InsertMenu } from './menus/InsertMenu'
import { EditMenu } from './menus/EditMenu'
import { ViewMenu } from './menus/ViewMenu'
import { FormatMenu } from './menus/FormatMenu'
import { DataMenu } from './menus/DataMenu'
import { createComponent } from '../utils'

const { s } = createStringifier(strings)

export interface MenubarProps extends Ariakit.MenubarProps {}

export const Menubar = createComponent(function Menubar(props: MenubarProps) {
  return (
    <div className="px-5">
      <Ariakit.Menubar {...props} className={clsx('flex gap-5', props.className)}>
        <FileMenu renderMenuButton={<MenubarItem>{s('File')}</MenubarItem>} />
        <EditMenu renderMenuButton={<MenubarItem>{s('Edit')}</MenubarItem>} />
        <ViewMenu renderMenuButton={<MenubarItem>{s('View')}</MenubarItem>} />
        <InsertMenu renderMenuButton={<MenubarItem>{s('Insert')}</MenubarItem>} />
        <FormatMenu renderMenuButton={<MenubarItem>{s('Format')}</MenubarItem>} />
        <DataMenu renderMenuButton={<MenubarItem>{s('Data')}</MenubarItem>} />
        {/* TODO: format menu */}
        {/* TODO: data menu */}
      </Ariakit.Menubar>
    </div>
  )
})

function strings() {
  return {
    File: c('sheets_2025:Spreadsheet editor menubar title').t`File`,
    Edit: c('sheets_2025:Spreadsheet editor menubar title').t`Edit`,
    View: c('sheets_2025:Spreadsheet editor menubar title').t`View`,
    Insert: c('sheets_2025:Spreadsheet editor menubar title').t`Insert`,
    Format: c('sheets_2025:Spreadsheet editor menubar title').t`Format`,
    Data: c('sheets_2025:Spreadsheet editor menubar title').t`Data`,
  }
}
