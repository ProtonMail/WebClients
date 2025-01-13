import type { Maybe } from '@proton/pass/types/utils';
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
    description: string;
    display: { icon?: VaultIcon; color?: VaultColor };
    name: string;
};

export type ItemShareContent = {};

export type ShareContent<T extends ShareType = ShareType> =
    T extends ShareType.Vault ? VaultShareContent
    : T extends ShareType.Item ? ItemShareContent
    : never;

export type ShareBase<T extends ShareType = ShareType> = {
    content: ShareContent<T>;
    createTime: number;
    canAutofill: Maybe<boolean>;
    newUserInvitesReady: number;
    owner: boolean;
    shared: boolean;
    shareId: string;
    shareRoleId: ShareRole;
    targetId: string;
    targetMaxMembers: number;
    targetMembers: number;
    targetType: T;
    vaultId: string;
};

export type WithEventId<T> = T & { eventId: string };
export type Share<T extends ShareType = ShareType> = WithEventId<ShareBase<T>>;

export type ShareSyncKeys =
    | 'canAutofill'
    | 'newUserInvitesReady'
    | 'owner'
    | 'shared'
    | 'shareId'
    | 'shareRoleId'
    | 'targetMaxMembers'
    | 'targetMembers';
