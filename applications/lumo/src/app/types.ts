import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { deriveDataEncryptionKey } from './crypto';
import type { AesGcmCryptoKey } from './crypto/types';
import type { AttachmentMap } from './redux/slices/core/attachments';
import type { ConversationMap } from './redux/slices/core/conversations';
import type { MessageMap } from './redux/slices/core/messages';
import type { SpaceMap } from './redux/slices/core/spaces';

// *** Various string aliases ***
export type Base64 = string;
export type Armor = string;
export type AdString = string;

// *** Ids ***
export type Uuid = string;
export type SpaceId = Uuid;
export type ConversationId = Uuid;
export type MessageId = Uuid;
export type AttachmentId = Uuid;
export type RequestId = Uuid;

const UUID_RE = /^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/;

export const isRemoteId = (value: unknown): value is MessageId => typeof value === 'string' && value.length > 0;
export const isUuid = (value: unknown): value is Uuid => typeof value === 'string' && UUID_RE.test(value);
export const isMessageId = isUuid;
export const isConversationId = isUuid;
export const isSpaceId = isUuid;

// *** Status ***
export type Status = 'succeeded' | 'failed';

export function isStatus(value: any): value is Status {
    return value === 'succeeded' || value === 'failed';
}

// EncryptedData  represents a blob that contains encrypted data which we are in position to decrypt.
// Compatibility note: It is now represented by a single string `iv || data`,
// but in the past, it was { iv, data }, so our codepath needs to handle this too.
export type OldEncryptedData = { iv: Base64; data: Base64 };
export type EncryptedData = Base64 | OldEncryptedData;

export function isOldEncryptedData(obj: any): obj is OldEncryptedData {
    return typeof obj === 'object' && obj !== null && typeof obj.iv === 'string' && typeof obj.data === 'string';
}

export type Encrypted = {
    encrypted: EncryptedData; // JSON-encoded "priv" part of Message/Conversation/Space, encrypted with spaceKey
};

// *** Role ***

export enum Role {
    Assistant = 'assistant',
    User = 'user',
    System = 'system',
    ToolCall = 'tool_call',
    ToolResult = 'tool_result',
}

export function isRole(value: any): value is Role {
    return (
        value === Role.Assistant ||
        value === Role.User ||
        value === Role.System ||
        value === Role.ToolCall ||
        value === Role.ToolResult
    );
}

// *** Space ***

export type SpacePub = {
    id: SpaceId;
    createdAt: string; // date
    // todo: updatedAt (for sorting)
};

export type SpacePriv = {
    // todo: title and other metadata
    // do not remove
};

export type SpaceKeyClear = {
    spaceKey: Base64; // type: HkdfCryptoKey
};

export type SpaceKeyEnc = {
    wrappedSpaceKey: Base64; // AES-KW(SpaceKeyClear.spaceKey, masterKey)
};

export type NonDeleted = { deleted?: false | undefined };
export type Deleted = { deleted: true };
export type WithSpaceKey = SpaceKeyEnc;
export type WithoutSpaceKey = { wrappedSpaceKey?: never };
export type MaybeSpaceKey = (NonDeleted & WithSpaceKey) | (Deleted & WithoutSpaceKey);
export type LocalFlagsForSpace = Omit<LocalFlags, 'deleted'>;

export type Space = SpacePub & SpacePriv & SpaceKeyClear;
export type SerializedSpace = SpacePub & Partial<Encrypted> & MaybeSpaceKey & LocalFlagsForSpace;
export type DeletedSpace = SerializedSpace & Deleted;
export type SerializedSpaceMap = Record<SpaceId, SerializedSpace>;

export function isSpacePub(value: any): value is SpacePub {
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof value.id === 'string' &&
        typeof value.createdAt === 'string'
    );
}

export function isSpacePriv(value: any): value is SpacePriv {
    return typeof value === 'object' && value !== null;
}

export function isSpaceKeyClear(value: any): value is SpaceKeyClear {
    return typeof value === 'object' && value !== null && typeof value.spaceKey === 'string';
}

export function isSpaceKeyEnc(value: any): value is SpaceKeyEnc {
    return typeof value === 'object' && value !== null && typeof value.wrappedSpaceKey === 'string';
}

export function isDeletedSpace(value: any): value is DeletedSpace {
    return isSpacePub(value) && 'deleted' in value && value.deleted === true;
}

export function getSpacePriv(s: SpacePriv): SpacePriv {
    // Do not remove
    const {} = s;
    return {};
}

export function getSpacePub(s: SpacePub): SpacePub {
    const { id, createdAt } = s;
    return { id, createdAt };
}

