import { clsx } from 'clsx'
import * as Ariakit from '@ariakit/react'
import { useSheetsMessages } from '../../SheetsDependenciesProvider'
import { MenubarItem } from './MenubarItem'
import { FileMenu } from './menus/FileMenu'
import { InsertMenu } from './menus/InsertMenu'
import { EditMenu } from './menus/EditMenu'
import { ViewMenu } from './menus/ViewMenu'
import { FormatMenu } from './menus/FormatMenu'
import { DataMenu } from './menus/DataMenu'
import { createComponent } from '../utils'

export interface MenubarProps extends Ariakit.MenubarProps {
  isPublicMode: boolean
}

export const Menubar = createComponent(function Menubar({ isPublicMode, ...props }: MenubarProps) {
  const { menus } = useSheetsMessages()
  return (
    <Ariakit.Menubar {...props} className={clsx('flex gap-5 print:hidden', props.className)}>
      <FileMenu renderMenuButton={<MenubarItem>{menus.file}</MenubarItem>} isPublicMode={isPublicMode} />
      <EditMenu renderMenuButton={<MenubarItem>{menus.edit}</MenubarItem>} />
      <ViewMenu renderMenuButton={<MenubarItem>{menus.view}</MenubarItem>} />
      <InsertMenu renderMenuButton={<MenubarItem>{menus.insert}</MenubarItem>} />
      <FormatMenu renderMenuButton={<MenubarItem>{menus.format}</MenubarItem>} />
      <DataMenu renderMenuButton={<MenubarItem>{menus.data}</MenubarItem>} />
    </Ariakit.Menubar>
  )
})

export const menusMessages = {
  menus: { file: 'File', edit: 'Edit', view: 'View', insert: 'Insert', format: 'Format', data: 'Data' },
}
