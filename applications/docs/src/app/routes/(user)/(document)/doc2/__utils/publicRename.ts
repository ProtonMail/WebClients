import type { NodeEntity, ProtonDrivePublicLinkClient } from '@proton/drive/sdk'

import { getNodeName } from './getNodeName'

/**
 * Whether a public visitor may rename the document: only a signed-in editor, on a link to a folder, who created the
 * document, as the document action permissions give a publicly shared folder. An anonymous visitor can't be told from
 * another, a viewer renames nothing, and a link to the document itself gives no Rename. Adapted from
 * `applications/drive/src/app/sections/publicPage/actions/actionsItemsChecker.ts`, its `getIsOwnedByUser`, with the
 * node's author read as `usePublicFolderLoader.ts` reads `uploadedBy`. Without Drive's 59-minute edit window
 * (`isWithinEditWindow`): the server let a signed-in creator rename their document and folder through the link 66
 * minutes after creating them, from a new share-URL session too.
 */
export function canRenamePublicDocument({
  node,
  isSharedUrlAFolder,
  isEditor,
  addresses,
}: {
  node: Pick<NodeEntity, 'keyAuthor'>
  isSharedUrlAFolder: boolean
  /** The visitor edits: an editor link while public editing is on */
  isEditor: boolean
  /** The signed-in visitor's addresses; undefined for an anonymous visitor, or until they load */
  addresses: string[] | undefined
}): boolean {
  if (!isSharedUrlAFolder || !isEditor || !addresses?.length) {
    return false
  }
  // The claimed author when the signature doesn't verify, as Drive's public folder page shows it
  const uploadedBy = node.keyAuthor.ok ? node.keyAuthor.value : node.keyAuthor.error.claimedAuthor
  return !!uploadedBy && addresses.some((address) => address === uploadedBy)
}

/**
 * Renames the document through the share link, and returns the name it got. Adapted from
 * `packages/docs-core/lib/DriveSDK/renamePublicNode.ts`, with the share-URL client passed in. Unlike a member's rename,
 * there's no search for a free name: the share-URL client has no `getAvailableName`.
 */
export async function renamePublicDocument(
  publicDrive: Pick<ProtonDrivePublicLinkClient, 'renameNode'>,
  node: Pick<NodeEntity, 'uid'>,
  name: string,
): Promise<string> {
  // Unlike legacy, name validation and signing keys are decided by the SDK
  const renamed = await publicDrive.renameNode(node.uid, name)
  return getNodeName(renamed) ?? name
}
