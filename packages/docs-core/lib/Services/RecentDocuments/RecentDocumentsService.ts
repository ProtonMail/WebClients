import { RecentDocumentState, DefaultValues } from './RecentDocumentState'
import { ServerTime } from '@proton/docs-shared'
import type { DriveCompat } from '@proton/drive-store'
import type { DocsApi } from '../../Api/DocsApi'
import type { LoggerInterface } from '@proton/utils/logs'
import type { LocalStorageValue } from './types'
import { RecentDocumentItem } from './RecentDocumentItem'
import type { RecentDocumentsInterface } from './RecentDocumentsInterface'
import type { EncryptionService } from '../Encryption/EncryptionService'
import type { EncryptionContext } from '../Encryption/EncryptionContext'
import type { RecentDocumentAPIItem } from '../../Api/Types/GetRecentsResponse'

const RECENTS_LOCAL_STORAGE_KEY = 'recentDocumentsSnapshot'
function buildLocalStorageKey(userId: string) {
  return `${RECENTS_LOCAL_STORAGE_KEY}-${userId}`
}

type LinkId = string

export class RecentDocumentsService implements RecentDocumentsInterface {
  state = new RecentDocumentState(DefaultValues)
  cacheConfig?: Awaited<ReturnType<DriveCompat['getKeysForLocalStorageEncryption']>>
  snapshot: Map<LinkId, RecentDocumentItem> = new Map()

  constructor(
    private driveCompat: DriveCompat,
    private docsApi: DocsApi,
    private encryptionService: EncryptionService<EncryptionContext.LocalStorage>,
    private logger: LoggerInterface,
  ) {
    void this.loadCachedSnapshot()
  }

  private async loadAddressKey() {
    try {
      const result = await this.driveCompat.getKeysForLocalStorageEncryption()
      if (!result) {
        return undefined
      }

      this.cacheConfig = result
      return result
    } catch (error) {
      this.logger.error('Failed to load address key', { error })
    }

    return undefined
  }

  async cacheSnapshot() {
    if (!this.cacheConfig) {
      throw new Error('Attempting to cache snapshot with no address key')
    }

    this.logger.info(`Caching recent document snapshot with ${this.snapshot.size} items`)

    const data: LocalStorageValue[] = Array.from(this.snapshot.values()).map((item) => item.serialize())
    const stringified = JSON.stringify(data)
    const encrypted = await this.encryptionService.encryptDataForLocalStorage(
      stringified,
      this.cacheConfig.namespace,
      this.cacheConfig.encryptionKey,
    )

    if (encrypted.isFailed()) {
      this.logger.error('Failed to encrypt recent document snapshot', { error: encrypted.getError() })
      return
    }

    localStorage.setItem(buildLocalStorageKey(this.cacheConfig.namespace), encrypted.getValue())
  }

  async loadCachedSnapshot(): Promise<void> {
    this.logger.info('Loading recent document snapshot')

    const loadResult = await this.loadAddressKey()
    if (!loadResult) {
      this.logger.info('No address key found, skipping snapshot load')
      return undefined
    }

    const { encryptionKey, namespace } = loadResult

    const encrypted = localStorage.getItem(buildLocalStorageKey(namespace))
    if (!encrypted) {
      this.logger.info('No encrypted snapshot found, skipping load')
      return undefined
    }

    try {
      const decrypted = await this.encryptionService.decryptDataForLocalStorage(encrypted, namespace, encryptionKey)
      if (decrypted.isFailed()) {
        this.logger.error('Failed to decrypt recent document snapshot', { error: decrypted.getError() })
        return undefined
      }

      const parsed: LocalStorageValue[] = JSON.parse(decrypted.getValue())
      this.logger.info(`Loaded recent document snapshot with ${parsed.length} items`)

      parsed.forEach((raw) => {
        const item = RecentDocumentItem.deserialize(raw)
        this.setSnapshotItem(item)
      })
    } catch (error) {
      this.logger.error('Failed to decrypt recent document snapshot', { error })
    }
  }

  setSnapshotItem(item: RecentDocumentItem): void {
    this.snapshot.set(item.linkId, item)
    this.sortRecents()
  }

  private sortRecents(): void {
    const sorted = Array.from(this.snapshot.values()).sort(
      (a, b) => b.lastViewed.date.getTime() - a.lastViewed.date.getTime(),
    )

    this.state.setProperty('recents', sorted)
  }

  getSortedRecents(): RecentDocumentItem[] {
    return this.state.getProperty('recents')
  }

  async fetch() {
    this.state.setProperty('state', 'fetching')

    const response = await this.docsApi.fetchRecentDocuments()
    if (response.isFailed()) {
      this.state.setProperty('state', 'not_fetched')
      return
    }

    this.state.setProperty('state', 'resolving')

    await Promise.all(response.getValue().RecentDocuments.map((item) => this.resolveItem(item)))

    void this.cacheSnapshot()

    this.state.setProperty('state', 'done')
  }

  async resolveItem(apiItem: RecentDocumentAPIItem): Promise<void> {
    const subItem = {
      linkId: apiItem.LinkID,
      shareId: apiItem.ContextShareID,
      lastViewed: new ServerTime(apiItem.LastOpenTime),
    }

    try {
      const [node, nodePath, isNodeAtIndexOwnedByOthers] = await Promise.all([
        this.driveCompat.getNodes([subItem]).then((nodes) => nodes[0]),
        this.driveCompat.getNodePaths([subItem]).then((paths) => paths[0]),
        this.driveCompat.getNodesAreShared([subItem]).then((shared) => shared[0]),
      ])

      const nodePathAsStrings = nodePath.map((pathItem) => pathItem.name)

      const record = RecentDocumentItem.create({
        name: node.name,
        linkId: subItem.linkId,
        parentLinkId: node.parentNodeId,
        volumeId: node.volumeId,
        lastViewed: subItem.lastViewed,
        createdBy: node.signatureAddress,
        location: isNodeAtIndexOwnedByOthers ? ['Shared with me'] : nodePathAsStrings,
        isSharedWithMe: isNodeAtIndexOwnedByOthers,
        shareId: subItem.shareId,
        isOwnedByOthers: isNodeAtIndexOwnedByOthers,
        nodePath: nodePathAsStrings,
      })

      this.setSnapshotItem(record)
    } catch (error) {
      this.logger.error('Failed to resolve recent document', { error, item: apiItem })
    }
  }

  async trashDocument(recentDocument: RecentDocumentItem): Promise<void> {
    this.state.setProperty('state', 'fetching')

    if (!recentDocument.parentLinkId) {
      throw new Error('Node does not have parent link ID')
    }

    await this.driveCompat.trashDocument(
      { linkId: recentDocument.linkId, volumeId: recentDocument.volumeId },
      recentDocument.parentLinkId,
    )

    this.state.setProperty('state', 'done')
  }
}
