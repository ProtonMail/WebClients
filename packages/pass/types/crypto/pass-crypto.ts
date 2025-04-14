import type { CreateSecureLinkData, FileDescriptorProcessResult } from '@proton/pass/lib/crypto/processes';
import type {
    EncodedItemKeyRotation,
    InviteAcceptRequest,
    InviteCreateRequest,
    ItemCreateRequest,
    ItemFileOutput,
    ItemMoveIndividualToShareRequest,
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

import type { FileID } from '@proton/pass/types/data';
import type {
    InviteTargetKey,
    ItemId,
    ItemKey,
    ItemShareKey,
    OpenedItem,
    Rotation,
    ShareId,
    TypedOpenedShare,
    VaultShareKey,
} from './pass-types';

export type PassCryptoManagerContext = {
    user?: User;
    userKeys?: DecryptedKey[];
    addresses?: Address[];
    primaryUserKey?: DecryptedKey;
    primaryAddress?: Address;
    shareManagers: Map<ShareId, ShareManager>;
    fileKeys: Map<string, Uint8Array>;
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
    getShareManager: (shareId: ShareId) => ShareManager;
    createVault: (content: Uint8Array) => Promise<VaultCreateRequest>;
    updateVault: (data: { shareId: ShareId; content: Uint8Array }) => Promise<VaultUpdateRequest>;
    canOpenShare: (shareId: ShareId) => boolean;
    openShare: <T extends ShareType = ShareType>(data: {
        encryptedShare: ShareGetResponse;
        shareKeys: ShareKeyResponse[];
    }) => Promise<MaybeNull<TypedOpenedShare<T>>>;
    updateShareKeys: (data: { shareId: ShareId; shareKeys: ShareKeyResponse[] }) => Promise<void>;
    removeShare: (shareId: ShareId) => void;
    openItem: (data: { shareId: ShareId; encryptedItem: ItemRevisionContentsResponse }) => Promise<OpenedItem>;
    createItem: (data: { shareId: ShareId; content: Uint8Array }) => Promise<ItemCreateRequest>;
    updateItem: (data: { content: Uint8Array; lastRevision: number; itemKey: ItemKey }) => Promise<ItemUpdateRequest>;
    moveItem: (data: {
        encryptedItemKeys: EncodedItemKeyRotation[];
        itemId: ItemId;
        shareId: ShareId;
        targetShareId: string;
    }) => Promise<ItemMoveIndividualToShareRequest>;
    createInvite: (data: {
        email: string;
        invitedPublicKey: string;
        role: ShareRole;
        shareId: ShareId;
        targetKeys: InviteTargetKey[];
        itemId?: ItemId;
    }) => Promise<InviteCreateRequest>;
    promoteInvite: (data: { shareId: ShareId; invitedPublicKey: string }) => Promise<NewUserInvitePromoteRequest>;
    createNewUserInvite: (data: {
        email: string;
        role: ShareRole;
        shareId: ShareId;
        itemId?: ItemId;
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

    createFileDescriptor: (data: {
        encryptionVersion: number;
        fileID?: FileID;
        metadata: Uint8Array;
        pending: boolean;
        shareId: ShareId;
    }) => Promise<FileDescriptorProcessResult>;
    openFileDescriptor: (data: { file: ItemFileOutput; itemKey: ItemKey; shareId: ShareId }) => Promise<Uint8Array>;
    createFileChunk: (data: {
        chunk: Blob;
        chunkIndex: number;
        encryptionVersion: number;
        fileID: FileID;
        shareId: ShareId;
        totalChunks: number;
    }) => Promise<Blob>;
    openFileChunk: (data: {
        chunk: Uint8Array;
        chunkIndex: number;
        encryptionVersion: number;
        fileID: FileID;
        shareId: ShareId;
        totalChunks: number;
    }) => Promise<Uint8Array>;
    registerFileKey: (data: { fileKey: Uint8Array; fileID: FileID; shareId: ShareId; pending: boolean }) => void;
    unregisterFileKey: (data: { fileID: FileID; shareId: ShareId; pending: boolean }) => void;
    getFileKey: (data: { shareId: ShareId; fileID: FileID; pending: boolean }) => Uint8Array;
    encryptFileKey: (data: {
        fileID: FileID;
        itemKey: ItemKey;
        shareId: ShareId;
        pending: boolean;
    }) => Promise<Uint8Array>;

    createSecureLink: (data: { itemKey: ItemKey; shareId?: string }) => Promise<CreateSecureLinkData>;
    openSecureLink: (data: { linkKey: string; publicLinkContent: PublicLinkGetContentResponse }) => Promise<Uint8Array>;
    openLinkKey: (data: {
        encryptedLinkKey: string;
        linkKeyShareKeyRotation: number;
        shareId: ShareId;
        itemId: ItemId;
        linkKeyEncryptedWithItemKey: boolean;
    }) => Promise<Uint8Array>;
    openItemKey: (data: { encryptedItemKey: EncodedItemKeyRotation; shareId: ShareId }) => Promise<ItemKey>;
    openSecureLinkFileDescriptor: (data: {
        encryptedFileKey: string;
        encryptedItemKey: string;
        encryptedMetadata: string;
        encryptionVersion: number;
        fileID: FileID;
        linkKey: string;
    }) => Promise<Uint8Array>;
}

export type ShareContext<T extends ShareType = ShareType> = {
    share: TypedOpenedShare<T>;
    latestRotation: Rotation;
    vaultKeys: Map<Rotation, VaultShareKey>;
    itemKeys: Map<Rotation, ItemShareKey>;
};

export interface ShareManager<T extends ShareType = ShareType> extends SerializableCryptoContext<ShareContext> {
    getShare: () => TypedOpenedShare<T>;
    setShare: (share: TypedOpenedShare<T>) => void;
    getType: () => ShareType;

    isActive: (userKeys?: DecryptedKey[]) => boolean;

    getLatestRotation: () => Rotation;
    setLatestRotation: (rotation: Rotation) => void;

    hasVaultShareKey: (rotation: Rotation) => boolean;
    getVaultShareKey: (rotation: Rotation) => VaultShareKey;
    getVaultShareKeys: () => VaultShareKey[];
    addVaultShareKey: (vaultShareKey: VaultShareKey) => void;

    hasItemShareKey: (rotation: Rotation) => boolean;
    getItemShareKey: (rotation: Rotation) => ItemShareKey;
    getItemShareKeys: () => ItemShareKey[];
    addItemShareKey: (itemShareKey: ItemShareKey) => void;
}

export interface SerializableCryptoContext<S> {
    serialize: () => SerializedCryptoContext<S>;
}

export type SerializedCryptoContext<T> =
    T extends SerializableCryptoContext<infer U> ? SerializedCryptoContext<U>
    : T extends Uint8Array ? string
    : T extends Map<infer K, infer U> ? (readonly [K, SerializedCryptoContext<U>])[]
    : T extends (infer U)[] ? SerializedCryptoContext<U>[]
    : T extends {} ? { [K in keyof T as T[K] extends CryptoKey ? never : K]: SerializedCryptoContext<T[K]> }
    : T;
