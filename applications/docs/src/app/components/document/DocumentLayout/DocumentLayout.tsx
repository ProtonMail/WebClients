import DrawerApp from '@proton/components/components/drawer/DrawerApp'
import PrivateAppContainer from '@proton/components/containers/app/PrivateAppContainer'
import PrivateMainArea from '@proton/components/containers/layout/PrivateMainArea'
import TopBanners from '@proton/components/containers/topBanners/TopBanners'
import React from 'react'
import type { ReactNode } from 'react'

import { APPS } from '@proton/shared/lib/constants'

import { DocumentHeader } from './DocumentHeader/DocumentHeader'
import { DocsQuickSettings } from '../../DocsQuickSettings'
import { useDocsContext } from '../context'
import type { DocumentAction, DocumentType } from '@proton/docs-shared'
import { DebugModeProvider } from '~/utils/debug-mode-context'
import { DocumentSizeLimitModal } from '../DocumentSizeLimitModal'

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
        <PrivateMainArea hasToolbar className="[&>div]:h-full">
          {children}
          <DocumentSizeLimitModal documentType={documentType} />
        </PrivateMainArea>
      </PrivateAppContainer>
    </DebugModeProvider>
  )
}
