import { getAuthorName } from '~/drive-sdk'
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions'
import { SHARE_MEMBER_STATE } from '@proton/shared/lib/drive/constants'
import { LinkType } from '@proton/shared/lib/interfaces/drive/link'
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype'
import { MemberRole, splitNodeUid, type ProtonInvitationWithNode } from '@proton/drive'
import type { ExtendedInvitationDetails } from '@proton/drive-store/store'
import { getNodeName } from '@proton/docs-core/lib/DriveSDK/getNodeName'

const ROLE_TO_PERMISSIONS: Record<MemberRole, SHARE_MEMBER_PERMISSIONS> = {
  [MemberRole.Viewer]: SHARE_MEMBER_PERMISSIONS.VIEWER,
  [MemberRole.Editor]: SHARE_MEMBER_PERMISSIONS.EDITOR,
  [MemberRole.Admin]: SHARE_MEMBER_PERMISSIONS.ADMIN_EDITOR,
  [MemberRole.Inherited]: SHARE_MEMBER_PERMISSIONS.VIEWER,
}

export function sdkInvitationToExtended(invitation: ProtonInvitationWithNode): ExtendedInvitationDetails {
  const name = getNodeName(invitation.node) ?? ''
  const inviterEmail = getAuthorName(invitation.addedByEmail)
  const { volumeId, nodeId: linkId } = splitNodeUid(invitation.node.uid)

  return {
    invitation: {
      invitationId: invitation.uid,
      inviterEmail,
      inviteeEmail: invitation.inviteeEmail,
      permissions: ROLE_TO_PERMISSIONS[invitation.role],
      keyPacket: '', // not exposed by the SDK, not used by Docs
      keyPacketSignature: '', // not exposed by SDK, not used by Docs
      createTime: Math.floor(invitation.invitationTime.getTime() / 1000),
      state: SHARE_MEMBER_STATE.PENDING, // iterateInvitations only yields pending invitations
    },
    share: {
      volumeId,
      // Not used, can be empty
      shareId: '',
      passphrase: '',
      shareKey: '',
      creatorEmail: '',
    },
    link: {
      linkId,
      name,
      mimeType: invitation.node.mediaType ?? PROTON_DOCS_DOCUMENT_MIMETYPE,
      // We only get files in Docs
      isFile: true,
      type: LinkType.FILE,
    },
    decryptedLinkName: name,
    isLocked: false,
  }
}
