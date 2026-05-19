import { ServerTime } from '@proton/docs-shared/lib/ServerTime'
import { type DegradedNode, type NodeEntity, splitNodeUid } from '@proton/drive'
import type { RecentDocumentAPIItem } from '@proton/docs-core/lib/Api/Types/GetRecentsResponse'
import { mimeTypeToProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import type { RecentDocumentsItemValue } from '@proton/docs-core/lib/Services/recent-documents'

/**
 * Creates value for RecentDocumentsItem instances based on node data from SDK and response from /recents endpoint
 */
export function createItemValue({
  sdkData,
  apiData,
  isSharedWithMe,
  path,
}: {
  sdkData: NodeEntity | DegradedNode
  apiData: RecentDocumentAPIItem
  isSharedWithMe: boolean
  path: string[]
}): RecentDocumentsItemValue {
  const { volumeId, nodeId: linkId } = splitNodeUid(sdkData.uid)
  const { nodeId: parentLinkId } = sdkData.parentUid ? splitNodeUid(sdkData.parentUid) : {}

  return {
    type: mimeTypeToProtonDocumentType(sdkData.mediaType) ?? 'document',
    name: getNodeName(sdkData) ?? '',
    linkId,
    parentLinkId,
    volumeId,
    // lastViewed and lastModified are the same - consistent with pre-SDK behavior
    lastViewed: new ServerTime(apiData.LastOpenTime),
    lastModified: new ServerTime(apiData.LastOpenTime),
    createdBy: getAuthorName(sdkData),
    location: getLocation(path, isSharedWithMe),
    isSharedWithMe,
    shareId: apiData.ContextShareID,
  }
}

function getLocation(path: string[], isSharedWithMe: boolean) {
  if (isSharedWithMe) {
    return {
      type: 'shared-with-me',
    } as const
  }

  if (path.length > 0) {
    return {
      type: 'path',
      path,
    } as const
  }

  return { type: 'root' } as const
}

function getNodeName(sdkData: NodeEntity | DegradedNode) {
  if (typeof sdkData.name === 'string') {
    return sdkData.name
  }
  if (sdkData.name.ok) {
    return sdkData.name.value
  }
}

function getAuthorName(sdkData: NodeEntity | DegradedNode) {
  if (sdkData.keyAuthor.ok) {
    return sdkData.keyAuthor.value ?? undefined
  }
}
