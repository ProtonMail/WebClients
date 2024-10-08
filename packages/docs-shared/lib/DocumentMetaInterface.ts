import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store/lib'

export interface DocumentMetaInterface {
  nodeMeta: NodeMeta | PublicNodeMeta
  commitIds: string[]
  createTime: number
  modifyTime: number
  name: string

  copyWithNewValues(newValues: Partial<DocumentMetaInterface>): DocumentMetaInterface
  get uniqueIdentifier(): string
  latestCommitId(): string | undefined
}
