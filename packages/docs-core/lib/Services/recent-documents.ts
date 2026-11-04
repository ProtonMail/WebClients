import { nodeMetaUniqueId } from '@proton/docs-shared/NodeMetaHelpers'
import type { ServerTime } from '@proton/docs-shared/ServerTime'
import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import type { MemberRole } from '@proton/drive/sdk'

export type RecentDocumentsItemLocation =
  { type: 'root' } | { type: 'path'; path: string[] } | { type: 'shared-with-me' }

export type RecentDocumentsItemValue = {
  type: ProtonDocumentType
  name: string
  linkId: string
  parentLinkId: string | undefined
  volumeId: string
  lastViewed: ServerTime
  lastModified: ServerTime
  createdBy: string | undefined
  location: RecentDocumentsItemLocation
  isSharedWithMe: boolean
  shareId: string
  // In order from root to direct parent
  ancestorsNodeUids?: string[]
  effectiveRole?: MemberRole
}

export class RecentDocumentsItem implements RecentDocumentsItemValue {
  #value: RecentDocumentsItemValue

  get value(): RecentDocumentsItemValue {
    return this.#value
  }

  private constructor(value: RecentDocumentsItemValue) {
    this.#value = value
  }

  static create(value: RecentDocumentsItemValue): RecentDocumentsItem {
    return new RecentDocumentsItem(value)
  }

  uniqueId(): string {
    return nodeMetaUniqueId({ linkId: this.linkId, volumeId: this.volumeId })
  }

  get type() {
    return this.#value.type
  }
  get name() {
    return this.#value.name
  }
  get linkId() {
    return this.#value.linkId
  }
  get parentLinkId() {
    return this.#value.parentLinkId
  }
  get volumeId() {
    return this.#value.volumeId
  }
  get lastViewed() {
    return this.#value.lastViewed
  }
  get lastModified() {
    return this.#value.lastModified
  }
  get createdBy() {
    return this.#value.createdBy
  }
  get location() {
    return this.#value.location
  }
  get ancestorsNodeUids() {
    return this.#value.ancestorsNodeUids
  }
  get isSharedWithMe() {
    return this.#value.isSharedWithMe
  }
  get shareId() {
    return this.#value.shareId
  }
  get effectiveRole() {
    return this.#value.effectiveRole
  }
}
