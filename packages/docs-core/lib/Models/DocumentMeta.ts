import type { DocumentMetaInterface } from '@proton/docs-shared'
import type { NodeMeta } from '@proton/drive-store/lib'
import type { PublicNodeMetaWithResolvedVolumeID } from '@proton/drive-store/lib/interface'
import { isPublicNodeMeta } from '@proton/drive-store/lib/interface'

export class DocumentMeta implements DocumentMetaInterface {
  constructor(
    public nodeMeta: NodeMeta | PublicNodeMetaWithResolvedVolumeID,
    public commitIds: string[],
    public createTime: number,
    public modifyTime: number,
    public name: string,
  ) {}

  public isEqual(other: DocumentMeta): boolean {
    if (isPublicNodeMeta(this.nodeMeta) !== isPublicNodeMeta(other.nodeMeta)) {
      return false
    }

    if (isPublicNodeMeta(this.nodeMeta) && isPublicNodeMeta(other.nodeMeta)) {
      return this.nodeMeta.linkId === other.nodeMeta.linkId && this.nodeMeta.token === other.nodeMeta.token
    } else if (!isPublicNodeMeta(this.nodeMeta) && !isPublicNodeMeta(other.nodeMeta)) {
      return this.nodeMeta.volumeId === other.nodeMeta.volumeId && this.nodeMeta.linkId === other.nodeMeta.linkId
    }

    return false
  }

  copyWithNewValues(newValues: Partial<DocumentMetaInterface>): DocumentMetaInterface {
    return new DocumentMeta(
      newValues.nodeMeta ?? this.nodeMeta,
      newValues.commitIds ?? this.commitIds,
      newValues.createTime ?? this.createTime,
      newValues.modifyTime ?? this.modifyTime,
      newValues.name ?? this.name,
    )
  }

  latestCommitId(): string | undefined {
    return this.commitIds[this.commitIds.length - 1]
  }

  public get uniqueIdentifier(): string {
    return this.nodeMeta.linkId
  }
}
