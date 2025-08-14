import {
    type Base64,
    type ConversationId,
    type MessageId,
    type SerializedAttachment,
    type SerializedConversation,
    type SerializedMessage,
    type SerializedSpace,
    type SpaceId,
} from '../types';

// prettier-ignore
export type MessageFromApi = {
    ID?: unknown;              // Expecting type MessageId
    ConversationID?: unknown;  // Expecting type ConversationId
    CreateTime?: unknown;      // Expecting a serialized Date
    Role?: unknown;            // Expecting type Role
    ParentID?: unknown;        // Expecting type MessageId
    Status?: number;           // Expecting type Status | undefined
    Encrypted?: unknown;       // Expecting Base64-encoded data | undefined
    MessageTag?: unknown;      // Expecting type MessageTag
};

// prettier-ignore
export type SpaceFromApi = {
    ID?: any;                // Expecting type SpaceId
    CreateTime?: any;        // Expecting a serialized Date
    DeleteTime?: any;        // Expecting a serialized Date | null | undefined
    Encrypted?: any;         // Expecting Base64-encoded data | undefined
    SpaceKey?: any;          // Expecting Base64-encoded data
    Conversations?: any;     // Expecting type ConversationFromApi[] | null
    SpaceTag?: unknown;      // Expecting type SpaceTag
    Assets?: any;            // Expecting type AssetFromApi[] | null
};

// prettier-ignore
export type ConversationFromApi = {
    ID?: unknown;               // Expecting type ConversationId
    SpaceID?: unknown;          // Expecting type SpaceId
    CreateTime?: unknown;       // Expecting a serialized Date
    DeleteTime?: unknown;       // Expecting a serialized Date | null | undefined
    IsStarred?: unknown;        // Expecting type boolean | undefined
    Encrypted?: unknown;        // Expecting Base64-encoded data | undefined
    Messages?: unknown;         // Expecting Message[] | undefined
    ConversationTag?: unknown;  // Expecting type ConversationTag
};

// prettier-ignore
export type AssetFromApi = {
    ID?: unknown;              // Expecting type MessageId
    SpaceID?: unknown;         // Expecting type ConversationId
    AssetTag?: unknown;        // Expecting type AssetTag
    CreateTime?: unknown;      // Expecting a serialized Date
    DeleteTime?: unknown;      // Expecting a serialized Date | null
    Encrypted?: unknown;       // Expecting Base64-encoded data | undefined | null
};

// prettier-ignore
export type MasterKeyFromApi = {
    ID?: unknown;            // Expecting type string
    IsLatest?: unknown,      // Expecting boolean
    Version?: unknown,       // Expecting positive integer
    CreateTime?: unknown;    // Expecting a serialized Date
    MasterKey?: unknown;     // Expecting string (PGP armor)
};

export type UserId = string;

export const ResourceTypes = ['space', 'conversation', 'message', 'attachment'] as const;
export type ResourceType = (typeof ResourceTypes)[number];

export type LocalId = string;
export type RemoteId = string;
export type IdMapEntry = { remoteId: RemoteId; localId: LocalId; type: ResourceType };

// Tag is just a fancy word for "local id".
// The server has its own IDs, called "server ids", but for cryptographic reasons (AEAD encryption)
// we also store the local id on server. There, it is not called "local id", but "tag".
// It's nothing more than a terminology difference.
export type SpaceTag = LocalId;
export type ConversationTag = LocalId;
export type MessageTag = LocalId;
export type AssetTag = LocalId;

export type RemoteSpaceBase = SerializedSpace & {
    remoteId: RemoteId;
};
export type RemoteSpace = RemoteSpaceBase & { deleted: false };
export type RemoteDeletedSpace = Omit<RemoteSpaceBase, 'encrypted'> & { deleted: true };
export type RemoteConversationBase = SerializedConversation & {
    remoteId: RemoteId;
    remoteSpaceId: RemoteId;
};
export type RemoteDeletedConversation = Omit<RemoteConversationBase, 'encrypted'> & { deleted: true };
export type RemoteConversation = RemoteConversationBase & { deleted: false };
export type RemoteMessage = SerializedMessage & {
    remoteId: RemoteId;
    remoteConversationId: RemoteId;
    remoteParentId: RemoteId | undefined;
};
export type RemoteAssetBase = SerializedAttachment & {
    remoteId: RemoteId;
    remoteSpaceId: RemoteId;
};
export type RemoteAsset = RemoteAssetBase & { deleted: false };
export type RemoteDeletedAsset = Omit<RemoteAssetBase, 'encrypted'> & { deleted: true };

