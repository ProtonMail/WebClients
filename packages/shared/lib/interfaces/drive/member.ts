import type { SHARE_MEMBER_STATE } from '../../drive/constants';
import type { SHARE_MEMBER_PERMISSIONS } from '../../drive/permissions';

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
