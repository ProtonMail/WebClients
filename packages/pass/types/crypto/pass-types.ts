import type { ItemState, Maybe, MaybeNull, ShareRole, ShareType } from '@proton/pass/types';

export enum PassEncryptionTag {
    Cache = 'cache' /* Local cache */,
    Offline = 'offline' /* Offline components */,
    ItemContent = 'itemcontent',
    ItemKey = 'itemkey',
    VaultContent = 'vaultcontent',
    LinkKey = 'linkkey',
    BiometricOfflineKD = 'biometricofflinekd',
    FileData = 'filedata',
    FileKey = 'filekey',
    FileDataV2 = 'v2;{chunkIndex};{totalChunks};filedata.item.pass.proton',
    FileMetadataV2 = 'v2;filemetadata.item.pass.proton',
}

export enum PassSignatureContext {
    VaultInviteExistingUser = 'pass.invite.vault.existing-user',
    VaultInviteNewUser = 'pass.invite.vault.new-user',
}

export enum ContentFormatVersion {
    Share = 1,
    Item = 7,
}

/* type aliases */
export type Rotation = number;
export type ShareId = string;
export type ItemId = string;

export type RotationKey = {
    key: CryptoKey;
    raw: Uint8Array<ArrayBuffer>;
    rotation: Rotation;
};

export type ShareKey = RotationKey & { userKeyId: Maybe<string> };

export type ItemKey = RotationKey;
export type VaultShareKey = ShareKey;
export type ItemShareKey = ShareKey;
export type InviteTargetKey = ItemKey | VaultShareKey;

type OpenedShareBase = {
    addressId: string;
    canAutofill: Maybe<boolean>;
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
              content: Uint8Array<ArrayBuffer>;
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
    content: Uint8Array<ArrayBuffer>;
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
    /* New property on the item - keeping it as an optional
     * to avoid undefined behaviour when booting from cache */
    shareCount: Maybe<number>;
};
