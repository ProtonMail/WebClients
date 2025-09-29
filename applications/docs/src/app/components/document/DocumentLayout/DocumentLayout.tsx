import React from 'react'
import type { ReactNode } from 'react'

import { DrawerApp, PrivateAppContainer, PrivateMainArea, TopBanners } from '@proton/components'
import { APPS } from '@proton/shared/lib/constants'

import { DocumentHeader } from './DocumentHeader/DocumentHeader'
import { DocsQuickSettings } from '../../DocsQuickSettings'
import type { DocumentAction } from '@proton/drive-store'
import { useDocsContext } from '../context'
import type { DocumentType } from '@proton/drive-store/store/_documents'
import { DebugModeProvider } from '~/utils/debug-mode-context'

export type DocumentLayoutProps = {
  children: ReactNode
  documentType: DocumentType
  actionMode?: DocumentAction['mode']
}

export function DocumentLayout({ children, documentType, actionMode }: DocumentLayoutProps) {
  const { privateContext: privateUser } = useDocsContext()

  return (
    <DebugModeProvider>
      <PrivateAppContainer
        top={privateUser ? <TopBanners app={APPS.PROTONDOCS} /> : null}
        header={<DocumentHeader actionMode={actionMode} documentType={documentType} />}
        sidebar={null}
        drawerApp={privateUser ? <DrawerApp customAppSettings={<DocsQuickSettings />} /> : null}
      >
        <PrivateMainArea hasToolbar>{children}</PrivateMainArea>
      </PrivateAppContainer>
    </DebugModeProvider>
  )
}
