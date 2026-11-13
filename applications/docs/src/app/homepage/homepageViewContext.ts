import { createContext, useContext } from 'react'

import type { RecentDocumentsItem } from './recentDocumentsItem'
import type {
  AcceptInvitation,
  DeclineInvitation,
  ExtendedInvitationDetails,
  ReloadInvitations,
} from './invitationTypes'
import type { ProtonDocumentType } from './utils/mimetype'

import type { Logger } from './utils/logger'
import type { CreateNotification } from './utils/notifications'
import type { ReportTelemetry } from './utils/telemetry'
import type { GetAppHref } from './utils/apps'
import type { DateFormatter } from './utils/dateFormatter'
import type { ErrorTracking } from './utils/errorTracking'
import type { FeatureFlags } from './utils/featureFlags'
import type { UserAddress } from './is-my-document'
import type { OwnerContact } from './get-owner-name'

export type RecentsSort = 'viewed' | 'name' | 'owner' | 'location'
export type ItemsSectionId =
  | 'search-results'
  | 'name'
  | 'today'
  | 'yesterday'
  | 'previous7Days'
  | 'previous30Days'
  | 'earlier'
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
  pendingInvitations: ExtendedInvitationDetails[]
  recentlyAcceptedInvitations: ExtendedInvitationDetails[]
  acceptInvitation: AcceptInvitation
  declineInvitation: DeclineInvitation
  reloadInvitations: ReloadInvitations
  reportTelemetry: ReportTelemetry
  logger: Logger
  createNotification: CreateNotification
  getAppHref: GetAppHref
  dateFormatter: DateFormatter
  errorTracking: ErrorTracking
  featureFlags: FeatureFlags
  addresses: UserAddress[] | undefined
  contactEmails: OwnerContact[] | undefined
}

export const HomepageViewContext = createContext<HomepageViewValue | undefined>(undefined)

export function useHomepageView() {
  const value = useContext(HomepageViewContext)
  if (!value) {
    throw new Error('Missing HomepageViewProvider')
  }
  return value
}
