import type { ShareId } from '../crypto';
import type { VaultColor, VaultIcon } from '../protobuf/vault-v1.static';
import type { Maybe, MaybeNull } from '../utils';
import type { ItemRevision } from './items';

export enum ShareType {
    Vault = 1,
    Item = 2,
}

export enum ShareRole {
    MANAGER = '1',
    WRITE = '2',
    READ = '3',
}

export enum ShareFlags {
    HIDDEN = 1 << 0,
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
    addressId: Maybe<string>;
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
    permission: number;
    flags: number;
    groupId: MaybeNull<string>;
};

export type WithEventId<T> = T & {
    /** In Sync V1: used to track current share event
     *  In Sync V2: global event token is sufficient */
    eventId?: string;
};

export type Share<T extends ShareType = ShareType> = WithEventId<ShareBase<T>>;
export type ShareCreatedDTO = { share: Share; items: ItemRevision[] };

export type ShareVisibilityMap = Record<ShareId, boolean>;
