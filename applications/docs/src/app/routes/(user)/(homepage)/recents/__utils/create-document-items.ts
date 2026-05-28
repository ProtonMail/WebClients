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
  ancestorsNodeUids,
}: {
  sdkData: NodeEntity | DegradedNode
  apiData: RecentDocumentAPIItem
  isSharedWithMe: boolean
  path: string[]
  ancestorsNodeUids: string[]
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
    ancestorsNodeUids,
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

export function getNodeName(sdkData: NodeEntity | DegradedNode) {
  if (typeof sdkData.name === 'string') {
    return sdkData.name
  }
  if (sdkData.name.ok) {
    return sdkData.name.value
  }
}

export function getAuthorName(sdkData: NodeEntity | DegradedNode) {
  if (sdkData.keyAuthor.ok) {
    return sdkData.keyAuthor.value ?? undefined
  }
}

export function nodeToTrashedItemValue(node: NodeEntity | DegradedNode): RecentDocumentsItemValue {
  const { volumeId, nodeId: linkId } = splitNodeUid(node.uid)
  const { nodeId: parentLinkId } = node.parentUid ? splitNodeUid(node.parentUid) : {}
  return {
    name: getNodeName(node) ?? '',
    type: mimeTypeToProtonDocumentType(node.mediaType) ?? 'document',
    linkId,
    parentLinkId,
    volumeId,
    // In case trashTime is missing it will use Sept 2001, but that's HIGHLY unlikely
    lastViewed: new ServerTime(node.trashTime?.getTime() ?? 1000000000),
    lastModified: new ServerTime(node.trashTime?.getTime() ?? 1000000000),
    createdBy: getAuthorName(node),
    // Properties below are irrelevant for trashed items
    isSharedWithMe: false,
    shareId: '',
    location: { type: 'root' },
  }
}

/**
 * Unlike createItemValue, this uses only SDK data (node argument)
 */
export function nodeToRecentItemValue(
  node: NodeEntity | DegradedNode,
  isSharedWithMe: boolean,
  path: string[],
  ancestorsNodeUids: string[],
  shareId: string = '',
): RecentDocumentsItemValue {
  const { volumeId, nodeId: linkId } = splitNodeUid(node.uid)
  const { nodeId: parentLinkId } = node.parentUid ? splitNodeUid(node.parentUid) : {}

  return {
    name: getNodeName(node) ?? '',
    type: mimeTypeToProtonDocumentType(node.mediaType) ?? 'document',
    linkId,
    parentLinkId,
    volumeId,
    lastViewed: new ServerTime(node.creationTime.getTime()),
    lastModified: new ServerTime(node.creationTime.getTime()),
    createdBy: getAuthorName(node),
    isSharedWithMe,
    location: getLocation(path, isSharedWithMe),
    ancestorsNodeUids,
    shareId,
  }
}
