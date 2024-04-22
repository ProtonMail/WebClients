import { SHARE_MEMBER_PERMISSIONS, SHARE_MEMBER_STATE } from '../../drive/constants';

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

export interface ShareMembershipPayload {
    MemberID: string;
    ShareID: string;
    AddressID: string;
    AddressKeyID: string;
    Inviter: string;
    CreateTime: number;
    ModifyTime: number;
    Permissions: SHARE_MEMBER_PERMISSIONS;
    State: SHARE_MEMBER_STATE;
    KeyPacket: string;
    KeyPacketSignature: string;
    SessionKeySignature: string;
    Unlockable: boolean;
}
