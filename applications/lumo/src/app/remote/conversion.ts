import isNil from 'lodash/isNil';

import type { SerializedAttachment } from '../types';
import {
    type Base64,
    type EncryptedData,
    type MasterKey,
    type MessageId,
    Role,
    type SerializedConversation,
    type SerializedMessage,
    type SerializedSpace,
    type SpaceId,
    type Status,
    isOldEncryptedData,
    isRemoteId,
} from '../types';
import { mapify } from '../util/collections';
import { topoSortMessagesFromApi } from '../util/sorting';
import type {
    AssetFromApi,
    ConversationTag,
    ListAssetsRemote,
    LocalId,
    MasterKeyFromApi,
    MasterKeyToApi,
    NewAssetToApi,
    RemoteAsset,
    RemoteConversation,
    RemoteDeletedAsset,
    RemoteDeletedConversation,
    SpaceTag,
} from './types';
import {
    type ConversationFromApi,
    type ConversationToApi,
    type GetConversationRemote,
    type GetSpaceRemote,
    type ListConversationsRemote,
    type ListSpacesRemote,
    type MessageFromApi,
    type MessageToApi,
    type NewConversationToApi,
    type NewMessageToApi,
    type NewSpaceToApi,
    type RemoteId,
    type RemoteMessage,
    RoleInt,
    type SpaceFromApi,
    type SpaceToApi,
    StatusInt,
    isRoleInt,
    isStatusInt,
} from './types';

const isValidBoolean = (b: unknown): b is boolean => typeof b === 'boolean';
const isValidString = (str: unknown): str is string => typeof str === 'string' && str !== '';
const isValidBase64 = (str: unknown): str is Base64 => typeof str === 'string' && /^[A-Za-z0-9+/]*={0,2}$/.test(str);
const isValidDateString = (dateStr: unknown): dateStr is string => {
    if (!isValidString(dateStr)) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
};

const validateEncryptedField = (encrypted: unknown): EncryptedData => {
    if (!isValidBase64(encrypted)) throw new Error('Invalid `encrypted` field: expected base64');
    // min encrypted size for AES-GCM is 28 bytes = 38 base64 chars:
    // 12 IV bytes + 0 bytes for ciphertext + 16 bytes for AD
    if (encrypted.length <= 38) throw new Error('Invalid `encrypted` field: length too short (expected 38+ chars)');
    return encrypted as Base64;
};

export function convertSpaceFromApi(input: unknown): GetSpaceRemote {
    if (typeof input !== 'object' || input === null) throw new Error('Invalid input: expected object');
    const { ID, CreateTime, DeleteTime, Encrypted, SpaceKey, SpaceTag, Conversations, Assets } = input as SpaceFromApi;
    if (!isRemoteId(ID)) throw new Error('Invalid ID: expected non-empty string');
    if (!isValidDateString(CreateTime)) throw new Error('Invalid CreateTime: expected Date');
    if (!isValidDateString(DeleteTime) && DeleteTime !== undefined && DeleteTime !== null) {
        throw new Error('Invalid DeleteTime: expected Date');
    }
    if (!isValidBase64(SpaceKey)) throw new Error('Invalid SpaceKey: expected Base64');
    if (!isValidString(SpaceTag)) throw new Error('Invalid SpaceTag: expected string');
    const { conversations, deletedConversations } = convertConversationsFromApi(Conversations, SpaceTag);
    const { assets, deletedAssets } = convertAssetsFromApi(Assets, SpaceTag);
    const deleted = !!DeleteTime;
    const space = {
        remoteId: ID as SpaceId,
        id: SpaceTag as LocalId,
        createdAt: new Date(CreateTime as string).toISOString(),
        wrappedSpaceKey: SpaceKey as Base64,
    };
    if (deleted) {
        // If the space is deleted, we consider all child conversations/assets deleted too,
        // even if they're not explicitly marked deleted themselves.
        const pretendDeletedConversation = ({ encrypted, ...rest }: RemoteConversation): RemoteDeletedConversation => ({
            ...rest,
            deleted: true,
        });
        const pretendDeletedAsset = ({ encrypted, ...rest }: RemoteAsset): RemoteDeletedAsset => ({
            ...rest,
            deleted: true,
        });
        return {
            space: { ...space, deleted: true },
            conversations: [],
            deletedConversations: [...conversations.map(pretendDeletedConversation), ...deletedConversations],
            assets: [],
            deletedAssets: [...assets.map(pretendDeletedAsset), ...deletedAssets],
        };
    } else {
        return {
            space: { ...space, deleted: false, encrypted: validateEncryptedField(Encrypted) },
            conversations,
            deletedConversations,
            assets,
            deletedAssets,
        };
    }
}

