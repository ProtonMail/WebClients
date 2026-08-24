import type { GroupInviteListItemResponse, InviteDataForUser, KeyRotationKeyPair } from '../api';
import type { MaybeNull } from '../utils';
import type { ShareRole, ShareType, VaultShareContent } from './shares';

export type AbstractInviteResponse = InviteDataForUser | GroupInviteListItemResponse;

export enum NewUserInviteState {
    WAITING = 1,
    READY = 2,
}

export enum InviteType {
    User = 1,
    GroupOrg = 2,
    GroupOwner = 3,
}

export type InviteBase = {
    createTime: number;
    invitedEmail: string;
    invitedGroupId: MaybeNull<string>;
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

export type InviteContent =
    { targetType: ShareType.Vault; vault: InviteVaultData } | { targetType: ShareType.Item; vault: null };

export type Invite<T extends InviteType = InviteType> = InviteBase & {
    type: T;
    fromNewUser: boolean;
    invitedAddressId: string;
    keys: KeyRotationKeyPair[];
    remindersSent: number;
    token: string;
} & InviteContent;

export type UserInvite = Invite<InviteType.User>;
export type GroupOwnerInvite = Invite<InviteType.GroupOwner>;
export type GroupOrgInvite = Invite<InviteType.GroupOrg>;
export type GroupInvite = GroupOwnerInvite | GroupOrgInvite;

export type VaultInvite<T extends InviteType = InviteType> = Invite<T> & { targetType: ShareType.Vault };
export type ItemInvite<T extends InviteType = InviteType> = Invite<T> & { targetType: ShareType.Item };

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
    isGroupShare: boolean;
};
