import type { ItemState, Maybe, MaybeNull, ShareRole, ShareType } from '@proton/pass/types';

export enum PassEncryptionTag {
    Cache = 'cache' /* web-only usage */,
    Offline = 'offline',
    ItemContent = 'itemcontent',
    ItemKey = 'itemkey',
    VaultContent = 'vaultcontent',
}

export enum PassSignatureContext {
    VaultInviteExistingUser = 'pass.invite.vault.existing-user',
    VaultInviteNewUser = 'pass.invite.vault.new-user',
}

export enum ContentFormatVersion {
    Share = 1,
    Item = 4,
}

/* type aliases */
export type Rotation = number;
export type ShareId = string;

export type RotationKey = {
    key: CryptoKey;
    raw: Uint8Array;
    rotation: Rotation;
};

export type VaultKey = RotationKey & { userKeyId: Maybe<string> };
export type ItemKey = RotationKey;

type OpenedShareBase = {
    addressId: string;
    createTime: number;
    expireTime?: MaybeNull<number>;
    newUserInvitesReady: number;
    owner: boolean;
    permission: number;
    shared: boolean;
    shareId: string;
    shareRoleId: ShareRole;
    targetId: string;
    targetMaxMembers: number;
    targetMembers: number;
    vaultId: string;
};

export type OpenedShare = OpenedShareBase &
    (
        | {
              content: Uint8Array;
              contentFormatVersion: number;
              contentKeyRotation: Rotation;
              targetType: ShareType.Vault;
          }
        | {
              content: null;
              contentFormatVersion: null;
              contentKeyRotation: null;
              targetType: ShareType.Item;
          }
    );

export type TypedOpenedShare<T extends ShareType> = Extract<OpenedShare, { targetType: T }>;

export type OpenedItem = {
    aliasEmail: MaybeNull<string>;
    content: Uint8Array;
    contentFormatVersion: number;
    createTime: number;
    itemId: string;
    lastUseTime: MaybeNull<number>;
    modifyTime: number;
    pinned: boolean;
    flags: number;
    revision: number;
    revisionTime: number;
    state: ItemState;
};