export function convertSpacesFromApi(input: unknown): ListSpacesRemote {
    if (typeof input !== 'object' || input === null) throw new Error('Invalid input: expected object');
    if (!Array.isArray(input)) throw new Error('Invalid input: expected array');
    const zero: ListSpacesRemote = {
        spaces: {},
        conversations: {},
        deletedSpaces: {},
        deletedConversations: {},
    };
    return input.reduce((acc: ListSpacesRemote, item: unknown): ListSpacesRemote => {
        const { space, conversations, deletedConversations } = convertSpaceFromApi(item);
        const conversationMap = mapify(conversations);
        const deletedConversationMap = mapify(deletedConversations);
        const base = {
            conversations: {
                ...acc.conversations,
                ...conversationMap,
            },
            deletedConversations: {
                ...acc.deletedConversations,
                ...deletedConversationMap,
            },
            spaces: acc.spaces,
            deletedSpaces: acc.deletedSpaces,
        };
        if (space.deleted) {
            return { ...base, deletedSpaces: { ...acc.deletedSpaces, [space.id]: space } };
        } else {
            return { ...base, spaces: { ...acc.spaces, [space.id]: space } };
        }
    }, zero);
}

export function convertConversationFromApi(input: unknown, spaceTag: SpaceTag): GetConversationRemote {
    if (typeof input !== 'object' || input === null) throw new Error('Invalid input');
    const { ID, SpaceID, CreateTime, DeleteTime, IsStarred, Encrypted, Messages, ConversationTag } =
        input as ConversationFromApi;
    if (!isRemoteId(ID)) throw new Error('Invalid ID: expected non-empty string');
    if (!isRemoteId(SpaceID)) throw new Error('Invalid SpaceID: expected non-empty string');
    if (!isValidDateString(CreateTime)) throw new Error('Invalid CreateTime: expected serialized Date');
    if (!isValidDateString(DeleteTime) && !isNil(DeleteTime)) {
        throw new Error('Invalid DeleteTime: expected serialized Date');
    }
    if (!isValidString(ConversationTag)) throw new Error('Invalid ConversationTag: expected string');
    if (!isNil(IsStarred) && !isValidBoolean(IsStarred)) throw new Error('Invalid IsStarred: expected boolean');
    if (!isNil(Messages) && !Array.isArray(Messages)) throw new Error('Invalid Messages: expected array');
    const deleted = !!DeleteTime;
    const base = {
        id: ConversationTag as LocalId,
        spaceId: spaceTag as LocalId,
        remoteId: ID as RemoteId,
        remoteSpaceId: SpaceID as RemoteId,
        createdAt: new Date(CreateTime as string).toISOString(),
        starred: IsStarred ?? false,
    };
    if (deleted) {
        return {
            conversation: {
                ...base,
                deleted: true,
            } satisfies RemoteDeletedConversation,
            messages: [],
        };
    } else {
        return {
            conversation: {
                ...base,
                encrypted: validateEncryptedField(Encrypted),
                deleted: false,
            } satisfies RemoteConversation,
            messages: convertMessagesFromApi(Messages ?? [], ConversationTag as ConversationTag, ID),
        };
    }
}

