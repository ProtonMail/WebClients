import { ServerTime } from '@proton/docs-shared/lib/ServerTime'
import { type MemberRole, type NodeEntity, splitNodeUid } from '@proton/drive'
import { getAuthorName } from '~/drive-sdk'
import { mimeTypeToProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import type { RecentDocumentsItemValue } from '@proton/docs-core/lib/Services/recent-documents'
import { getNodeName } from '@proton/docs-core/lib/DriveSDK/getNodeName'

/**
 * Creates value for RecentDocumentsItem instances based on node data from SDK and response from /recents endpoint
 */
export function createDocumentItem(
  node: NodeEntity,
  documentDetails: {
    isSharedWithMe: boolean
    path: string[]
    ancestorsNodeUids: string[]
    effectiveRole: MemberRole
    lastOpenTime: number
    deprecatedShareId?: string
  },
): RecentDocumentsItemValue {
  const { lastOpenTime, path, isSharedWithMe, ancestorsNodeUids, deprecatedShareId, effectiveRole } = documentDetails

  const { volumeId, nodeId: linkId } = splitNodeUid(node.uid)
  const { nodeId: parentLinkId } = node.parentUid ? splitNodeUid(node.parentUid) : {}

  return {
    type: mimeTypeToProtonDocumentType(node.mediaType) ?? 'document',
    name: getNodeName(node) ?? '',
    linkId,
    parentLinkId,
    volumeId,
    // lastViewed and lastModified are the same - consistent with pre-SDK behavior
    lastViewed: new ServerTime(lastOpenTime),
    lastModified: new ServerTime(lastOpenTime),
    createdBy: getAuthorName(node.keyAuthor),
    location: getLocation(path, isSharedWithMe),
    ancestorsNodeUids,
    isSharedWithMe,
    shareId: deprecatedShareId ?? '',
    effectiveRole,
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

export function nodeToTrashedDocumentItem(node: NodeEntity): RecentDocumentsItemValue {
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
    createdBy: getAuthorName(node.keyAuthor),
    // Properties below are irrelevant for trashed items
    isSharedWithMe: false,
    shareId: '',
    location: { type: 'root' },
    effectiveRole: node.directRole,
  }
}
