import { ReactNode } from 'react'

import { DrawerApp, PrivateAppContainer, PrivateMainArea, TopBanners } from '@proton/components'
import { APPS } from '@proton/shared/lib/constants'

import DocsHeader from '../DocsHeader/DocsHeader'
import DocsQuickSettings from './DocsQuickSettings'

interface Props {
  children: ReactNode
}

export const DocsLayout = ({ children }: Props) => {
  return (
    <PrivateAppContainer
      top={<TopBanners app={APPS.PROTONDOCS} />}
      header={<DocsHeader />}
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