export function convertConversationsFromApi(input: unknown, spaceTag: SpaceTag): ListConversationsRemote {
    const zero: ListConversationsRemote = {
        messages: <RemoteMessage[]>[],
        conversations: <RemoteConversation[]>[],
        deletedConversations: <RemoteDeletedConversation[]>[],
    };
    if (input === null) {
        return zero;
    }
    if (!Array.isArray(input)) throw new Error('Invalid input: expected array');
    return input.reduce((acc: ListConversationsRemote, item): ListConversationsRemote => {
        const { conversation, messages } = convertConversationFromApi(item, spaceTag);
        const deleted = conversation.deleted;
        return {
            ...acc,
            messages: [...acc.messages, ...messages],
            conversations: deleted ? acc.conversations : [...acc.conversations, conversation],
            deletedConversations: deleted ? [...acc.deletedConversations, conversation] : acc.deletedConversations,
        };
    }, zero);
}

export function convertAssetFromApi(input: unknown, spaceTag: SpaceTag): RemoteAsset | RemoteDeletedAsset {
    if (typeof input !== 'object' || input === null) throw new Error('Invalid input: expected object');
    const { ID, AssetTag, CreateTime, DeleteTime, Encrypted, SpaceID } = input as AssetFromApi;
    if (!isRemoteId(ID)) throw new Error('Invalid ID: expected non-empty string');
    if (!isRemoteId(SpaceID)) throw new Error('Invalid SpaceID');
    if (!isValidString(AssetTag)) throw new Error('Invalid AssetTag: expected string');
    if (!isValidDateString(CreateTime)) throw new Error('Invalid CreateTime: expected serialized Date');
    if (!isValidDateString(DeleteTime) && !isNil(DeleteTime)) {
        throw new Error('Invalid DeleteTime: expected serialized Date');
    }
    const deleted = !!DeleteTime;
    const base = {
        id: AssetTag as LocalId,
        spaceId: spaceTag as LocalId,
        remoteId: ID,
        remoteSpaceId: SpaceID as RemoteId,
        uploadedAt: new Date(CreateTime as string).toISOString(),
    };
    if (deleted) {
        return {
            ...base,
            deleted: true,
        };
    } else {
        return {
            ...base,
            deleted: false,
            encrypted: isNil(Encrypted) ? undefined : validateEncryptedField(Encrypted),
        };
    }
}

export function convertAssetsFromApi(input: unknown, spaceTag: SpaceTag): ListAssetsRemote {
    const zero: ListAssetsRemote = {
        assets: <RemoteAsset[]>[],
        deletedAssets: <RemoteDeletedAsset[]>[],
    };
    if (input === null) {
        return zero;
    }
    if (!Array.isArray(input)) throw new Error('Invalid input: expected array');
    return input.reduce((acc: ListAssetsRemote, item): ListAssetsRemote => {
        const asset = convertAssetFromApi(item, spaceTag);
        const deleted = asset.deleted;
        return {
            ...acc,
            assets: deleted ? acc.assets : [...acc.assets, asset],
            deletedAssets: deleted ? [...acc.deletedAssets, asset] : acc.deletedAssets,
        };
    }, zero);
}

