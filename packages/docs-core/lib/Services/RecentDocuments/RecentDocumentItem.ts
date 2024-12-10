import { ServerTime } from '@proton/docs-shared'
import type { LocalStorageValue } from './types'
import { nodeMetaUniqueId } from '@proton/drive-store/lib'

export class RecentDocumentItem {
  constructor(
    public name: string,
    public linkId: string,
    public parentLinkId: string | undefined,
    public volumeId: string,
    public lastViewed: ServerTime,
    public createdBy: string | undefined,
    public location: string[] | undefined,
    public isSharedWithMe: boolean | undefined,
    public shareId: string,
    public isOwnedByOthers: boolean,
    public nodePath: string[],
  ) {}

  static create(dto: {
    name: string
    linkId: string
    parentLinkId: string | undefined
    volumeId: string
    lastViewed: ServerTime
    createdBy: string | undefined
    location: string[] | undefined
    isSharedWithMe: boolean | undefined
    shareId: string
    isOwnedByOthers: boolean
    nodePath: string[]
  }): RecentDocumentItem {
    return new RecentDocumentItem(
      dto.name,
      dto.linkId,
      dto.parentLinkId,
      dto.volumeId,
      dto.lastViewed,
      dto.createdBy,
      dto.location,
      dto.isSharedWithMe,
      dto.shareId,
      dto.isOwnedByOthers,
      dto.nodePath,
    )
  }

  serialize(): LocalStorageValue {
    return {
      name: this.name,
      linkId: this.linkId,
      parentLinkId: this.parentLinkId,
      volumeId: this.volumeId,
      lastViewed: this.lastViewed.date.getTime(),
      createdBy: this.createdBy,
      location: this.location,
      isSharedWithMe: this.isSharedWithMe,
      shareId: this.shareId,
      isOwnedByOthers: this.isOwnedByOthers,
      nodePath: this.nodePath,
    }
  }

  static deserialize(data: LocalStorageValue): RecentDocumentItem {
    const lastViewed = new ServerTime(data.lastViewed as number)

    return new RecentDocumentItem(
      data.name as string,
      data.linkId as string,
      data.parentLinkId as string | undefined,
      data.volumeId as string,
      lastViewed,
      data.createdBy as string | undefined,
      data.location as string[] | undefined,
      data.isSharedWithMe as boolean | undefined,
      data.shareId as string,
      data.isOwnedByOthers as boolean,
      data.nodePath as string[],
    )
  }

  uniqueId(): string {
    return nodeMetaUniqueId({ linkId: this.linkId, volumeId: this.volumeId })
  }
}
