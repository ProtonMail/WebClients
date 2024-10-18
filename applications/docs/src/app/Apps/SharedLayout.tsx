import React from 'react'
import type { ReactNode } from 'react'

import { DrawerApp, PrivateAppContainer, PrivateMainArea, TopBanners } from '@proton/components'
import { APPS } from '@proton/shared/lib/constants'

import DocsHeader from '../Components/DocsHeader/DocsHeader'
import DocsQuickSettings from '../Components/layout/DocsQuickSettings'
import type { DocumentAction } from '@proton/drive-store'
import { useDocsContext } from '../Containers/ContextProvider'

interface Props {
  children: ReactNode
  action?: DocumentAction['mode']
}

export const SharedLayout = ({ children, action }: Props) => {
  const { privateContext: privateUser } = useDocsContext()

  return (
    <PrivateAppContainer
      top={privateUser ? <TopBanners app={APPS.PROTONDOCS} /> : null}
      header={<DocsHeader action={action} />}
      sidebar={null}
      drawerApp={privateUser ? <DrawerApp customAppSettings={<DocsQuickSettings />} /> : null}
    >
      <PrivateMainArea hasToolbar>{children}</PrivateMainArea>
    </PrivateAppContainer>
  )
}

export default SharedLayout
