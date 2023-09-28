import { type MaybeNull } from '../utils';
import type { ShareRole, ShareType, VaultShareContent } from './shares';

export type InviteBase = {
    invitedEmail: string;
    inviterEmail: string;
    targetType: ShareType;
    targetId: string;
    remindersSent: number;
    createTime: number;
};

export type PendingInvite = InviteBase & {
    inviteId: string;
    modifyTime: number;
};

export type InviteVaultData = {
    content: VaultShareContent;
    memberCount: number;
    itemCount: number;
};

export type Invite = InviteBase & {
    token: string;
    vault: InviteVaultData;
};

export type ShareMember = {
    shareId: string;
    name: string;
    email: string;
    owner: boolean;
    targetType: ShareType;
    targetId: string;
    shareRoleId: ShareRole;
    expireTime?: MaybeNull<number>;
    createTime: number;
};
