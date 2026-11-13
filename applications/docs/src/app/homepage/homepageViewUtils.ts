import { useCallback, useEffect, type ReactNode } from 'react'
import { useHistory } from 'react-router'
import { useLocation } from 'react-router-dom-v5-compat'

import type { RecentDocumentsItem } from './recentDocumentsItem'
import type { ProtonDocumentType } from './utils/mimetype'

import type { DriveEvent, ProtonDriveClient } from '@protontech/drive-sdk'

import type { ItemsSection, ItemsSectionId, RecentsSort } from './homepageViewContext'
import type {
  AcceptInvitation,
  DeclineInvitation,
  ExtendedInvitationDetails,
  ReloadInvitations,
} from './invitationTypes'
import { isMyDocument, type UserAddress } from './is-my-document'
import { getOwnerName, type OwnerContact } from './get-owner-name'
import type { Api } from './docsApi/api'
import type { Logger } from './utils/logger'
import type { GetAppHref } from './utils/apps'
import type { ErrorTracking } from './utils/errorTracking'
import type { FeatureFlags } from './utils/featureFlags'
import type { CreateNotification } from './utils/notifications'
import type { ReportTelemetry } from './utils/telemetry'

const ALLOWED_SORT_VALUES = [
  'viewed',
  // 'modified',
  'name',
  'owner',
  'location',
] as const satisfies readonly RecentsSort[]
const DEFAULT_RECENTS_SORT = 'viewed' satisfies RecentsSort
const ORDERED_SECTION_IDS = [
  'search-results',
  'name',
  'today',
  'yesterday',
  'previous7Days',
  'previous30Days',
  'earlier',
] as const satisfies readonly ItemsSectionId[]

export type SDKEventListener = (event: DriveEvent) => Promise<void>

export type EventSubscriber = {
  initialize: (
    rootScope: string,
    listeners: SDKEventListener[],
    handleRemoveDocument?: (nodeUid: string) => void,
  ) => Promise<void>
  reset: () => void
  subscribeToSharedDocument: (nodeUid: string, eventScope: string) => void
}

type CoreEventSubscriber = {
  addListener: (listener: () => void) => () => void
}

export type HomepageViewProviderProps = {
  children: ReactNode
  drive: ProtonDriveClient
  eventSubscriber: EventSubscriber
  coreEventSubscriber: CoreEventSubscriber
  /** The invitations to documents and sheets the user hasn't answered yet. It can still list the ones just accepted. */
  pendingInvitations: ExtendedInvitationDetails[]
  /** The invitations accepted from the homepage. They're hidden even while `pendingInvitations` still lists them. */
  recentlyAcceptedInvitations: ExtendedInvitationDetails[]
  acceptInvitation: AcceptInvitation
  declineInvitation: DeclineInvitation
  /**
   * Only the sidebar's reload button calls it. The host loads the invitations when the homepage opens and keeps them
   * current itself, so the homepage doesn't reload them when it shows the invitations table again.
   */
  reloadInvitations: ReloadInvitations
  api: Api
  logger: Logger
  reportTelemetry: ReportTelemetry
  createNotification: CreateNotification
  getAppHref: GetAppHref
  /** The code of the host's date locale, such as `en-US`; undefined formats dates in the browser's locale. */
  dateLocaleCode: string | undefined
  /** Keep it the same object across renders: the event subscription and the recents loading depend on it. */
  errorTracking: ErrorTracking
  /** Keep it the same object while the flags don't change: the context value depends on it. */
  featureFlags: FeatureFlags
  /** The user's addresses, undefined while they load. */
  addresses: UserAddress[] | undefined
  /** The user's contacts, undefined while they load. */
  contactEmails: OwnerContact[] | undefined
}

function useQueryState<T extends string | undefined>(name: string, defaultValue: T, allowedValues?: readonly T[]) {
  const isAllowed = useCallback(
    (value: string | null | undefined) => allowedValues?.includes(value as T) ?? true,
    [allowedValues],
  )
  const isDefault = useCallback((value: string | null | undefined) => value === defaultValue, [defaultValue])

  const history = useHistory()
  const location = useLocation()

  const params = new URLSearchParams(location.search)
  const paramValue = params.get(name) ?? undefined
  const hasParam = params.has(name)
  const resolvedValue = isAllowed(paramValue) ? (paramValue as T) : defaultValue

  const setParam = useCallback(
    (value: T, exclusive = false) => {
      const newParams = new URLSearchParams(exclusive ? undefined : location.search)
      if (isDefault(value) || value === undefined || value === '') {
        newParams.delete(name)
      } else {
        newParams.set(name, value)
      }
      history.replace({ search: newParams.toString() })
    },
    [history, isDefault, location.search, name],
  )
  const unsetParam = useCallback(() => setParam(undefined as T), [setParam])

  // If there's a param set, and the value is not allowed or it's the default
  // value, remove it from the URL.
  useEffect(() => {
    if (!isAllowed(paramValue) || isDefault(paramValue)) {
      unsetParam()
    }
  }, [hasParam, isAllowed, isDefault, unsetParam, paramValue])

  return [resolvedValue, setParam] as const
}

