import { SHARE_MEMBER_PERMISSIONS } from '../../drive/constants';
import { InviteProtonUserPayload } from '../../interfaces/drive/invitation';

export const queryInviteProtonUser = (shareID: string, invitation: InviteProtonUserPayload) => ({
    method: 'post',
    url: `drive/v2/shares/${shareID}/invitations`,
    data: {
        Invitation: invitation,
    },
});

//TODO: Add pagination
export const queryShareInvitationsListing = (volumeId: string, shareId: string) => ({
    method: 'get',
    url: `drive/v2/volumes/${volumeId}/shares/${shareId}/invitations`,
});

//TODO: Add pagination
export const queryShareInvitationDetails = (
    volumeId: string,
    shareId: string,
    { InvitationIDs }: { InvitationIDs: string[] }
) => ({
    method: 'post',
    url: `drive/v2/volumes/${volumeId}/shares/${shareId}/invitations`,
    data: {
        InvitationIDs,
    },
});

export const queryUpdateShareInvitationPermissions = (
    volumeId: string,
    shareId: string,
    { Invitations }: { Invitations: { InvitationID: string; Permissions: SHARE_MEMBER_PERMISSIONS }[] }
) => ({
    method: 'put',
    url: `drive/v2/volumes/${volumeId}/shares/${shareId}/invitations/permissions`,
    data: {
        Invitations,
    },
});
