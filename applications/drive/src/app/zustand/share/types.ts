import type { ShareExternalInvitation, ShareInvitation, ShareMember } from '../../store';

export interface MembersState {
    members: ShareMember[];
    // Members Actions
    setMembers: (members: ShareMember[]) => void;
}

export interface InvitationsState {
    invitations: ShareInvitation[];
    externalInvitations: ShareExternalInvitation[];

    // Invitations Actions
    setInvitations: (invitations: ShareInvitation[]) => void;
    removeInvitations: (invitations: ShareInvitation[]) => void;
    updateInvitationsPermissions: (invitations: ShareInvitation[]) => void;
    // External Invitations Actions
    setExternalInvitations: (invitations: ShareExternalInvitation[]) => void;
    removeExternalInvitations: (invitations: ShareExternalInvitation[]) => void;
    updateExternalInvitations: (invitations: ShareExternalInvitation[]) => void;
    // Mixed Invitations Actions
    addMultipleInvitations: (invitations: ShareInvitation[], externalInvitations: ShareExternalInvitation[]) => void;
}
