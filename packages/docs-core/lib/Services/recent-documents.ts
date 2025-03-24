import { getErrorString, ServerTime } from '@proton/docs-shared'
import type { DriveCompat } from '@proton/drive-store'
import type { DocsApi } from './../Api/DocsApi'
import type { LoggerInterface } from '@proton/utils/logs'
import type { RecentDocumentAPIItem } from './../Api/Types/GetRecentsResponse'
import type { CacheService } from './CacheService'
import { nodeMetaUniqueId } from '@proton/drive-store/lib'
import { BasePropertiesState } from '@proton/docs-shared'

// store
// -----

export type RecentDocumentsServiceState = 'not_fetched' | 'fetching' | 'resolving' | 'done'

type StoreState = {
  state: RecentDocumentsServiceState
  recents: RecentDocumentsItem[]
}

class Store extends BasePropertiesState<StoreState> {}

const STORE_DEFAULT_VALUES: StoreState = {
  state: 'not_fetched',
  recents: [],
}

// service
// -------

export interface RecentDocumentsInterface {
  state: Store
  fetch(): Promise<void>
  trashDocument(recentDocument: RecentDocumentsItem): Promise<void>
  getSortedRecents(): RecentDocumentsItem[]
}

const RECENTS_LOCAL_STORAGE_KEY = 'recent-documents'

type LinkId = string

export class RecentDocumentsService implements RecentDocumentsInterface {
  state = new Store(STORE_DEFAULT_VALUES)
  snapshot: Map<LinkId, RecentDocumentsItem> = new Map()
  #driveCompat: DriveCompat
  #docsApi: DocsApi
  #cacheService: CacheService
  #logger: LoggerInterface

  constructor(driveCompat: DriveCompat, docsApi: DocsApi, cacheService: CacheService, logger: LoggerInterface) {
    this.#driveCompat = driveCompat
    this.#docsApi = docsApi
    this.#cacheService = cacheService
    this.#logger = logger
    this.loadCachedSnapshot().catch((error) => {
      this.#logger.error('Failed to load recent documents from cache', getErrorString(error))
    })
  }

