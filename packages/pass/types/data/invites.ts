import type { KeyRotationKeyPair } from '../api';
import { type MaybeNull } from '../utils';
import type { ShareRole, ShareType, VaultShareContent } from './shares';

export type InviteBase = {
    createTime: number;
    invitedEmail: string;
    inviterEmail: string;
    remindersSent: number;
    targetId: string;
    targetType: ShareType;
};

export type PendingInvite = InviteBase & {
    inviteId: string;
    modifyTime: number;
};

export type InviteVaultData = {
    content: VaultShareContent;
    itemCount: number;
    memberCount: number;
};

export type Invite = InviteBase & {
    invitedAddressId: string;
    keys: KeyRotationKeyPair[];
    token: string;
    vault: InviteVaultData;
};

export type ShareMember = {
    createTime: number;
    email: string;
    expireTime?: MaybeNull<number>;
    name: string;
    owner: boolean;
    shareId: string;
    shareRoleId: ShareRole;
    targetId: string;
    targetType: ShareType;
};