export function getSpaceKeyClear(s: SpaceKeyClear): SpaceKeyClear {
    const { spaceKey } = s;
    return { spaceKey };
}

export function splitSpace(s: Space): {
    spacePriv: SpacePriv;
    spacePub: SpacePub;
    spaceKeyClear: SpaceKeyClear;
} {
    return {
        spacePriv: getSpacePriv(s),
        spacePub: getSpacePub(s),
        spaceKeyClear: getSpaceKeyClear(s),
    };
}

export function cleanSpace(space: Space): Space {
    const { id, createdAt, spaceKey } = space;
    return {
        id,
        createdAt,
        spaceKey,
    };
}

export function cleanSerializedSpace(space: SerializedSpace): SerializedSpace {
    const { id, createdAt, encrypted, wrappedSpaceKey, dirty, deleted } = space;

    // For deleted spaces, we ensure wrappedSpaceKey is not included
    if (deleted === true) {
        return {
            id,
            createdAt,
            ...(encrypted && { encrypted }),
            deleted: true,
            ...(dirty ? { dirty: true } : {}),
        };
    }

    // For active spaces, we require wrappedSpaceKey
    return {
        id,
        createdAt,
        ...(encrypted && { encrypted }),
        wrappedSpaceKey,
        ...(dirty ? { dirty: true } : {}),
    };
}

export async function getSpaceDek(s: SpaceKeyClear): Promise<AesGcmCryptoKey> {
    const spaceKeyBytes = base64StringToUint8Array(s.spaceKey);
    return deriveDataEncryptionKey(spaceKeyBytes);
}

// *** Message ***

export type MessagePub = {
    id: MessageId; // uuid
    createdAt: string; // date
    role: Role;
    parentId?: MessageId;
    conversationId: ConversationId;
    placeholder?: boolean;
    status?: Status;
};

export type MessagePriv = {
    content?: string;
    context?: string;
    attachments?: ShallowAttachment[]; // with empty .data and .markdown; full payloads are in IndexedDB
    toolCall?: string;
    toolResult?: string;
    contextFiles?: AttachmentId[]; // Files that were used in LLM context for this response
};

export type Message = MessagePub & MessagePriv;
export type SerializedMessage = MessagePub & Partial<Encrypted> & LocalFlags;
export type DeletedMessage = Omit<SerializedMessage, 'encrypted'> & Deleted;
export type SerializedMessageMap = Record<MessageId, SerializedMessage>;

export function isMessagePub(value: any): value is MessagePub {
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof value.id === 'string' &&
        typeof value.createdAt === 'string' &&
        isRole(value.role) &&
        (value.parentId === undefined || typeof value.parentId === 'string') &&
        typeof value.conversationId === 'string' &&
        (value.placeholder === undefined || typeof value.placeholder === 'boolean') &&
        (value.status === undefined || isStatus(value.status))
    );
}

export function isMessagePriv(value: any): value is MessagePriv {
    return (
        typeof value === 'object' &&
        value !== null &&
        (value.content === undefined || typeof value.content === 'string') &&
        (value.context === undefined || typeof value.context === 'string') &&
        (value.attachments === undefined ||
            (Array.isArray(value.attachments) && value.attachments.every((a: unknown) => isShallowAttachment(a)))) &&
        (value.toolCall === undefined || typeof value.toolCall === 'string') &&
        (value.toolResult === undefined || typeof value.toolResult === 'string') &&
        (value.contextFiles === undefined ||
            (Array.isArray(value.contextFiles) && value.contextFiles.every((id: unknown) => typeof id === 'string')))
    );
}

export function getMessagePub(message: MessagePub): MessagePub {
    const { id, createdAt, role, parentId, conversationId, placeholder, status } = message;
    return { id, createdAt, role, parentId, conversationId, placeholder, status };
}

export function getMessagePriv(m: MessagePriv): MessagePriv {
    const { content, context, attachments, toolCall, toolResult, contextFiles } = m;
    return { content, context, attachments, toolCall, toolResult, contextFiles };
}

export function splitMessage(m: Message): { messagePriv: MessagePriv; messagePub: MessagePub } {
    return {
        messagePriv: getMessagePriv(m),
        messagePub: getMessagePub(m),
    };
}

