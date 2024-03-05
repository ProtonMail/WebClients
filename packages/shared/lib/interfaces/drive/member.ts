import { SHARE_MEMBER_PERMISSIONS } from '../../drive/constants';

export interface ShareMemberPayload {
    MemberID: string;
    Email: string;
    InviterEmail: string;
    AddressID: number;
    CreateTime: number;
    ModifyTime: number;
    Permissions: SHARE_MEMBER_PERMISSIONS;
    KeyPacketSignature: string;
    SessionKeySignature: string;
}

export interface ShareMemberListingPayload {
    MemberIDs: string[];
    More: boolean;
    LastAnchorID: string;
}
