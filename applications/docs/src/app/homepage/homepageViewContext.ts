import { createContext, useContext } from 'react'

import type { RecentDocumentsItem } from './recentDocumentsItem'
import type { ExtendedInvitationDetails } from './invitationTypes'
import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'

import type { Logger } from './utils/logger'
import type { CreateNotification } from './utils/notifications'
import type { ReportTelemetry } from './utils/telemetry'

export type RecentsSort = 'viewed' | 'name' | 'owner' | 'location'
export type ItemsSectionId =
  'search-results' | 'name' | 'today' | 'yesterday' | 'previous7Days' | 'previous30Days' | 'earlier'
export type ItemsSection = { id: ItemsSectionId; items: RecentDocumentsItem[] }

export type HomepageViewState =
  | { view: 'unknown' }
  // Search.
  | { view: 'search-initial'; query: string }
  | { view: 'search-loading'; query: string }
  | { view: 'search-empty'; query: string }
  | { view: 'search'; itemSections: ItemsSection[]; query: string }
  // Recents.
  | { view: 'recents-initial' }
  | { view: 'recents-loading' }
  | { view: 'recents-empty' }
  | { view: 'recents'; itemSections: ItemsSection[]; sort: RecentsSort }
  // Trash.
  | { view: 'trash-empty' }
  | { view: 'trash-loading' }
  | { view: 'trash'; itemSections: ItemsSection[] }

export type DocInvitesHook = () => {
  invitations: ExtendedInvitationDetails[]
  recentlyAcceptedInvites: ExtendedInvitationDetails[]
  acceptInvite: (invitation: ExtendedInvitationDetails) => Promise<unknown>
  rejectInvite: (invitation: ExtendedInvitationDetails) => Promise<void>
  confirmModal: JSX.Element | null
}

export type HomepageViewValue = {
  state: HomepageViewState
  setRecentsSort: (value: RecentsSort) => void
  setSearch: (value: string | undefined, exclusive?: boolean) => void
  updateRecentDocuments: () => Promise<void>
  updateRenamedDocumentInCache: (uniqueId: string, name: string) => Promise<void>
  isRecentsUpdating: boolean
  type: ProtonDocumentType | undefined
  /** Known once the My files folder has loaded. */
  myFilesRootUid?: string
  /** Only with recents loaded through the Drive SDK. */
  updateMovedDocuments?: (nodeUids: string[]) => Promise<void>
  /**
   * Hooks can't be swapped in place, `InvitesTable` remounts when the invitations flag changes.
   */
  useDocInvites: DocInvitesHook
  reportTelemetry: ReportTelemetry
  logger: Logger
  createNotification: CreateNotification
}

export const HomepageViewContext = createContext<HomepageViewValue | undefined>(undefined)

export function useHomepageView() {
  const value = useContext(HomepageViewContext)
  if (!value) {
    throw new Error('Missing HomepageViewProvider')
  }
  return value
}
