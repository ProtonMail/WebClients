import type { ItemState, Maybe, MaybeNull, ShareRole, ShareType } from '@proton/pass/types';

export enum PassEncryptionTag {
    VaultContent = 'vaultcontent',
    ItemKey = 'itemkey',
    ItemContent = 'itemcontent',
    Cache = 'cache' /* web-only usage */,
}

export enum PassSignatureContext {
    VaultInviteInternal = 'pass.invite.vault.existing-user',
    VaultInviteExternal = 'pass.invite.vault.new-user',
}

export const CONTENT_FORMAT_VERSION = 1;

/* type aliases */
export type Rotation = number;
export type ShareId = string;

export type RotationKey = {
    raw: Uint8Array;
    key: CryptoKey;
    rotation: Rotation;
};

export type VaultKey = RotationKey & { userKeyId: Maybe<string> };
export type ItemKey = RotationKey;

type OpenedShareBase = {
    shareId: string;
    vaultId: string;
    addressId: string;
    targetId: string;
    permission: number;
    expireTime?: MaybeNull<number>;
    createTime: number;
    owner: boolean;
    shared: boolean;
    targetMembers: number;
    targetMaxMembers: number;
    shareRoleId: ShareRole;
};

export type OpenedShare = OpenedShareBase &
    (
        | {
              targetType: ShareType.Vault;
              content: Uint8Array;
              contentKeyRotation: Rotation;
              contentFormatVersion: number;
          }
        | {
              targetType: ShareType.Item;
              content: null;
              contentKeyRotation: null;
              contentFormatVersion: null;
          }
    );

export type TypedOpenedShare<T extends ShareType> = Extract<OpenedShare, { targetType: T }>;

export type OpenedItem = {
    itemId: string;
    revision: number;
    content: Uint8Array;
    contentFormatVersion: number;
    state: ItemState;
    aliasEmail: MaybeNull<string>;
    createTime: number;
    revisionTime: number;
    modifyTime: number;
    lastUseTime: MaybeNull<number>;
};
