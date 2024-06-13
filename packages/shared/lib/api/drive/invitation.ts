import { SHARE_MEMBER_PERMISSIONS } from '../../drive/constants';
import { API_CUSTOM_ERROR_CODES } from '../../errors';
import { InviteExternalUserPayload, InviteProtonUserPayload } from '../../interfaces/drive/invitation';

export const queryInviteProtonUser = (shareID: string, { Invitation, EmailDetails }: InviteProtonUserPayload) => ({
    method: 'post',
    url: `drive/v2/shares/${shareID}/invitations`,
    data: {
        Invitation,
        EmailDetails,
    },
});

export const queryResendInvitation = (shareID: string, invitationID: string) => ({
    method: 'post',
    url: `drive/v2/shares/${shareID}/invitations/${invitationID}/sendemail`,
});

export const queryInvitationList = (shareID: string) => ({
    method: 'get',
    url: `drive/v2/shares/${shareID}/invitations`,
});

export const queryInvitationDetails = (invitationID: string) => ({
    method: 'get',
    url: `drive/v2/shares/invitations/${invitationID}`,
    silence: [API_CUSTOM_ERROR_CODES.NOT_FOUND],
});

export const queryAcceptShareInvite = (
    invitationID: string,
    { SessionKeySignature }: { SessionKeySignature: string }
) => ({
    method: 'post',
    url: `drive/v2/shares/invitations/${invitationID}/accept`,
    data: {
        SessionKeySignature,
    },
});

export const queryDeleteInvitation = (shareID: string, invitationID: string) => ({
    method: 'delete',
    url: `drive/v2/shares/${shareID}/invitations/${invitationID}`,
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

export const queryUpdateInvitationPermissions = (
    shareId: string,
    invitationId: string,
    Permissions: SHARE_MEMBER_PERMISSIONS
) => ({
    method: 'put',
    url: `drive/v2/shares/${shareId}/invitations/${invitationId}`,
    data: {
        Permissions,
    },
});

/** External invitations **/
export const queryInviteExternalUser = (
    shareID: string,
    { ExternalInvitation, EmailDetails }: InviteExternalUserPayload
) => ({
    method: 'post',
    url: `drive/v2/shares/${shareID}/external-invitations`,
    data: {
        ExternalInvitation,
        EmailDetails,
    },
});

export const queryExternalInvitationList = (shareID: string) => ({
    method: 'get',
    url: `drive/v2/shares/${shareID}/external-invitations`,
});

export const queryDeleteExternalInvitation = (shareID: string, externalInvitationId: string) => ({
    method: 'delete',
    url: `drive/v2/shares/${shareID}/external-invitations/${externalInvitationId}`,
});

export const queryUpdateExternalInvitationPermissions = (
    shareId: string,
    externalInvitationId: string,
    Permissions: SHARE_MEMBER_PERMISSIONS
) => ({
    method: 'put',
    url: `drive/v2/shares/${shareId}/external-invitations/${externalInvitationId}`,
    data: {
        Permissions,
    },
});
