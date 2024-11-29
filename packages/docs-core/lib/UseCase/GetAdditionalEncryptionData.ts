export function GetAssociatedEncryptionDataForRealtimeMessage(metadata: {
  version: number
  authorAddress: string | undefined
  timestamp: number
}): string {
  if (metadata.authorAddress) {
    return `${metadata.version}.${metadata.authorAddress}.${metadata.timestamp}`
  }

  return `${metadata.version}.${metadata.timestamp}`
}

export function GetAssociatedEncryptionDataForComment(metadata: {
  authorAddress: string | undefined
  markId: string
}): string {
  if (metadata.authorAddress) {
    return `${metadata.authorAddress}.${metadata.markId}`
  }

  return metadata.markId
}
