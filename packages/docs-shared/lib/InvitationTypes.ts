import type { SHARE_MEMBER_STATE } from '@proton/shared/lib/drive/constants'
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions'
import type { LinkType } from '@proton/shared/lib/interfaces/drive/link'

export interface ShareInvitation {
  invitationId: string
  inviterEmail: string
  inviteeEmail: string
  permissions: SHARE_MEMBER_PERMISSIONS
  keyPacket: string
  keyPacketSignature: string
  createTime: number
  state: SHARE_MEMBER_STATE
}

interface ShareInvitationShare {
  shareId: string
  volumeId: string
  passphrase: string
  shareKey: string
  creatorEmail: string
}

interface ShareInvitationLink {
  linkId: string
  name: string
  mimeType: string
  isFile: boolean
  type: LinkType
}

export interface ShareInvitationDetails {
  invitation: ShareInvitation
  share: ShareInvitationShare
  link: ShareInvitationLink
  decryptedLinkName?: string
}

export interface ExtendedInvitationDetails extends ShareInvitationDetails {
  decryptedLinkName?: string
  isLocked?: boolean
}
