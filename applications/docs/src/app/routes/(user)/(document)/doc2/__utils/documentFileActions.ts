import type { NodeMeta } from '@proton/docs-shared/BasicTypes'
import { getDocumentActionUrl } from '@proton/docs-shared/URL/getDocumentActionUrl'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import {
  type NodeEntity,
  NodeType,
  type ProtonDriveClient,
  generateNodeUid,
  getDrive,
  splitNodeUid,
} from '@proton/drive/sdk'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { getPlatformFriendlyDateForFileName } from '@proton/shared/lib/docs/utils/getPlatformFriendlyDateForFileName'
import { getDefaultDocumentName } from '@proton/shared/lib/docs/utils/isDefaultDocumentName'

import { getIsSharedWithMe } from '~/drive-sdk/getIsSharedWithMe'
import { DOCUMENT_V2_PATH } from '~/utils/docs-url-bar'
import { constructDriveFolderUrl } from '~/utils/open-drive-folder'

type DocumentNode = Pick<NodeEntity, 'uid' | 'parentUid'>

/**
 * The folder a new document goes in: the document's own folder, as docs-core `UseCase/CreateNewDocument.ts` picks it.
 * None for a document with no parent folder, such as one shared with the user.
 */
function getSiblingFolder({ parentUid }: DocumentNode): NodeMeta | undefined {
  if (!parentUid) {
    return undefined
  }
  const { volumeId, nodeId } = splitNodeUid(parentUid)
  return { volumeId, linkId: nodeId }
}

/**
 * The doc2 URL that creates a text document next to `node`. Without a parent folder it is the bare doc2 URL, which
 * creates the document in My files.
 */
export function getNewDocumentHref(node: DocumentNode, localID: number | undefined): string {
  const url = new URL(getAppHref(DOCUMENT_V2_PATH, APPS.PROTONDOCS, localID))
  const folder = getSiblingFolder(node)
  if (folder) {
    url.searchParams.set('mode', 'create')
    url.searchParams.set('volumeId', folder.volumeId)
    url.searchParams.set('parentLinkId', folder.linkId)
  }
  return url.toString()
}

/**
 * Creates a spreadsheet next to `node`, or in My files without a parent folder, under the default name or the one Drive
 * offers when that is taken, as docs-core `UseCase/CreateNewDocument.ts` does.
 */
export async function createSpreadsheet(node: DocumentNode, driveCompat: DriveCompat): Promise<NodeMeta> {
  const folder = getSiblingFolder(node) ?? (await driveCompat.getMyFilesNodeMeta())
  const name = await getDrive().getAvailableName(
    generateNodeUid(folder.volumeId, folder.linkId),
    getDefaultDocumentName('sheet', getPlatformFriendlyDateForFileName()),
    NodeType.File,
  )
  const { volumeId, linkId } = await driveCompat.createDocumentNode(folder, name, 'sheet')
  return { volumeId, linkId }
}

/** The legacy sheets URL that opens the spreadsheet `nodeMeta`: sheets don't open in doc2. */
export function getSpreadsheetHref(nodeMeta: NodeMeta, localID: number | undefined): string {
  return getDocumentActionUrl({ type: 'sheet', mode: 'open', ...nodeMeta }, localID).toString()
}

/**
 * The Drive path of the folder holding `node`, as /doc's title menu builds it: Drive still addresses folders by share
 * ID. Shared with me when the user can't reach the folder, else the Drive root.
 */
export async function getDriveFolderPath(node: DocumentNode): Promise<string> {
  const hierarchy = await getDrive().getNodeHierarchy(node.uid)
  const root = hierarchy.at(0)
  const self = hierarchy.at(-1)
  const parentLinkId = node.parentUid ? splitNodeUid(node.parentUid).nodeId : undefined
  return constructDriveFolderUrl(parentLinkId, root?.deprecatedShareId, self ? getIsSharedWithMe(self) : false)
}

// Copied from docs-core `DriveSDK/trash.tsx`, which doc2 must not import.
export async function trashNode(nodeUid: string): Promise<void> {
  await throwOnFailure(getDrive().trashNodes([nodeUid]))
}

// Copied from docs-core `DriveSDK/trash.tsx`, which doc2 must not import.
export async function restoreNode(nodeUid: string): Promise<void> {
  await throwOnFailure(getDrive().restoreNodes([nodeUid]))
}

async function throwOnFailure(results: ReturnType<ProtonDriveClient['trashNodes']>) {
  for await (const result of results) {
    if (!result.ok) {
      throw new Error(`${result.error.name}: ${result.error.message}; UID=${result.uid}`)
    }
  }
}

/** Whether restoring failed because the document sat in a folder shared with the user, which only its owner can restore */
export function isInsufficientPermissionsError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('Insufficient permissions')
}
