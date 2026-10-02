export function constructDriveFolderUrl(
  parentLinkId: string | undefined,
  shareId: string | undefined,
  isSharedWithMe: boolean = false,
): string {
  if (parentLinkId && shareId) {
    return `/${shareId}/folder/${parentLinkId}`
  }
  if (isSharedWithMe) {
    return '/shared-with-me'
  }
  return '/'
}
