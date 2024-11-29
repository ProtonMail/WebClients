export type EncryptionMetadata = {
  version: number
  authorAddress: string
  timestamp: number
}

export type AnonymousEncryptionMetadata = {
  version: number
  authorAddress: undefined
  timestamp: number
}