export function cleanMessage(message: Message): Message {
    const {
        id,
        createdAt,
        role,
        parentId,
        conversationId,
        placeholder,
        status,
        content,
        context,
        attachments,
        toolCall,
        toolResult,
        contextFiles,
    } = message;
    return {
        id,
        createdAt,
        role,
        ...(parentId !== undefined && { parentId }),
        conversationId,
        ...(placeholder !== undefined && { placeholder }),
        ...(status !== undefined && { status }),
        ...(content !== undefined && { content }),
        ...(context !== undefined && { context }),
        ...(attachments !== undefined && { attachments }),
        ...(toolCall !== undefined && { toolCall }),
        ...(toolResult !== undefined && { toolResult }),
        ...(contextFiles !== undefined && { contextFiles }),
    };
}

export function cleanSerializedMessage(message: SerializedMessage): SerializedMessage {
    const { id, createdAt, role, parentId, conversationId, placeholder, status, encrypted, dirty, deleted } = message;
    return {
        id,
        createdAt,
        role,
        ...(parentId !== undefined && { parentId }),
        conversationId,
        ...(placeholder && { placeholder }),
        ...(status !== undefined && { status }),
        ...(encrypted && { encrypted }),
        ...(dirty && { dirty }),
        ...(deleted && { deleted }),
    };
}

export function cleanSerializedAttachment(attachment: SerializedAttachment): SerializedAttachment {
    const { id, spaceId, mimeType, uploadedAt, rawBytes, processing, error, encrypted, dirty, deleted } =
        attachment;
    return {
        id,
        ...(spaceId !== undefined && { spaceId }),
        ...(mimeType !== undefined && { mimeType }),
        uploadedAt,
        ...(rawBytes !== undefined && { rawBytes }),
        ...(processing && { processing: true }),
        ...(error && { error: true }),
        ...(encrypted ? { encrypted } : {}),
        ...(dirty && { dirty: true }),
        ...(deleted && { deleted: true }),
    };
}

export function isEmptyMessagePriv(value: MessagePriv): boolean {
    return (
        value.content === undefined &&
        value.context === undefined &&
        value.attachments === undefined &&
        value.toolCall === undefined &&
        value.toolResult === undefined &&
        value.contextFiles === undefined
    );
}

export enum ConversationStatus {
    GENERATING = 'generating',
    COMPLETED = 'completed', // default
}

// *** Conversation ***

export type ConversationPub = {
    id: ConversationId;
    spaceId: SpaceId;
    createdAt: string; // date
    // todo: updatedAt (for sorting)
    starred?: boolean;
};

export type ConversationPriv = {
    title: string;
};

export type LocalFlags = {
    dirty?: boolean; // indicates persistence worker needs to sync it remotely
    deleted?: boolean; // indicates resource is soft-deleted locally (may or may not be persisted on server)
};

export type ConversationExtra = {
    status?: ConversationStatus;
    ghost?: boolean; // Mark conversations as ghost mode (transient)
};

export type Conversation = ConversationPub & ConversationPriv & ConversationExtra;
export type SerializedConversation = ConversationPub & Encrypted & LocalFlags;
export type DeletedConversation = Omit<SerializedConversation, 'encrypted'> & Deleted;
export type SerializedConversationMap = Record<ConversationId, SerializedConversation>;

export function isConversationPub(value: any): value is ConversationPub {
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof value.id === 'string' &&
        typeof value.spaceId === 'string' &&
        typeof value.createdAt === 'string' &&
        (value.starred === undefined || typeof value.starred === 'boolean')
    );
}

export function isConversationPriv(value: any): value is ConversationPriv {
    return typeof value === 'object' && value !== null && typeof value.title === 'string';
}

export function getConversationPub(c: ConversationPub): ConversationPub {
    const { id, spaceId, createdAt, starred } = c;
    return { id, spaceId, createdAt, starred };
}

export function getConversationPriv(c: ConversationPriv): ConversationPriv {
    const { title } = c;
    return { title };
}

export function splitConversation(c: Conversation): {
    conversationPriv: ConversationPriv;
    conversationPub: ConversationPub;
} {
    return {
        conversationPriv: getConversationPriv(c),
        conversationPub: getConversationPub(c),
    };
}

export function cleanConversation(conversation: Conversation): Conversation {
    const { id, spaceId, createdAt, title, starred, status, ghost } = conversation;
    return {
        id,
        spaceId,
        createdAt,
        title,
        ...(starred && { starred: true }),
        status: status ?? ConversationStatus.COMPLETED,
        ...(ghost && { ghost: true }),
    };
}

export function cleanSerializedConversation(conversation: SerializedConversation): SerializedConversation {
    const { id, spaceId, createdAt, starred, encrypted, dirty, deleted } = conversation;
    return {
        id,
        spaceId,
        createdAt,
        ...(starred && { starred: true }),
        encrypted,
        ...(dirty && { dirty: true }),
        ...(deleted && { deleted: true }),
    };
}