export function convertMessageFromApi(
    input: unknown,
    conversationTag: ConversationTag,
    parentId: MessageId | undefined,
    remoteConversationId: RemoteId
): RemoteMessage {
    if (typeof input !== 'object' || input === null) throw new Error('Invalid input: expected object');
    const { ID, ConversationID, CreateTime, Role, ParentID, Status, Encrypted, MessageTag } = input as MessageFromApi;
    if (!isRemoteId(ID)) throw new Error('Invalid id: expected non-empty string');
    if (remoteConversationId === undefined) {
        if (!isRemoteId(ConversationID)) throw new Error('Invalid conversation_id: expected non-empty string');
    }
    if (!isValidDateString(CreateTime)) throw new Error('Invalid created_at: expected serialized Date');
    if (!isRoleInt(Role)) throw new Error('Invalid role');
    if (!isValidString(MessageTag)) throw new Error('Invalid tag: expected string');
    if (!isNil(Status) && !isStatusInt(Status)) throw new Error('Invalid status');
    if (!isNil(ParentID) && !isRemoteId(ParentID)) throw new Error('Invalid parent_id');
    return {
        id: MessageTag as LocalId,
        conversationId: conversationTag as LocalId,
        parentId: parentId as LocalId | undefined,
        remoteId: ID,
        remoteParentId: (ParentID ?? undefined) as RemoteId | undefined,
        remoteConversationId: (ConversationID ?? remoteConversationId) as RemoteId,
        createdAt: new Date(CreateTime as string).toISOString(),
        role: convertRoleFromApi(Role) as Role,
        status: ((Status && convertStatusFromApi(Status)) ?? undefined) as Status | undefined,
        encrypted: isNil(Encrypted) ? undefined : validateEncryptedField(Encrypted),
    };
}

export function convertMessagesFromApi(
    input: unknown,
    conversationTag: ConversationTag,
    remoteConversationId: RemoteId
): RemoteMessage[] {
    if (!Array.isArray(input)) throw new Error('Invalid input: expected array');
    const messagesFromApi = input as MessageFromApi[];
    const sorted = topoSortMessagesFromApi(messagesFromApi);
    const map: Record<RemoteId, RemoteMessage> = {};
    for (const m of sorted) {
        const parentRemoteId = (m?.ParentID ?? undefined) as string | undefined;
        const parentId = (parentRemoteId && map[parentRemoteId]?.id) ?? undefined;
        const convertedMessage = convertMessageFromApi(m, conversationTag, parentId, remoteConversationId);
        map[convertedMessage.remoteId] = convertedMessage;
    }
    return Object.values(map);
}

export function convertMessageToApi(
    message: SerializedMessage,
    remoteId: RemoteId,
    remoteConversationId: RemoteId,
    remoteParentId: RemoteId | undefined
): MessageToApi {
    const newMessageToApi = convertNewMessageToApi(message, remoteConversationId, remoteParentId);
    return {
        ID: remoteId,
        ...newMessageToApi,
    };
}

function ensureConcat(encrypted: EncryptedData | undefined): Base64 | undefined;
function ensureConcat(encrypted: EncryptedData): Base64;
function ensureConcat(encrypted: undefined): undefined;
function ensureConcat(encrypted: EncryptedData | undefined): Base64 | undefined {
    return isOldEncryptedData(encrypted) ? `${encrypted.iv}${encrypted.data}` : encrypted;
}

export function convertNewMessageToApi(
    message: SerializedMessage,
    remoteConversationId: RemoteId,
    remoteParentId: RemoteId | undefined
): NewMessageToApi {
    const { role, placeholder, status, encrypted } = message;
    if (placeholder) {
        console.warn(
            'Preparing to send a message with placeholder: true. Consider filtering out placeholder messages.'
        );
    }
    const encryptedConcat = ensureConcat(encrypted);
    return {
        ParentID: remoteParentId,
        ParentId: remoteParentId, // hack for buggy backend
        ConversationID: remoteConversationId,
        MessageTag: message.id,
        Role: convertRoleToApi(role),
        Status: convertStatusToApi(status ?? (role === Role.Assistant ? 'succeeded' : 'failed')),
        Encrypted: encryptedConcat,
    };
}

export function convertConversationToApi(
    conversation: SerializedConversation,
    remoteId: RemoteId,
    remoteSpaceId: RemoteId
): ConversationToApi {
    const newConversationToApi = convertNewConversationToApi(conversation, remoteSpaceId);
    return {
        ID: remoteId,
        ...newConversationToApi,
    };
}

