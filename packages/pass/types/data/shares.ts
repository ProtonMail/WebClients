import type { VaultColor, VaultIcon } from '../protobuf/vault-v1';

export enum ShareType {
    Vault = 1,
    Item = 2,
}

export type VaultShareContent = {
    name: string;
    description: string;
    display: {
        icon?: VaultIcon;
        color?: VaultColor;
    };
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
    targetType: number;
    content: ShareContent<T>;
    primary: boolean;
};

export type WithEventId<T> = T & { eventId: string };

export type Share<T extends ShareType = ShareType> = WithEventId<ShareBase<T>>;
export type VaultShare = Share<ShareType.Vault>;
