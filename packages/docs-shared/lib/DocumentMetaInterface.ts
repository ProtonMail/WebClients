/** Represents the direct response object from the Docs API when retrieving the /meta endpoint */
export interface DocumentMetaInterface {
  commitIds: string[]
  createTime: number
  modifyTime: number
  volumeId: string

  copyWithNewValues(newValues: Partial<DocumentMetaInterface>): DocumentMetaInterface
  get uniqueIdentifier(): string
  latestCommitId(): string | undefined
}
