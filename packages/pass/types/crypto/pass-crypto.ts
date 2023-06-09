import type { Address, DecryptedKey, User } from '@proton/shared/lib/interfaces';

import type {
    ItemCreateRequest,
    ItemKeyResponse,
    ItemMoveSingleToShareRequest,
    ItemRevisionContentsResponse,
    ItemUpdateRequest,
    ShareGetResponse,
    ShareKeyResponse,
    VaultCreateRequest,
    VaultUpdateRequest,
} from '../api';
import type { ShareType } from '../data/shares';
import type { MaybeNull } from '../utils';
import type { ItemKey, OpenedItem, Rotation, ShareId, TypedOpenedShare, VaultKey } from './pass-types';

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
    getContext: () => PassCryptoManagerContext;
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
    canOpenShare: (shareId: string) => boolean;
    openShare: <T extends ShareType = ShareType>(data: {
        encryptedShare: ShareGetResponse;
        shareKeys: ShareKeyResponse[];
    }) => Promise<MaybeNull<TypedOpenedShare<T>>>;
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
    moveItem: (data: { destinationShareId: string; content: Uint8Array }) => Promise<ItemMoveSingleToShareRequest>;
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
    isActive: (userKeys?: DecryptedKey[]) => boolean;
}

export interface SerializableCryptoContext<S> {
    serialize: () => SerializedCryptoContext<S>;
}

export type SerializedCryptoContext<T> = T extends SerializableCryptoContext<infer U>
    ? SerializedCryptoContext<U>
    : T extends Uint8Array
    ? string
    : T extends Map<infer K, infer U>
    ? (readonly [K, SerializedCryptoContext<U>])[]
    : T extends (infer U)[]
    ? SerializedCryptoContext<U>[]
    : T extends {}
    ? { [K in keyof T as T[K] extends CryptoKey ? never : K]: SerializedCryptoContext<T[K]> }
    : T;
