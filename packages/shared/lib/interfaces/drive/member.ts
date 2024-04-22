import { SHARE_MEMBER_PERMISSIONS } from '../../drive/constants';

export interface ShareMemberPayload {
    MemberID: string;
    Email: string;
    InviterEmail: string;
    AddressID: string;
    CreateTime: number;
    ModifyTime: number;
    Permissions: SHARE_MEMBER_PERMISSIONS;
    KeyPacketSignature: string;
    SessionKeySignature: string;
}