export function convertNewConversationToApi(
    conversation: SerializedConversation,
    remoteSpaceId: RemoteId
): NewConversationToApi {
    const { id, starred, encrypted } = conversation;
    const encryptedConcat = ensureConcat(encrypted);
    return {
        SpaceID: remoteSpaceId,
        IsStarred: starred ?? false,
        Encrypted: encryptedConcat,
        ConversationTag: id,
    };
}

export function convertNewSpaceToApi(space: SerializedSpace): NewSpaceToApi {
    const { id, wrappedSpaceKey, encrypted } = space;
    if (!wrappedSpaceKey) {
        throw new Error("this space has no space key, which means it was deleted, so we don't push it");
    }
    const encryptedConcat = ensureConcat(encrypted);
    return {
        SpaceKey: wrappedSpaceKey,
        SpaceTag: id,
        Encrypted: encryptedConcat,
    };
}

export function convertSpaceToApi(space: SerializedSpace): SpaceToApi {
    const { id } = space;
    return {
        ID: id,
        ...convertNewSpaceToApi(space),
    };
}

export function convertNewAttachmentToApi(attachment: SerializedAttachment, remoteSpaceId: RemoteId): NewAssetToApi {
    const { id, encrypted } = attachment;
    const encryptedConcat = ensureConcat(encrypted);
    return {
        SpaceID: remoteSpaceId,
        Encrypted: encryptedConcat,
        AssetTag: id,
    };
}

export function convertRoleToApi(role: Role): RoleInt {
    switch (role) {
        case 'user':
            return RoleInt.User;
        case 'assistant':
            return RoleInt.Assistant;
        case 'system':
            throw new Error('Role "system" is not meant to be persisted to API');
        default:
            throw new Error(`Unknown role "${role}"`);
    }
}

export function convertStatusToApi(status: Status): StatusInt {
    switch (status) {
        case 'failed':
            return StatusInt.Failed;
        case 'succeeded':
            return StatusInt.Succeeded;
        default:
            throw new Error(`Unknown status "${status}"`);
    }
}

export function convertRoleFromApi(roleInt: RoleInt): Role {
    switch (roleInt) {
        case RoleInt.User:
            return Role.User;
        case RoleInt.Assistant:
            return Role.Assistant;
        default:
            throw new Error(`Unknown RoleInt ${roleInt}`);
    }
}

export function convertStatusFromApi(statusInt: StatusInt): Status {
    switch (statusInt) {
        case StatusInt.Succeeded:
            return 'succeeded';
        case StatusInt.Failed:
            return 'failed';
        default:
            throw new Error(`Unknown StatusInt ${statusInt}`);
    }
}

export function convertMasterKeyFromApi(masterKeyFromApi: MasterKeyFromApi): MasterKey {
    const { ID, IsLatest, Version, CreateTime, MasterKey } = masterKeyFromApi;
    if (!isValidString(ID)) throw new Error('Invalid ID: expected non-empty string');
    if (!isValidBoolean(IsLatest)) throw new Error('Invalid IsLatest: expected boolean');
    if (typeof Version !== 'number' || Version <= 0) throw new Error('Invalid Version: expected positive integer');
    if (!isValidDateString(CreateTime)) throw new Error('Invalid CreateTime: expected serialized Date');
    if (!isValidString(MasterKey)) throw new Error('Invalid MasterKey: expected non-empty string');
    return {
        id: ID as string,
        isLatest: IsLatest as boolean,
        version: Version as number,
        createdAt: new Date(CreateTime as string).toISOString(),
        masterKey: MasterKey as string,
    };
}

export function convertMasterKeysFromApi(input: unknown): MasterKey[] {
    if (typeof input !== 'object' || input === null) throw new Error('Invalid input: expected object');
    if (!Array.isArray(input)) throw new Error('Invalid MasterKeys: expected array');
    return input.map(convertMasterKeyFromApi);
}

export function convertMasterKeyToApi(encryptedMasterKeyBase64: Base64): MasterKeyToApi {
    return {
        MasterKey: encryptedMasterKeyBase64,
    };
}
