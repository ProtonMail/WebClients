import { MemberRole, NodeType, generateNodeUid, type ProtonInvitationWithNode } from '@proton/drive/sdk'
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype'
import { useDocInvitationsStore } from './use-doc-invitations-store'

function sdkInvitation(uid: string): ProtonInvitationWithNode {
  return {
    uid,
    invitationTime: new Date(),
    addedByEmail: { ok: true, value: 'inviter@example.com' },
    inviteeEmail: 'invitee@example.com',
    role: MemberRole.Viewer,
    node: {
      uid: generateNodeUid('volume-1', `link-of-${uid}`),
      name: { ok: true, value: `${uid}.doc` },
      type: NodeType.File,
      mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE,
    },
  }
}

function lockedById() {
  return Object.fromEntries(
    useDocInvitationsStore
      .getState()
      .convertedInvitations.map((invite) => [invite.invitation.invitationId, invite.isLocked]),
  )
}

afterEach(() => {
  useDocInvitationsStore.setState({ rawInvitations: [], convertedInvitations: [] })
})

describe('useDocInvitationsStore', () => {
  test('setInvitations keeps the lock only of invitations that are still present', () => {
    const { setInvitations, updateInvitation } = useDocInvitationsStore.getState()
    setInvitations([sdkInvitation('a'), sdkInvitation('b')])
    updateInvitation('a', { isLocked: true })
    updateInvitation('b', { isLocked: true })

    setInvitations([sdkInvitation('a'), sdkInvitation('c')])
    expect(lockedById()).toEqual({ a: true, c: false })

    setInvitations([sdkInvitation('a'), sdkInvitation('b')])
    expect(lockedById()).toEqual({ a: true, b: false })
  })

  test('updateInvitation patches only the matching invitation', () => {
    const { setInvitations, updateInvitation } = useDocInvitationsStore.getState()
    setInvitations([sdkInvitation('a'), sdkInvitation('b')])
    const [untouchedBefore] = useDocInvitationsStore.getState().convertedInvitations

    updateInvitation('b', { isLocked: true, decryptedLinkName: 'Renamed.doc' })

    const [untouched, patched] = useDocInvitationsStore.getState().convertedInvitations
    expect(untouched).toEqual(untouchedBefore)
    expect(patched).toEqual(
      expect.objectContaining({
        invitation: expect.objectContaining({ invitationId: 'b' }),
        isLocked: true,
        decryptedLinkName: 'Renamed.doc',
      }),
    )
  })
})
