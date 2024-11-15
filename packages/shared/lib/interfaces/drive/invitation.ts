import type { SHARE_EXTERNAL_INVITATION_STATE, SHARE_MEMBER_STATE } from '../../drive/constants';
import type { SHARE_MEMBER_PERMISSIONS } from '../../drive/permissions';
import type { LinkType } from './link';

interface InviteEmailDetailsPayload {
    Message?: string;
    ItemName?: string;
}
export interface InviteProtonUserPayload {
    Invitation: {
        InviterEmail: string;
        InviteeEmail: string;
        Permissions: SHARE_MEMBER_PERMISSIONS;
        KeyPacket: string;
        KeyPacketSignature: string;
        ExternalInvitationID?: string;
    };
    EmailDetails?: InviteEmailDetailsPayload;
}

export interface InviteExternalUserPayload {
    ExternalInvitation: {
        InviterAddressID: string;
        InviteeEmail: string;
        Permissions: number;
        ExternalInvitationSignature: string;
    };
    EmailDetails?: InviteEmailDetailsPayload;
}

export interface ShareInvitationPayload {
    InvitationID: string;
    InviterEmail: string;
    InviteeEmail: string;
    Permissions: SHARE_MEMBER_PERMISSIONS;
    KeyPacket: string;
    KeyPacketSignature: string;
    CreateTime: number;
    State: SHARE_MEMBER_STATE;
}

export interface ShareInvitationSharePayload {
    ShareID: string;
    VolumeID: string;
    Passphrase: string;
    ShareKey: string;
    CreatorEmail: string;
}

export interface ShareInvitationLinkPayload {
    Type: LinkType;
    LinkID: string;
    Name: string;
    MIMEType: string;
}

export interface ShareInvitationDetailsPayload {
    Invitation: ShareInvitationPayload;
    Share: ShareInvitationSharePayload;
    Link: ShareInvitationLinkPayload;
}

export interface ShareInvitationListingPayload {
    InvitationIDs: string[];
    More: boolean;
    LastAnchorID: string;
}

export interface ShareExternalInvitationPayload {
    ExternalInvitationID: string;
    InviterEmail: string;
    InviteeEmail: string;
    CreateTime: number;
    Permissions: SHARE_MEMBER_PERMISSIONS;
    State: SHARE_EXTERNAL_INVITATION_STATE;
    ExternalInvitationSignature: string;
}
