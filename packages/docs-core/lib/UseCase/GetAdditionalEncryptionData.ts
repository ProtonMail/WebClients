const AnonymousUser = 'anonymous'

export function GetAssociatedEncryptionDataForRealtimeMessage(metadata: {
  version: number
  authorAddress: string | undefined
  timestamp: number
}): string {
  if (metadata.authorAddress) {
    return `${metadata.version}.${metadata.authorAddress}.${metadata.timestamp}`
  }

  return `${metadata.version}.${AnonymousUser}.${metadata.timestamp}`
}

export function GetAssociatedEncryptionDataForComment(metadata: {
  authorAddress: string | undefined
  markId: string
}): string {
  if (metadata.authorAddress) {
    return `${metadata.authorAddress}.${metadata.markId}`
  }

  return `${AnonymousUser}.${metadata.markId}`
}

export function isAnonymousComment(aad: string): boolean {
  const components = aad.split('.')
  return components[0] === AnonymousUser
}