// *** Attachment ***

// An attachment has a strong association with a space, which owns it. Additionally, it can be weakly linked
// to one or more messages within that space, meaning it's loosely connected and can be arbitrarily attached
// or detached from messages without affecting its primary ownership.
//
// Various parts of an attachment can be encrypted. The key for these operations is the space key.

// This represents small metadata about the file that isn't encrypted.
export type AttachmentPub = {
    id: AttachmentId;
    // Space ID: in terms of data model, the space owns the attachment.
    // Note: An attachment with undefined space id is called a "provisional attachment" in this codebase.
    //       It means it was recently attached to the composer and is ready to be sent along with the message.
    //       After sending, this spaceId field is set, reflecting it's no longer a hanging, temporary resource.
    spaceId?: SpaceId;
    uploadedAt: string;
    mimeType?: string;
    rawBytes?: number; // size of original binary as sent by user
    processing?: boolean; // not meant to be persisted
    error?: boolean; // not meant to be persisted
};

// This is represents the sensitive data in its decrypted form.
export type AttachmentPriv = {
    filename: string;
    data?: Uint8Array<ArrayBuffer>; // original binary as sent by user // TODO: figure out if we really need to keep this around and persist it?
    markdown?: string; // after conversion
    errorMessage?: string; // detailed error message for processing failures
    truncated?: boolean; // indicates if the file content was truncated for context limits
    originalRowCount?: number; // original number of rows in CSV/Excel files
    processedRowCount?: number; // number of rows actually processed
    tokenCount?: number; // cached token count for LLM context size calculation
};

// This contains metadata as well as the complete blob data.
// It is a decrypted version of what will ultimately go into IndexedDB
export type Attachment = AttachmentPub & AttachmentPriv;
export type ShallowAttachment = Omit<Attachment, 'data' | 'markdown'>;

// This is how objects are serialized into both IndexedDB and the remote persistence API.
// The Encrypted part reflects AttachmentPriv and thus contains "heavy" fields like the data blob
export type SerializedAttachment = AttachmentPub & Partial<Encrypted> & LocalFlags;
export type DeletedAttachment = Omit<SerializedAttachment, 'encrypted'> & Deleted;
export type SerializedAttachmentMap = Record<AttachmentId, SerializedAttachment>;

export function isAttachmentPub(value: any): value is AttachmentPub {
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof value.id === 'string' &&
        (value.spaceId === undefined || typeof value.spaceId === 'string') &&
        (typeof value.mimeType === 'string' || value.mimeType === undefined) &&
        typeof value.uploadedAt === 'string' &&
        (typeof value.rawBytes === 'number' || value.rawBytes === undefined) &&
        (value.processing === undefined || typeof value.processing === 'boolean') &&
        (value.error === undefined || typeof value.error === 'boolean')
    );
}

export function isAttachmentPriv(value: any): value is AttachmentPriv {
    return (
        typeof value === 'object' &&
        value !== null &&
        (value.filename === undefined || typeof value.filename === 'string') &&
        (value.data === undefined || value.data instanceof Uint8Array) &&
        (value.markdown === undefined || typeof value.markdown === 'string') &&
        (value.errorMessage === undefined || typeof value.errorMessage === 'string') &&
        (value.truncated === undefined || typeof value.truncated === 'boolean') &&
        (value.originalRowCount === undefined || typeof value.originalRowCount === 'number') &&
        (value.processedRowCount === undefined || typeof value.processedRowCount === 'number') &&
        (value.tokenCount === undefined || typeof value.tokenCount === 'number')
    );
}

export function isAttachment(value: any): value is Attachment {
    return isAttachmentPub(value) && isAttachmentPriv(value);
}

export function isShallowAttachment(value: any): value is ShallowAttachment {
    return isAttachment(value) && value.data === undefined && value.markdown === undefined;
}

export function getAttachmentPub(attachment: AttachmentPub): AttachmentPub {
    const { id, spaceId, mimeType, uploadedAt, rawBytes, processing, error } = attachment;
    return { id, spaceId, mimeType, uploadedAt, rawBytes, processing, error };
}

export function getAttachmentPriv(m: AttachmentPriv): AttachmentPriv {
    const { filename, data, markdown, errorMessage, truncated, originalRowCount, processedRowCount, tokenCount } = m;
    return { filename, data, markdown, errorMessage, truncated, originalRowCount, processedRowCount, tokenCount };
}

