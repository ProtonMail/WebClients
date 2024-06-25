import { ReactNode } from 'react'

import { DrawerApp, PrivateAppContainer, PrivateMainArea, TopBanners } from '@proton/components'
import { APPS } from '@proton/shared/lib/constants'

import DocsHeader from '../DocsHeader/DocsHeader'
import DocsQuickSettings from './DocsQuickSettings'
import { DocumentAction } from '@proton/drive-store'

interface Props {
  children: ReactNode
  action?: DocumentAction['mode']
}

export const DocsLayout = ({ children, action }: Props) => {
  return (
    <PrivateAppContainer
      top={<TopBanners app={APPS.PROTONDOCS} />}
      header={<DocsHeader action={action} />}
      sidebar={null}
      drawerApp={<DrawerApp customAppSettings={<DocsQuickSettings />} />}
    >
      <PrivateMainArea hasToolbar className="bg-[white] [&>div]:h-full">
        {children}
      </PrivateMainArea>
    </PrivateAppContainer>
  )
}

export default DocsLayout
