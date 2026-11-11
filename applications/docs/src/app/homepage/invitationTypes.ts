// The values of SHARE_MEMBER_STATE (packages/shared/lib/drive/constants.ts) and LinkType
// (packages/shared/lib/interfaces/drive/link.ts). A local enum would not accept the host's enum values.
type ShareMemberState = 1 | 2 | 3
type LinkType = 1 | 2 | 3

interface ShareInvitation {
  invitationId: string
  inviterEmail: string
  inviteeEmail: string
  // SHARE_MEMBER_PERMISSIONS has computed members, so its values only fit number
  permissions: number
  keyPacket: string
  keyPacketSignature: string
  createTime: number
  state: ShareMemberState
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

interface ShareInvitationDetails {
  invitation: ShareInvitation
  share: ShareInvitationShare
  link: ShareInvitationLink
  decryptedLinkName?: string
}

export interface ExtendedInvitationDetails extends ShareInvitationDetails {
  decryptedLinkName?: string
  isLocked?: boolean
}