export function splitAttachment(m: Attachment): {
    attachmentPriv: AttachmentPriv;
    attachmentPub: AttachmentPub;
} {
    return {
        attachmentPriv: getAttachmentPriv(m),
        attachmentPub: getAttachmentPub(m),
    };
}

export function cleanAttachment(attachment: Attachment): Attachment {
    const {
        id,
        spaceId,
        mimeType,
        uploadedAt,
        rawBytes,
        processing,
        error,
        filename,
        data,
        markdown,
        errorMessage,
        truncated,
        originalRowCount,
        processedRowCount,
        tokenCount,
    } = attachment;
    return {
        id,
        ...(spaceId !== undefined && { spaceId }),
        ...(mimeType !== undefined && { mimeType }),
        uploadedAt,
        ...(rawBytes !== undefined && { rawBytes }),
        ...(processing && { processing: true }),
        ...(error && { error: true }),
        filename,
        ...(data !== undefined && { data }),
        ...(markdown !== undefined && { markdown }),
        ...(errorMessage !== undefined && { errorMessage }),
        ...(truncated !== undefined && { truncated }),
        ...(originalRowCount !== undefined && { originalRowCount }),
        ...(processedRowCount !== undefined && { processedRowCount }),
        ...(tokenCount !== undefined && { tokenCount }),
    };
}

// *** Resources (common to space/conv/message) ***

export type Resource = Space | Conversation | Message | Attachment;
export type SerializedResource = SerializedSpace | SerializedConversation | SerializedMessage | SerializedAttachment;

// *** Actions ***

export type EditConversation = {
    id: ConversationId;
    spaceId: SpaceId;
    title: string;
    persist: boolean;
};

export type UpdateConversationStatusAction = {
    id: ConversationId;
    status: ConversationStatus;
};

export type ChunkAction = {
    messageId: MessageId;
    content: string;
};

export type FinishMessageAction = {
    messageId: MessageId;
    conversationId: ConversationId;
    spaceId: SpaceId;
    content: string;
    status: Status;
    role: Role;
};

export type PopulateInitialStateAction = {
    spaces: SpaceMap;
    conversations: ConversationMap;
    messages: MessageMap;
    attachments: AttachmentMap;
};

// *** Credentials ***

export type Credentials = {
    masterKey: Base64; // CryptoKey (Wrap)
};

export function isCredentials(obj: any): obj is Credentials {
    return obj && typeof obj === 'object' && typeof obj.masterKey === 'string';
}

export type MasterKey = {
    id: string;
    isLatest: boolean;
    version: number;
    createdAt: string;
    masterKey: Base64;
};

// *** Turn ***

export type Turn = {
    role: Role;
    content?: string;
    encrypted?: boolean;
};

export type EncryptedTurn = Turn & { encrypted: true };
export type UnencryptedTurn = Turn & { encrypted?: false };

export function isTurn(obj: any): obj is Turn {
    return (
        obj &&
        typeof obj === 'object' &&
        'role' in obj &&
        isRole(obj.role) &&
        (obj.content === undefined || typeof obj.content === 'string') &&
        (obj.encrypted === undefined || typeof obj.encrypted === 'boolean')
    );
}

export function isEncryptedTurn(obj: any): obj is EncryptedTurn {
    return isTurn(obj) && obj.encrypted === true;
}

export function isUnencryptedTurn(obj: any): obj is UnencryptedTurn {
    return isTurn(obj) && (obj.encrypted === false || obj.encrypted === undefined);
}

// *** Misc ***

export type SiblingInfo = {
    idx: number;
    count: number;
    onPrev: () => void;
    onNext: () => void;
};

export type LlamaCppPayload = {
    prompt: string;
    n_predict: number;
    stop: string[];
    stream: boolean;
};

export type ProtonApiResponse = {
    Code: number;
    Conversation?: unknown;
    Space?: unknown;
    Spaces?: unknown;
    Message?: unknown;
    Asset?: unknown;
    MasterKeys?: unknown;
};

export interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    data: Blob;
    uploadedAt: Date;
    processed: boolean;
    stats?: {
        originalContent: string;
        convertedContent: string;
        originalSize: number;
        convertedSize: number;
    };
}

export enum LUMO_ELIGIBILITY {
    'Eligible' = 0,
    'OnWaitlist' = 1,
    'NotOnWaitlist' = 2,
}

export function isProtonApiResponse(value: any): value is ProtonApiResponse {
    return typeof value === 'object' && value !== null && typeof value.Code === 'number';
}

export enum LUMO_USER_TYPE {
    GUEST = 'GUEST',
    FREE = 'FREE',
    PAID = 'PAID',
}
