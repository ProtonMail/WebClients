import type { ProtonInvitationWithNode } from '@proton/drive'
import type { ExtendedInvitationDetails } from '@proton/docs-shared'
import { create } from 'zustand'
import { sdkInvitationToExtended } from './sdk-invitation-to-extended'

interface DocInvitationsStore {
  rawInvitations: ProtonInvitationWithNode[]
  convertedInvitations: ExtendedInvitationDetails[]
  setInvitations: (invitations: ProtonInvitationWithNode[]) => void
  updateInvitation: (invitationId: string, patch: Partial<ExtendedInvitationDetails>) => void
}

// Keeps lock of invitations that are being accepted
function toConvertedInvitations(invitations: ProtonInvitationWithNode[], previous: ExtendedInvitationDetails[]) {
  const lockedIds = new Set(previous.filter((item) => item.isLocked).map((item) => item.invitation.invitationId))
  return invitations.map((invitation) => ({
    ...sdkInvitationToExtended(invitation),
    isLocked: lockedIds.has(invitation.uid),
  }))
}

export const useDocInvitationsStore = create((set): DocInvitationsStore => ({
  rawInvitations: [],
  convertedInvitations: [],

  setInvitations: (invitations) =>
    set((state) => ({
      rawInvitations: invitations,
      convertedInvitations: toConvertedInvitations(invitations, state.convertedInvitations),
    })),

  updateInvitation: (invitationId, newValues) =>
    set((state) => ({
      convertedInvitations: state.convertedInvitations.map((invitation) =>
        invitation.invitation.invitationId === invitationId ? { ...invitation, ...newValues } : invitation,
      ),
    })),
}))
