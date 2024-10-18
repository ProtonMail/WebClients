import type { NodeMeta } from '@proton/drive-store/lib'
import type { PublicNodeMetaWithResolvedVolumeID } from '@proton/drive-store/lib/interface'

export interface DocumentMetaInterface {
  nodeMeta: NodeMeta | PublicNodeMetaWithResolvedVolumeID
  commitIds: string[]
  createTime: number
  modifyTime: number
  name: string

  copyWithNewValues(newValues: Partial<DocumentMetaInterface>): DocumentMetaInterface
  get uniqueIdentifier(): string
  latestCommitId(): string | undefined
}
