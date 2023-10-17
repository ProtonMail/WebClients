import type { KeyRotationKeyPair } from '../api';
import type { ShareRole } from './shares';

export type InviteCreateIntent = { shareId: string; email: string; role: ShareRole };
export type InviteResendIntent = { shareId: string; inviteId: string };
export type InviteRemoveIntent = { shareId: string; inviteId: string };
export type InviteRejectIntent = { inviteToken: string };
export type InviteAcceptIntent = {
    invitedAddressId: string;
    inviteKeys: KeyRotationKeyPair[];
    inviterEmail: string;
    inviteToken: string;
};
