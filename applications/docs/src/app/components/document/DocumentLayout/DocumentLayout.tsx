import React from 'react'
import type { ReactNode } from 'react'

import { DrawerApp, PrivateAppContainer, PrivateMainArea, TopBanners } from '@proton/components'
import { APPS } from '@proton/shared/lib/constants'

import { DocumentHeader } from './DocumentHeader/DocumentHeader'
import { DocsQuickSettings } from '../../DocsQuickSettings'
import type { DocumentAction } from '@proton/drive-store'
import { useDocsContext } from '../context'

export type DocumentLayoutProps = {
  children: ReactNode
  action?: DocumentAction['mode']
}

export function DocumentLayout({ children, action }: DocumentLayoutProps) {
  const { privateContext: privateUser } = useDocsContext()

  return (
    <PrivateAppContainer
      top={privateUser ? <TopBanners app={APPS.PROTONDOCS} /> : null}
      header={<DocumentHeader action={action} />}
      sidebar={null}
      drawerApp={privateUser ? <DrawerApp customAppSettings={<DocsQuickSettings />} /> : null}
    >
      <PrivateMainArea hasToolbar>{children}</PrivateMainArea>
    </PrivateAppContainer>
  )
}
