import type { VaultColor, VaultIcon } from '../protobuf/vault-v1';

export enum ShareType {
    Vault = 1,
    Item = 2,
}

export enum ShareRole {
    ADMIN = '1',
    WRITE = '2',
    READ = '3',
}

export type VaultShareContent = {
    name: string;
    description: string;
    display: {
        icon?: VaultIcon;
        color?: VaultColor;
    };
};

export type VaultInviteCreateRequest = {
    shareId: string;
    email: string;
    role: ShareRole;
};

export type VaultInviteResendRequest = {
    shareId: string;
    inviteId: string;
};

export type ItemShareContent = {};

export type ShareContent<T extends ShareType = ShareType> = T extends ShareType.Vault
    ? VaultShareContent
    : T extends ShareType.Item
    ? ItemShareContent
    : never;

export type ShareBase<T extends ShareType = ShareType> = {
    shareId: string;
    vaultId: string;
    targetId: string;
    targetType: T;
    content: ShareContent<T>;
    primary: boolean;
    shared: boolean;
    owner: boolean;
    targetMembers: number;
    shareRoleId: ShareRole;
};

export type WithEventId<T> = T & { eventId: string };

export type Share<T extends ShareType = ShareType> = WithEventId<ShareBase<T>>;
export type VaultShare = Share<ShareType.Vault>;
