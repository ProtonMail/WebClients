export interface DocumentMetaInterface {
  volumeId: string
  linkId: string
  commitIds: string[]
  createTime: number
  modifyTime: number
  name: string

  copyWithNewValues(newValues: Partial<DocumentMetaInterface>): DocumentMetaInterface
  get uniqueIdentifier(): string
}
