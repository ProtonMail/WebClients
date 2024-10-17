import type { CreateSecureLinkData } from '@proton/pass/lib/crypto/processes';
import type {
    InviteAcceptRequest,
    InviteCreateRequest,
    ItemCreateRequest,
    ItemKeyResponse,
    ItemLatestKeyResponse,
    ItemMoveSingleToShareRequest,
    ItemRevisionContentsResponse,
    ItemUpdateRequest,
    KeyRotationKeyPair,
    NewUserInviteCreateRequest,
    NewUserInvitePromoteRequest,
    PublicLinkGetContentResponse,
    ShareGetResponse,
    ShareKeyResponse,
    VaultCreateRequest,
    VaultUpdateRequest,
} from '@proton/pass/types/api';
import type { ShareRole, ShareType } from '@proton/pass/types/data/shares';
import type { MaybeNull } from '@proton/pass/types/utils';
import type { Address, DecryptedAddressKey, DecryptedKey, User } from '@proton/shared/lib/interfaces';

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
    ready: boolean;
    getDecryptedAddressKeys: (addressId: string) => Promise<DecryptedAddressKey[]>;
    getContext: () => PassCryptoManagerContext;
    hydrate: (options: {
        addresses: Address[];
        keyPassword: string;
        snapshot?: SerializedCryptoContext<PassCryptoSnapshot>;
        user: User;
        clear?: boolean;
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
        content: Uint8Array;
        lastRevision: number;
        latestItemKey: ItemKeyResponse;
        shareId: string;
    }) => Promise<ItemUpdateRequest>;
    moveItem: (data: { destinationShareId: string; content: Uint8Array }) => Promise<ItemMoveSingleToShareRequest>;
    createVaultInvite: (data: {
        email: string;
        invitedPublicKey: string;
        role: ShareRole;
        shareId: string;
    }) => Promise<InviteCreateRequest>;
    promoteInvite: (data: { shareId: string; invitedPublicKey: string }) => Promise<NewUserInvitePromoteRequest>;
    createNewUserVaultInvite: (data: {
        email: string;
        role: ShareRole;
        shareId: string;
    }) => Promise<NewUserInviteCreateRequest>;
    acceptVaultInvite: (data: {
        invitedAddressId: string;
        inviteKeys: KeyRotationKeyPair[];
        inviterPublicKeys: string[];
    }) => Promise<InviteAcceptRequest>;
    readVaultInvite: (data: {
        encryptedVaultContent: string;
        invitedAddressId: string;
        inviteKey: KeyRotationKeyPair;
        inviterPublicKeys: string[];
    }) => Promise<Uint8Array>;
    createSecureLink: (data: {
        shareId: string;
        latestItemKey: ItemLatestKeyResponse;
    }) => Promise<CreateSecureLinkData>;
    openSecureLink: (data: { linkKey: string; publicLinkContent: PublicLinkGetContentResponse }) => Promise<Uint8Array>;
    openLinkKey: (data: {
        encryptedLinkKey: string;
        linkKeyShareKeyRotation: number;
        shareId: string;
    }) => Promise<Uint8Array>;
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
    getVaultKeys: () => VaultKey[];
    addVaultKey: (vaultKey: VaultKey) => void;
    isActive: (userKeys?: DecryptedKey[]) => boolean;
}

export interface SerializableCryptoContext<S> {
    serialize: () => SerializedCryptoContext<S>;
}

export type SerializedCryptoContext<T> =
    T extends SerializableCryptoContext<infer U>
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
