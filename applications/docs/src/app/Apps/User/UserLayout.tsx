import type { ReactNode } from 'react'

import { DrawerApp, PrivateAppContainer, PrivateMainArea, TopBanners } from '@proton/components'
import { APPS } from '@proton/shared/lib/constants'

import DocsHeader from '../../Components/DocsHeader/DocsHeader'
import DocsQuickSettings from '../../Components/layout/DocsQuickSettings'
import type { DocumentAction } from '@proton/drive-store'

interface Props {
  children: ReactNode
  action?: DocumentAction['mode']
}

export const UserLayout = ({ children, action }: Props) => {
  return (
    <PrivateAppContainer
      top={<TopBanners app={APPS.PROTONDOCS} />}
      header={<DocsHeader action={action} />}
      sidebar={null}
      drawerApp={<DrawerApp customAppSettings={<DocsQuickSettings />} />}
    >
      <PrivateMainArea hasToolbar>{children}</PrivateMainArea>
    </PrivateAppContainer>
  )
}

export default UserLayout
