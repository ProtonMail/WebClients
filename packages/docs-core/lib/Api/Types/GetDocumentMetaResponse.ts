export type GetDocumentMetaResponse = {
  Code: 1000
  Document: {
    VolumeID: string
    LinkID: string
    CommitIDs: string[]
    CreateTime: number
    ModifyTime: number
  }
}
