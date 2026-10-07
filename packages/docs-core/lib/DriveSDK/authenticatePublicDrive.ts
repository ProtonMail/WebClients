import { getDrive, MemberRole, type NodeEntity, NodeType, splitNodeUid } from '@proton/drive'
import metrics from '@proton/metrics'
import { SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions'
import { getPublicDrive, type PublicLinkInfo, setPublicDrive, setPublicLinkInfo } from './getPublicDrive'

export async function authenticatePublicDrive(
  url: string,
  customPassword: string | undefined,
  isAnonymousContext: boolean,
) {
  const publicDrive = await getDrive().experimental.authURLAccess(url, customPassword, isAnonymousContext)
  const { uid, accessToken } = publicDrive.experimental.getSessionInfo()
  // This enables metrics to work for both auth and un-auth customers
  metrics.setAuthHeaders(uid, accessToken)
  setPublicDrive(publicDrive)
}

export async function loadPublicLinkInfo(
  customPassword: string | undefined,
  linkIdParam: string | undefined,
  isAnonymousContext: boolean,
  hasRootDirectAccess: boolean,
) {
  const rootNode = await getPublicDrive().getRootNode()
  setPublicLinkInfo(toPublicLinkInfo(rootNode, customPassword, linkIdParam, isAnonymousContext, hasRootDirectAccess))
}

function toPublicLinkInfo(
  rootNode: NodeEntity,
  customPassword: string | undefined,
  linkIdParam: string | undefined,
  isAnonymousContext: boolean,
  hasRootDirectAccess: boolean,
): PublicLinkInfo {
  const { volumeId, nodeId } = splitNodeUid(rootNode.uid)
  const isSharedUrlAFolder = rootNode.type === NodeType.Folder
  return {
    customPassword: customPassword || '',
    /**
     * For directly shared public doc links, Drive might redirect to Docs without a linkId.
     * If the shared url is a file then we can use the linkId of the loaded root node,
     * and if the shared url is a folder we need the linkId param to be passed.
     */
    linkId: isSharedUrlAFolder ? linkIdParam : nodeId,
    volumeId,
    isSharedUrlAFolder,
    permissions: roleToPermissions(rootNode.directRole),
    hasDirectAccess: getHasDirectAccess(isSharedUrlAFolder, isAnonymousContext, hasRootDirectAccess),
  }
}

/**
 * Direct access to the shared root covers the document too, whether it is the root itself or inside it.
 * Without it, a document inside a shared folder may still be shared directly, which the public link can't tell.
 */
function getHasDirectAccess(isSharedUrlAFolder: boolean, isAnonymousContext: boolean, hasRootDirectAccess: boolean) {
  if (isAnonymousContext) {
    return false
  }
  if (hasRootDirectAccess) {
    return true
  }
  return isSharedUrlAFolder ? undefined : false
}

// Unlike legacy, which reads the share URL permissions, they are derived from the direct role of the root node
function roleToPermissions(role: MemberRole): SHARE_URL_PERMISSIONS {
  return role === MemberRole.Editor || role === MemberRole.Admin
    ? SHARE_URL_PERMISSIONS.EDITOR
    : SHARE_URL_PERMISSIONS.VIEWER
}
