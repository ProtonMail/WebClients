import { Address, DecryptedKey, User } from '@proton/shared/lib/interfaces';

import {
    ItemCreateRequest,
    ItemKeyResponse,
    ItemMoveToShareRequest,
    ItemRevisionContentsResponse,
    ItemUpdateRequest,
    ShareGetResponse,
    ShareKeyResponse,
    VaultCreateRequest,
    VaultUpdateRequest,
} from '../api';
import { ShareType } from '../data/shares';
import {
    ItemKey,
    OpenedItem,
    OpenedShare,
    Rotation,
    RotationKey,
    SerializedRotationKey,
    ShareId,
    TypedOpenedShare,
    VaultKey,
} from './pass-types';

export type PassCryptoManagerContext = {
    user?: User;
    userKeys?: DecryptedKey[];
    addresses?: Address[];
    primaryUserKey?: DecryptedKey;
    primaryAddress?: Address;
    shareManagers: Map<ShareId, ShareManager>;
};

export type PassCryptoSnapshot = Pick<PassCryptoManagerContext, 'shareManagers'>;

export interface PassCryptoWorker extends SerializableCryptoContext<PassCryptoSnapshot> {
    hydrate: (data: {
        keyPassword: string;
        user: User;
        addresses: Address[];
        snapshot?: SerializedCryptoContext<PassCryptoSnapshot>;
    }) => Promise<void>;
    clear: () => void;
    getShareManager: (shareId: string) => ShareManager;
    createVault: (content: Uint8Array) => Promise<VaultCreateRequest>;
    updateVault: (data: { shareId: string; content: Uint8Array }) => Promise<VaultUpdateRequest>;
    openShare: (data: { encryptedShare: ShareGetResponse; shareKeys: ShareKeyResponse[] }) => Promise<OpenedShare>;
    updateShareKeys: (data: { shareId: string; shareKeys: ShareKeyResponse[] }) => Promise<void>;
    removeShare: (shareId: string) => void;
    openItem: (data: { shareId: string; encryptedItem: ItemRevisionContentsResponse }) => Promise<OpenedItem>;
    createItem: (data: { shareId: string; content: Uint8Array }) => Promise<ItemCreateRequest>;
    updateItem: (data: {
        shareId: string;
        content: Uint8Array;
        latestItemKey: ItemKeyResponse;
        lastRevision: number;
    }) => Promise<ItemUpdateRequest>;
    moveItem: (data: { destinationShareId: string; content: Uint8Array }) => Promise<ItemMoveToShareRequest>;
}

export type ShareContext<T extends ShareType = ShareType> = {
    share: TypedOpenedShare<T>;
    latestRotation: Rotation;
    vaultKeys: Map<Rotation, VaultKey>;
    itemKeys: Map<Rotation, ItemKey>;
};

export interface ShareManager<T extends ShareType = ShareType> extends SerializableCryptoContext<ShareContext> {
    getShare: () => TypedOpenedShare<T>;
    setShare: (share: TypedOpenedShare<T>) => void;
    getLatestRotation: () => Rotation;
    setLatestRotation: (rotation: Rotation) => void;
    hasVaultKey: (rotation: Rotation) => boolean;
    getVaultKey: (rotation: Rotation) => VaultKey;
    addVaultKey: (vaultKey: VaultKey) => void;
}

export interface SerializableCryptoContext<S> {
    serialize: () => SerializedCryptoContext<S>;
}

export type SerializedCryptoContext<T> = T extends SerializableCryptoContext<infer U>
    ? SerializedCryptoContext<U>
    : T extends RotationKey
    ? SerializedRotationKey
    : T extends Uint8Array
    ? string
    : T extends Map<infer K, infer U>
    ? (readonly [K, SerializedCryptoContext<U>])[]
    : T extends (infer U)[]
    ? SerializedCryptoContext<U>[]
    : T extends {}
    ? { [K in keyof T]: SerializedCryptoContext<T[K]> }
    : T;
