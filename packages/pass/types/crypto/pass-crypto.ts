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

import type {
    InviteTargetKey,
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
    updateItem: (data: { content: Uint8Array; lastRevision: number; itemKey: ItemKey }) => Promise<ItemUpdateRequest>;
    moveItem: (data: {
        encryptedItemKeys: EncodedItemKeyRotation[];
        itemId: string;
        shareId: string;
        targetShareId: string;
    }) => Promise<ItemMoveIndividualToShareRequest>;
    createInvite: (data: {
        email: string;
        invitedPublicKey: string;
        role: ShareRole;
        shareId: string;
        targetKeys: InviteTargetKey[];
        itemId?: string;
    }) => Promise<InviteCreateRequest>;
    promoteInvite: (data: { shareId: string; invitedPublicKey: string }) => Promise<NewUserInvitePromoteRequest>;
    createNewUserInvite: (data: {
        email: string;
        role: ShareRole;
        shareId: string;
        itemId?: string;
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

    createFileDescriptor: (data: { metadata: Uint8Array; fileID?: string }) => Promise<FileDescriptorProcessResult>;
    openFileDescriptor: (data: { file: ItemFileOutput; itemKey: ItemKey }) => Promise<Uint8Array>;
    createFileChunk: (data: { chunk: Blob; fileID: string }) => Promise<Blob>;
    openFileChunk: (data: { chunk: Uint8Array; fileID: string }) => Promise<Uint8Array>;
    registerFileKey: (data: { fileKey: Uint8Array; fileID: string }) => void;
    getFileKey: (data: { fileID: string; itemKey: ItemKey }) => Promise<Uint8Array>;

    createSecureLink: (data: { itemKey: ItemKey; shareId?: string }) => Promise<CreateSecureLinkData>;
    openSecureLink: (data: { linkKey: string; publicLinkContent: PublicLinkGetContentResponse }) => Promise<Uint8Array>;
    openLinkKey: (data: {
        encryptedLinkKey: string;
        linkKeyShareKeyRotation: number;
        shareId: string;
        itemId: string;
        linkKeyEncryptedWithItemKey: boolean;
    }) => Promise<Uint8Array>;
    openItemKey: (data: { encryptedItemKey: EncodedItemKeyRotation; shareId: string }) => Promise<ItemKey>;
    openSecureLinkFileDescriptor: (data: {
        encryptedItemKey: string;
        encryptedFileKey: string;
        encryptedMetadata: string;
        fileID: string;
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