export function useRecentsSort() {
  return useQueryState<RecentsSort>('sort', DEFAULT_RECENTS_SORT, ALLOWED_SORT_VALUES)
}

export function useSearch() {
  return useQueryState<string | undefined>('q', undefined)
}

export function useType() {
  return useQueryState<ProtonDocumentType | undefined>('type', undefined)
}

export function filterDocuments(items?: RecentDocumentsItem[], search?: string, type?: ProtonDocumentType) {
  if (!items || items.length === 0) {
    return items || []
  }

  if (!search && !type) {
    return items
  }

  const outputItems = items.filter((data) => {
    let isValid = true
    if (search) {
      isValid = data.name.toLowerCase().includes(search.toLowerCase())
      if (!isValid) {
        return false
      }
    }
    if (type) {
      isValid = data.type === type
    }
    return isValid
  })
  return outputItems
}

function sortByMostRecent(a: RecentDocumentsItem, b: RecentDocumentsItem, property: 'lastViewed' | 'lastModified') {
  return b[property].date.getTime() - a[property].date.getTime()
}

function isAfter(date: Date, target: Date) {
  return date.getTime() >= target.getTime()
}

export function splitIntoSectionsByTime(
  items: RecentDocumentsItem[],
  property: 'lastViewed' | 'lastModified',
): ItemsSection[] {
  const sections: ItemsSection[] = []

  const TODAY = new Date()
  TODAY.setHours(0, 0, 0, 0)
  const YESTERDAY = new Date(TODAY)
  YESTERDAY.setDate(YESTERDAY.getDate() - 1)
  const PREVIOUS_7_DAYS = new Date(TODAY)
  PREVIOUS_7_DAYS.setDate(PREVIOUS_7_DAYS.getDate() - 7)
  const PREVIOUS_30_DAYS = new Date(TODAY)
  PREVIOUS_30_DAYS.setDate(PREVIOUS_30_DAYS.getDate() - 30)

  function sort(a: RecentDocumentsItem, b: RecentDocumentsItem) {
    return sortByMostRecent(a, b, property)
  }

  const sectionMap: Partial<Record<ItemsSectionId, ItemsSection>> = {}
  function getSection(name: ItemsSectionId) {
    if (!sectionMap[name]) {
      sectionMap[name] = { id: name, items: [] }
    }
    return sectionMap[name]
  }

  for (const item of items.sort(sort)) {
    const itemDate = item[property].date
    if (isAfter(itemDate, TODAY)) {
      getSection('today').items.push(item)
    } else if (isAfter(itemDate, YESTERDAY)) {
      getSection('yesterday').items.push(item)
    } else if (isAfter(itemDate, PREVIOUS_7_DAYS)) {
      getSection('previous7Days').items.push(item)
    } else if (isAfter(itemDate, PREVIOUS_30_DAYS)) {
      getSection('previous30Days').items.push(item)
    } else {
      getSection('earlier').items.push(item)
    }
  }

  for (const sectionId of ORDERED_SECTION_IDS) {
    if (sectionMap[sectionId]) {
      sections.push(sectionMap[sectionId]!)
    }
  }

  return sections
}

export function splitIntoSectionsByName(
  items: RecentDocumentsItem[],
  { isSearchResults = false }: { isSearchResults?: boolean } = {},
): ItemsSection[] {
  return [
    { id: isSearchResults ? 'search-results' : 'name', items: items.sort((a, b) => a.name.localeCompare(b.name)) },
  ]
}

export function splitIntoSectionsByOwner(
  items: RecentDocumentsItem[],
  addresses: UserAddress[] | undefined,
  contactEmails: OwnerContact[] | undefined,
): ItemsSection[] {
  return [
    {
      id: 'name',
      items: [...items].sort((a, b) => {
        if (a.isSharedWithMe !== b.isSharedWithMe) {
          return !a.isSharedWithMe ? -1 : 1
        }
        const aName = getOwnerName(a, isMyDocument(a, addresses), contactEmails)
        const bName = getOwnerName(b, isMyDocument(b, addresses), contactEmails)
        if (aName && bName) {
          return aName.localeCompare(bName)
        }
        if (Boolean(aName) !== Boolean(bName)) {
          return Boolean(aName) ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      }),
    },
  ]
}

export function splitIntoSectionsByLocation(items: RecentDocumentsItem[]): ItemsSection[] {
  return [
    {
      id: 'name',
      items: [...items].sort((a, b) => {
        const aIsRoot = a.location.type === 'root'
        const bIsRoot = b.location.type === 'root'
        if (aIsRoot !== bIsRoot) {
          return aIsRoot ? -1 : 1
        }
        const aIsPath = a.location.type === 'path'
        const bIsPath = b.location.type === 'path'
        if (aIsPath !== bIsPath) {
          return aIsPath ? -1 : 1
        }
        if (aIsPath && bIsPath) {
          return a.location.path.join('/').localeCompare(b.location.path.join('/'))
        }
        return a.name.localeCompare(b.name)
      }),
    },
  ]
}
