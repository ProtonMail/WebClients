import type { ProtonInvitationWithNode } from '@proton/drive'
import type { ExtendedInvitationDetails } from '@proton/drive-store/store'
import { create } from 'zustand'
import { sdkInvitationToExtended } from './sdk-invitation-to-extended'

interface DocInvitationsStore {
  rawInvitations: ProtonInvitationWithNode[]
  convertedInvitations: ExtendedInvitationDetails[]
  setInvitations: (invitations: ProtonInvitationWithNode[]) => void
  removeInvitation: (invitationUid: string) => void
  updateInvitation: (invitationId: string, patch: Partial<ExtendedInvitationDetails>) => void
}

function toConvertedInvitations(invitations: ProtonInvitationWithNode[]) {
  return invitations.map((invitation) => sdkInvitationToExtended(invitation))
}

export const useDocInvitationsStore = create(
  (set): DocInvitationsStore => ({
    rawInvitations: [],
    convertedInvitations: [],

    setInvitations: (invitations) =>
      set(() => ({ rawInvitations: invitations, convertedInvitations: toConvertedInvitations(invitations) })),

    removeInvitation: (invitationUid) =>
      set((state) => ({
        rawInvitations: state.rawInvitations.filter((invitation) => invitation.uid !== invitationUid),
        convertedInvitations: state.convertedInvitations.filter(
          (invitation) => invitation.invitation.invitationId !== invitationUid,
        ),
      })),

    updateInvitation: (invitationId, newValues) =>
      set((state) => ({
        convertedInvitations: state.convertedInvitations.map((invitation) =>
          invitation.invitation.invitationId === invitationId ? { ...invitation, ...newValues } : invitation,
        ),
      })),
  }),
)