  async cacheSnapshot() {
    this.#logger.info(`Caching recent document snapshot with ${this.snapshot.size} items`)

    const data: LocalStorageValue[] = Array.from(this.snapshot.values()).map((item) => item.serialize())
    const stringified = JSON.stringify(data)

    await this.#cacheService.cacheValue({
      document: undefined,
      key: RECENTS_LOCAL_STORAGE_KEY,
      value: stringified,
    })
  }

  async loadCachedSnapshot(): Promise<void> {
    this.#logger.info('Loading recent document snapshot')

    const result = await this.#cacheService.getCachedValue({
      document: undefined,
      key: RECENTS_LOCAL_STORAGE_KEY,
    })
    if (result.isFailed()) {
      this.#logger.error('Failed to decrypt recent document snapshot', { error: result.getError() })
      return undefined
    }

    const value = result.getValue()
    if (!value) {
      this.#logger.info('No recent document snapshot found, skipping load')
      return
    }

    const parsed: LocalStorageValue[] = JSON.parse(value)
    this.#logger.info(`Loaded recent document snapshot with ${parsed.length} items`)

    parsed.forEach((raw) => {
      const item = RecentDocumentsItem.deserialize(raw)
      this.setSnapshotItem(item)
    })
  }

  setSnapshotItem(item: RecentDocumentsItem): void {
    this.snapshot.set(item.uniqueId(), item)

    this.#sortRecents()
  }

  #sortRecents(): void {
    const sorted = Array.from(this.snapshot.values()).sort(
      (a, b) => b.lastViewed.date.getTime() - a.lastViewed.date.getTime(),
    )

    this.state.setProperty('recents', sorted)
  }

  getSortedRecents(): RecentDocumentsItem[] {
    return this.state.getProperty('recents')
  }

  async fetch() {
    this.state.setProperty('state', 'fetching')

    const response = await this.#docsApi.fetchRecentDocuments()
    if (response.isFailed()) {
      this.state.setProperty('state', 'not_fetched')
      return
    }

    this.state.setProperty('state', 'resolving')

    const recents = response.getValue().RecentDocuments

    await Promise.all(recents.map((item) => this.resolveItem(item)))

    void this.cacheSnapshot()

    this.state.setProperty('state', 'done')
  }

  async resolveItem(apiItem: RecentDocumentAPIItem): Promise<void> {
    const nodeIds = {
      linkId: apiItem.LinkID,
      shareId: apiItem.ContextShareID,
    }
    const lastViewed = new ServerTime(apiItem.LastOpenTime)

    try {
      const [node, nodePath, isNodeShared] = await Promise.all([
        this.#driveCompat.getNodes([nodeIds]).then((nodes) => nodes[0]),
        this.#driveCompat.getNodePaths([nodeIds]).then((paths) => paths[0]),
        this.#driveCompat.getNodesAreShared([nodeIds]).then((shared) => shared[0]),
      ])
      const dirPath = nodePath.slice(0, -1)

      let location: RecentDocumentsItemLocation
      if (isNodeShared) {
        location = { type: 'shared-with-me' }
      } else if (dirPath.length === 1 && dirPath.at(0)?.isRoot) {
        location = { type: 'root' }
      } else {
        location = { type: 'path', path: dirPath.map((pathItem) => pathItem.name) }
      }

      const record = RecentDocumentsItem.create({
        name: node.name,
        linkId: nodeIds.linkId,
        parentLinkId: node.parentNodeId,
        volumeId: node.volumeId,
        lastViewed,
        createdBy: node.signatureAddress,
        location,
        isSharedWithMe: isNodeShared,
        shareId: nodeIds.shareId,
      })

      this.setSnapshotItem(record)
    } catch (error) {
      this.#logger.error('Failed to resolve recent document', { error, item: apiItem })
    }
  }

  async trashDocument(recentDocument: RecentDocumentsItem): Promise<void> {
    this.state.setProperty('state', 'fetching')

    if (!recentDocument.parentLinkId) {
      throw new Error('Node does not have parent link ID')
    }

    await this.#driveCompat.trashDocument(
      { linkId: recentDocument.linkId, volumeId: recentDocument.volumeId },
      recentDocument.parentLinkId,
    )

    this.state.setProperty('state', 'done')
  }
}

// item
// ----

export type RecentDocumentsItemLocation =
  | { type: 'root' }
  | { type: 'path'; path: string[] }
  | { type: 'shared-with-me' }

export type RecentDocumentsItemValue = {
  name: string
  linkId: string
  parentLinkId: string | undefined
  volumeId: string
  lastViewed: ServerTime
  createdBy: string | undefined
  location: RecentDocumentsItemLocation
  isSharedWithMe: boolean
  shareId: string
}

export class RecentDocumentsItem implements RecentDocumentsItemValue {
  #value: RecentDocumentsItemValue
  name: string
  linkId: string
  parentLinkId: string | undefined
  volumeId: string
  lastViewed: ServerTime
  createdBy: string | undefined
  location: RecentDocumentsItemLocation
  isSharedWithMe: boolean
  shareId: string

  private constructor(value: RecentDocumentsItemValue) {
    this.#value = value
    this.name = value.name
    this.linkId = value.linkId
    this.parentLinkId = value.parentLinkId
    this.volumeId = value.volumeId
    this.lastViewed = value.lastViewed
    this.createdBy = value.createdBy
    this.location = value.location
    this.isSharedWithMe = value.isSharedWithMe
    this.shareId = value.shareId
  }

  static create(value: RecentDocumentsItemValue): RecentDocumentsItem {
    return new RecentDocumentsItem(value)
  }

  serialize(): LocalStorageValue {
    return {
      ...this.#value,
      lastViewed: this.lastViewed.date.getTime(),
    }
  }

  static deserialize(data: LocalStorageValue): RecentDocumentsItem {
    return new RecentDocumentsItem({
      ...data,
      lastViewed: new ServerTime(data.lastViewed as number),
    } as RecentDocumentsItemValue)
  }

  uniqueId(): string {
    return nodeMetaUniqueId({ linkId: this.linkId, volumeId: this.volumeId })
  }
}

// shared
// ------

type SerializableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SerializableValue[]
  | { [key: string]: SerializableValue }

type LocalStorageValue = {
  [key: string]: SerializableValue
}