// Aliases for consistent naming with other resources
export type RemoteAttachment = RemoteAsset;
export type RemoteDeletedAttachment = RemoteDeletedAsset;

export enum RoleInt {
    User = 1,
    Assistant = 2,
}

export function isRoleInt(value: any): value is RoleInt {
    return value === RoleInt.User || value === RoleInt.Assistant;
}

export enum StatusInt {
    Failed = 1,
    Succeeded = 2,
}

export function isStatusInt(value: any): value is StatusInt {
    return value === StatusInt.Failed || value === StatusInt.Succeeded;
}

export type MessageToApi = {
    ID: RemoteId;
    ConversationID: ConversationId;
    Role: RoleInt;
    ParentId: RemoteId | undefined; // hack for buggy backend
    ParentID: RemoteId | undefined;
    Status: StatusInt | undefined;
    Encrypted?: Base64;
    MessageTag: MessageTag;
};

export type SpaceToApi = {
    ID: RemoteId;
    Encrypted?: Base64;
    SpaceKey: Base64;
    SpaceTag: SpaceTag;
};

export type ConversationToApi = {
    ID: RemoteId;
    SpaceID: RemoteId;
    IsStarred: boolean;
    Encrypted?: Base64;
    ConversationTag: ConversationTag;
};

export type AssetToApi = {
    ID: RemoteId;
    SpaceID: RemoteId;
    Encrypted?: Base64;
    AssetTag: AssetTag;
};

export type MasterKeyToApi = {
    MasterKey: Base64;
};

export type OmitId<T> = Omit<T, 'ID'>;
export type NewMessageToApi = OmitId<MessageToApi>;
export type NewConversationToApi = OmitId<ConversationToApi>;
export type NewSpaceToApi = OmitId<SpaceToApi>;
export type NewAssetToApi = OmitId<AssetToApi>;

export type GetSpaceRemote = {
    space: RemoteSpace | RemoteDeletedSpace;
    conversations: RemoteConversation[];
    deletedConversations: RemoteDeletedConversation[];
    assets: RemoteAsset[];
    deletedAssets: RemoteDeletedAsset[];
};
export type ListSpacesRemote = {
    spaces: Record<SpaceId, RemoteSpace>;
    conversations: Record<ConversationId, RemoteConversation>;
    deletedSpaces: Record<SpaceId, RemoteDeletedSpace>;
    deletedConversations: Record<ConversationId, RemoteDeletedConversation>;
};

export type GetConversationRemote = {
    conversation: RemoteConversation | RemoteDeletedConversation;
    messages: RemoteMessage[];
};

export type ListConversationsRemote = {
    messages: RemoteMessage[];
    conversations: RemoteConversation[];
    deletedConversations: RemoteDeletedConversation[];
};

export type ListAssetsRemote = {
    assets: RemoteAsset[];
    deletedAssets: RemoteDeletedAsset[];
};

// Remote worker requests
export type PostSpaceRequest = {
    type: 'post_space';
    space: SerializedSpace;
};
export type PostConversationRequest = {
    type: 'post_conversation';
    conversation: SerializedConversation;
};
export type PostMessageRequest = {
    type: 'post_message';
    message: SerializedMessage;
};
export type PutConversationRequest = {
    type: 'put_conversation';
    conversation: SerializedConversation;
};
export type PutMessageRequest = {
    type: 'put_message';
    message: SerializedMessage;
};
export type ListSpacesRequest = {
    type: 'list_spaces';
};
export type ListSpacesResponse = {
    type: 'list_spaces';
    // listSpaces: ListSpaces;
    needsReload: boolean;
};
export type GetConversationRequest = {
    type: 'get_conversation';
    conversationId: ConversationId; // local id
};
export type GetConversationResponse = {
    type: 'get_conversation';
    // getConversation: GetConversation;
    needsReload: boolean;
};
export type DeleteConversationRequest = {
    type: 'delete_conversation';
    conversationId: ConversationId; // local id
};
export type GetMessageRequest = {
    type: 'get_message';
    messageId: MessageId; // local id
};
export type InitRequest = {
    type: 'init';
    masterKey: Base64;
    origin: string;
    uid: string;
    userId: string | undefined;
};
export type InitResponse = {
    type: 'init';
};
// prettier-ignore
export type WorkerRequest =
    | PostSpaceRequest
    | PostConversationRequest
    | PostMessageRequest
    | PutConversationRequest
    | PutMessageRequest
    | ListSpacesRequest
    | GetConversationRequest
    | DeleteConversationRequest
    | GetMessageRequest
    | InitRequest
    ;
// prettier-ignore
export type WorkerResponse =
    | InitResponse
    | ListSpacesResponse
    | GetConversationResponse
    ;
