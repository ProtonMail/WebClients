import { MemberRole, NodeType, generateNodeUid, type ProtonInvitationWithNode } from '@proton/drive/sdk'
import { SHARE_MEMBER_STATE } from '@proton/shared/lib/drive/constants'
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions'
import { PROTON_DOCS_DOCUMENT_MIMETYPE, PROTON_DOCS_SPREADSHEET_MIMETYPE } from '@proton/shared/lib/helpers/mimetype'
import { LinkType } from '@proton/shared/lib/interfaces/drive/link'
import { sdkInvitationToExtended } from './sdk-invitation-to-extended'

function sdkInvitation(overrides: Partial<ProtonInvitationWithNode> = {}): ProtonInvitationWithNode {
  return {
    uid: 'invitation-1',
    invitationTime: new Date('2026-01-01T00:00:01.500Z'),
    addedByEmail: { ok: true, value: 'inviter@example.com' },
    inviteeEmail: 'invitee@example.com',
    role: MemberRole.Editor,
    node: {
      uid: generateNodeUid('volume-1', 'link-1'),
      name: { ok: true, value: 'Plan.sheet' },
      type: NodeType.File,
      mediaType: PROTON_DOCS_SPREADSHEET_MIMETYPE,
    },
    ...overrides,
  }
}

describe('sdkInvitationToExtended', () => {
  test('converts an SDK invitation to the invitation details Docs displays', () => {
    expect(sdkInvitationToExtended(sdkInvitation())).toEqual({
      invitation: {
        invitationId: 'invitation-1',
        inviterEmail: 'inviter@example.com',
        inviteeEmail: 'invitee@example.com',
        permissions: SHARE_MEMBER_PERMISSIONS.EDITOR,
        keyPacket: '',
        keyPacketSignature: '',
        createTime: 1767225601,
        state: SHARE_MEMBER_STATE.PENDING,
      },
      share: {
        volumeId: 'volume-1',
        shareId: '',
        passphrase: '',
        shareKey: '',
        creatorEmail: '',
      },
      link: {
        linkId: 'link-1',
        name: 'Plan.sheet',
        mimeType: PROTON_DOCS_SPREADSHEET_MIMETYPE,
        isFile: true,
        type: LinkType.FILE,
      },
      decryptedLinkName: 'Plan.sheet',
      isLocked: false,
    })
  })

  test.each([
    [MemberRole.Viewer, SHARE_MEMBER_PERMISSIONS.VIEWER],
    [MemberRole.Editor, SHARE_MEMBER_PERMISSIONS.EDITOR],
    [MemberRole.Admin, SHARE_MEMBER_PERMISSIONS.ADMIN_EDITOR],
    [MemberRole.Inherited, SHARE_MEMBER_PERMISSIONS.VIEWER],
  ])('maps the %s role to permissions %s', (role, permissions) => {
    expect(sdkInvitationToExtended(sdkInvitation({ role })).invitation.permissions).toBe(permissions)
  })

  test('treats a node without a media type as a text document', () => {
    const invitation = sdkInvitation()
    invitation.node.mediaType = undefined

    expect(sdkInvitationToExtended(invitation).link.mimeType).toBe(PROTON_DOCS_DOCUMENT_MIMETYPE)
  })

  test('uses the claimed name and inviter when the SDK cannot verify them', () => {
    const invitation = sdkInvitation({
      addedByEmail: { ok: false, error: { claimedAuthor: 'claimed@example.com', error: 'Signature mismatch' } },
    })
    invitation.node.name = { ok: false, error: { name: 'Claimed.sheet', error: 'Invalid name' } }

    const converted = sdkInvitationToExtended(invitation)

    expect(converted.invitation.inviterEmail).toBe('claimed@example.com')
    expect(converted.link.name).toBe('Claimed.sheet')
    expect(converted.decryptedLinkName).toBe('Claimed.sheet')
  })

  test('falls back when the SDK has neither a name nor an inviter', () => {
    const invitation = sdkInvitation({ addedByEmail: { ok: false, error: { error: 'Signature mismatch' } } })
    invitation.node.name = { ok: false, error: new Error('Decryption failed') }

    const converted = sdkInvitationToExtended(invitation)

    expect(converted.invitation.inviterEmail).toBe('Unknown user')
    expect(converted.link.name).toBe('')
    expect(converted.decryptedLinkName).toBe('')
  })
})
