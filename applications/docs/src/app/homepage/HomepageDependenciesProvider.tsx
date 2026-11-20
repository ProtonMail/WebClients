import type { ReactNode } from 'react'

import { DocumentActionsProvider, type DocumentActionsProviderProps } from './DocumentActionsProvider'
import { HomepageViewProvider } from './HomepageViewProvider'
import type { HomepageViewProviderProps } from './homepageViewUtils'
import { HomepageMessagesProvider } from './messages/HomepageMessagesProvider'
import type { HomepageMessages } from './messages/defaultHomepageMessages'

/**
 * Everything the host supplies to the homepage. It is read field by field, so the object can be new on every render,
 * but each field keeps the stability its own comment asks for.
 */
export type HomepageDependencies = Omit<HomepageViewProviderProps, 'children'> &
  Omit<DocumentActionsProviderProps, 'children' | 'drive'> & {
    messages: HomepageMessages
  }

export type HomepageDependenciesProviderProps = {
  children: ReactNode
  dependencies: HomepageDependencies
}

export function HomepageDependenciesProvider({ children, dependencies }: HomepageDependenciesProviderProps) {
  const { messages, openShareModal, openMoveItemsModal, ...viewDependencies } = dependencies

  return (
    <HomepageMessagesProvider messages={messages}>
      <HomepageViewProvider {...viewDependencies}>
        <DocumentActionsProvider
          drive={viewDependencies.drive}
          openShareModal={openShareModal}
          openMoveItemsModal={openMoveItemsModal}
        >
          {children}
        </DocumentActionsProvider>
      </HomepageViewProvider>
    </HomepageMessagesProvider>
  )
}
