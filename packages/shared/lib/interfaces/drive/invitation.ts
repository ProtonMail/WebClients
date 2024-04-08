import { SHARE_MEMBER_PERMISSIONS, SHARE_MEMBER_STATE } from '../../drive/constants';

export interface InviteProtonUserPayload {
    InviterEmail: string;
    InviteeEmail: string;
    Permissions: SHARE_MEMBER_PERMISSIONS;
    KeyPacket: string;
    KeyPacketSignature: string;
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
    Type: number;
    LinkID: string;
    Name: string;
    MIMEType: string;
}

export interface ShareInvitationListingPayload {
    InvitationIDs: string[];
    More: boolean;
    LastAnchorID: string;
}
