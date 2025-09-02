import type { KeyRotationKeyPair } from '../api';
import type { MaybeNull } from '../utils';
import type { ShareRole, ShareType, VaultShareContent } from './shares';

export enum NewUserInviteState {
    WAITING = 1,
    READY = 2,
}

export type InviteBase = {
    createTime: number;
    invitedEmail: string;
    inviterEmail: string;
    targetId: string;
    targetType: ShareType;
};

export type PendingInvite = InviteBase & {
    inviteId: string;
    modifyTime: number;
    remindersSent: number;
};

export type NewUserPendingInvite = InviteBase & {
    newUserInviteId: string;
    signature: string;
    state: NewUserInviteState;
};

export type InviteVaultData = {
    content: VaultShareContent;
    itemCount: number;
    memberCount: number;
};

export type Invite = InviteBase & {
    fromNewUser: boolean;
    invitedAddressId: string;
    keys: KeyRotationKeyPair[];
    remindersSent: number;
    token: string;
} & ({ targetType: ShareType.Vault; vault: InviteVaultData } | { targetType: ShareType.Item; vault: null });

export type VaultInvite = Invite & { targetType: ShareType.Vault };

export type ItemInvite = Invite & { targetType: ShareType.Item };

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
