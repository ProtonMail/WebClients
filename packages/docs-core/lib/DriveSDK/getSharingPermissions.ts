import type { NodeMeta } from '@proton/docs-shared'
import { generateNodeUid, getDrive, MemberRole } from '@proton/drive'
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions'
import { getRoleFromHierarchy } from './getRoleFromHierarchy'
import { traceErrorSDK } from './traceErrorSDK'

export async function getSharingPermissions(nodeMeta: NodeMeta): Promise<SHARE_MEMBER_PERMISSIONS> {
  const drive = getDrive()
  const nodeUid = generateNodeUid(nodeMeta.volumeId, nodeMeta.linkId)

  try {
    const hierarchy = await drive.getNodeHierarchy(nodeUid)
    const highestRole = getRoleFromHierarchy(hierarchy)

    if (highestRole === MemberRole.Admin) {
      return SHARE_MEMBER_PERMISSIONS.ADMIN_EDITOR
    } else if (highestRole === MemberRole.Editor) {
      return SHARE_MEMBER_PERMISSIONS.EDITOR
    }
    return SHARE_MEMBER_PERMISSIONS.VIEWER
  } catch (error) {
    traceErrorSDK(error, 'DocsDriveCompatSDK')
    throw error
  }
}
