export function GetAssociatedEncryptionDataForRealtimeMessage(metadata: {
  version: number
  authorAddress: string
  timestamp: number
}): string {
  return `${metadata.version}.${metadata.authorAddress}.${metadata.timestamp}`
}

export function GetAssociatedEncryptionDataForComment(metadata: { authorAddress: string; markId: string }): string {
  return `${metadata.authorAddress}.${metadata.markId}`
}
