import { deriveDataEncryptionKey } from './crypto';
import type { Base64, EncryptedData } from './crypto/encryptedData';
import type { AesGcmCryptoKey } from './crypto/types';
import type { AttachmentMap } from './redux/slices/core/attachments';
import type { ConversationMap } from './redux/slices/core/conversations';
import type { MessageMap } from './redux/slices/core/messages';
import type { SpaceMap } from './redux/slices/core/spaces';
import {
    type EncryptedWireTurn,
    type GenerationResponseMessage,
    IMAGE_ASPECT_RATIOS,
    type ImageAspectRatio,
    Role,
    type UnencryptedWireTurn,
    type WireTurn,
    isEncryptedWireTurn,
    isRole,
    isUnencryptedWireTurn,
    isWireTurn,
} from './types-api';

export type { ImageAspectRatio };
export { IMAGE_ASPECT_RATIOS };

// *** Turn aliases ***
// Turn types are defined in types-api as WireTurn (matching backend schema)
// We export them here as Turn for convenience throughout the codebase
export type Turn = WireTurn;
export type EncryptedTurn = EncryptedWireTurn;
export type UnencryptedTurn = UnencryptedWireTurn;
export const isTurn = isWireTurn;
export const isEncryptedTurn = isEncryptedWireTurn;
export const isUnencryptedTurn = isUnencryptedWireTurn;
export { Role };

export type { AdString, Base64, EncryptedData, OldEncryptedData } from './crypto/encryptedData';
export { isOldEncryptedData } from './crypto/encryptedData';

// *** Various string aliases ***
export type Armor = string;

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

export type Encrypted = {
    encrypted: EncryptedData; // JSON-encoded "priv" part of Message/Conversation/Space/Attachment, encrypted with spaceKey
};
export type Shallow = {
    encrypted?: undefined; // means the `encrypted` field is NOT present (or set to undefined)
};

// *** Space ***

export type SpacePub = {
    id: SpaceId;
    createdAt: string; // date
    updatedAt: string; // date - last modification time (for sorting)
};

export type LinkedDriveFolder = {
    folderId: string; // Drive folder nodeId
    folderName: string;
    folderPath: string;
};

export type ProjectSpace = {
    isProject: true; // Flag to indicate this space is being used as a project
    // Project metadata (optional - only for spaces used as projects)
    projectName?: string;
    projectInstructions?: string;
    projectIcon?: string; // Icon identifier for the project (e.g., 'health', 'finance', 'legal')
    // Linked Drive folder (optional - only for projects with linked Drive folders)
    linkedDriveFolder?: LinkedDriveFolder;
};

export type SimpleSpace = {
    isProject?: false; // Not a project (false, undefined, or unspecified)
};

export type SpacePriv = ProjectSpace | SimpleSpace;

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
    return isProjectSpace(value) || isSimpleSpace(value);
}

export function isProjectSpace(value: any): value is ProjectSpace {
    return typeof value === 'object' && value !== null && value.isProject === true;
}

export function isSimpleSpace(value: any): value is SimpleSpace {
    return typeof value === 'object' && value !== null && (value.isProject === false || value.isProject === undefined);
}

export function isSpaceKeyClear(value: any): value is SpaceKeyClear {
    return typeof value === 'object' && value !== null && typeof value.spaceKey === 'string';
}

export function isSpaceKeyEnc(value: any): value is SpaceKeyEnc {
    return typeof value === 'object' && value !== null && typeof value.wrappedSpaceKey === 'string';
}

export function isSpace(value: any): value is Space {
    return isSpacePub(value) && isSpacePriv(value) && isSpaceKeyClear(value);
}

export function isDeletedSpace(value: any): value is DeletedSpace {
    return isSpacePub(value) && 'deleted' in value && value.deleted === true;
}

export function getSpacePriv(s: SpacePriv): SpacePriv {
    if (s.isProject) {
        const { projectName, projectInstructions, isProject, projectIcon, linkedDriveFolder } =
            s satisfies ProjectSpace;
        return { projectName, projectInstructions, isProject, projectIcon, linkedDriveFolder };
    } else {
        const { isProject } = s;
        return { isProject };
    }
}

export function getSpacePub(s: SpacePub): SpacePub {
    const { id, createdAt, updatedAt } = s;
    return { id, createdAt, updatedAt };
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
    if (space.isProject === true) {
        const {
            id,
            createdAt,
            updatedAt,
            spaceKey,
            projectName,
            projectInstructions,
            isProject,
            projectIcon,
            linkedDriveFolder,
        } = space;
        return {
            id,
            createdAt,
            updatedAt,
            spaceKey,
            isProject,
            ...(projectName !== undefined && { projectName }),
            ...(projectInstructions !== undefined && { projectInstructions }),
            ...(projectIcon !== undefined && { projectIcon }),
            ...(linkedDriveFolder !== undefined && { linkedDriveFolder }),
        };
    } else {
        const { id, createdAt, updatedAt, spaceKey, isProject } = space;
        return {
            id,
            createdAt,
            updatedAt,
            spaceKey,
            ...(isProject !== undefined && { isProject }),
        };
    }
}

// Helper to extract project and drive folder information from a space
type ProjectInfoLinked = {
    space: Space;
    project: ProjectSpace;
    linkedDriveFolder: LinkedDriveFolder;
    isLinked: true;
};

type ProjectInfoNotLinked = {
    space: Space;
    project: ProjectSpace | undefined;
    linkedDriveFolder: undefined;
    isLinked: false;
};

type ProjectInfo = ProjectInfoLinked | ProjectInfoNotLinked;

export function cleanSerializedSpace(space: SerializedSpace): SerializedSpace {
    const { id, createdAt, updatedAt, encrypted, wrappedSpaceKey, dirty, deleted } = space;

    // For deleted spaces, we ensure wrappedSpaceKey is not included
    if (deleted === true) {
        return {
            id,
            createdAt,
            updatedAt,
            ...(encrypted && { encrypted }),
            deleted: true,
            ...(dirty ? { dirty: true } : {}),
        };
    }

    // For active spaces, we require wrappedSpaceKey
    return {
        id,
        createdAt,
        updatedAt,
        ...(encrypted && { encrypted }),
        wrappedSpaceKey,
        ...(dirty ? { dirty: true } : {}),
    };
}

export async function getSpaceDek(s: SpaceKeyClear): Promise<AesGcmCryptoKey> {
    const spaceKeyBytes = Uint8Array.fromBase64(s.spaceKey);
    return deriveDataEncryptionKey(spaceKeyBytes);
}

export function getProjectInfo(space: Space | undefined): ProjectInfo | Partial<ProjectInfo>;
export function getProjectInfo(space: Space): ProjectInfo;
export function getProjectInfo(space: undefined): Partial<ProjectInfo>;
export function getProjectInfo(space: Space | undefined): Partial<ProjectInfo> {
    if (space === undefined) {
        return {
            space: undefined,
            project: undefined,
            linkedDriveFolder: undefined,
            isLinked: false,
        } satisfies Partial<ProjectInfo>;
    }
    const project = space.isProject ? (space satisfies ProjectSpace) : undefined;
    const linkedDriveFolder = project?.linkedDriveFolder;

    if (project !== undefined && linkedDriveFolder !== undefined) {
        return {
            space,
            project: project,
            linkedDriveFolder,
            isLinked: true,
        } satisfies ProjectInfo;
    }

    return {
        space,
        project,
        linkedDriveFolder: undefined,
        isLinked: false,
    } satisfies ProjectInfo;
}

// *** Message ***

// Content block types for structured message content
export type TextBlock = {
    type: 'text';
    content: string; // Markdown
    sequence?: number; // Optional sequence number for ordering
};

export type ToolCallBlock = {
    type: 'tool_call';
    content: string; // JSON string (for serialization/prepareTurns)
    toolCall?: unknown; // Parsed JSON (for easy access, may be invalid/unknown)
    sequence?: number; // Optional sequence number for ordering
};

export type ToolResultBlock = {
    type: 'tool_result';
    content: string; // JSON string (for serialization/prepareTurns)
    toolResult?: unknown; // Parsed JSON (for easy access, may be invalid/unknown)
    meta?: {
        settings: string;
    };
    sequence?: number; // Optional sequence number for ordering
};

export type ContentBlock = TextBlock | ToolCallBlock | ToolResultBlock;

export type MessagePub = {
    id: MessageId; // uuid
    createdAt: string; // date
    role: Role;
    parentId?: MessageId;
    conversationId: ConversationId;
    placeholder?: boolean;
    status?: Status;
};

export type ThinkingTimelineEvent =
    | { type: 'reasoning'; timestamp: number; content: string }
    | { type: 'tool_call'; timestamp: number; toolCallIndex: number };

export type ReasoningChunk = {
    content: string;
    sequence: number; // The count from token_data message
};

// *** Context compaction ***

export type CompactionStrategyName =
    'clear_tool_results' | 'drop_tool_pairs' | 'strip_context' | 'drop_old_rounds' | 'llm_summary';

export type CompactionStats = {
    tokensBefore: number; // Estimated tokens of the summarized region before compaction
    tokensAfter: number; // Estimated tokens of the produced summary
    tokensRemoved: number; // tokensBefore - tokensAfter (never negative)
    summarizedMessageCount: number; // Messages collapsed into the summary
    keptMessageCount: number; // Recent messages preserved verbatim
    clearedToolResultCount: number; // Tool results cleared/dropped during reduction
    appliedStrategies: CompactionStrategyName[]; // Strategies that ran, in order
    usedLlmSummary: boolean; // Whether the final LLM summarization step was needed
    /** Structured audit trail for trust: which files/tools left active context. */
    audit?: CompactionAudit;
};

export type CompactionAudit = {
    /** Files referenced in the summarized region that no longer count toward context. */
    removedFiles: string[];
    /** Tool names whose results were replaced with a placeholder. */
    clearedTools: string[];
    /** Tool names whose call/result pairs were removed entirely. */
    droppedTools: string[];
};

/**
 * Metadata stamped on a "compaction boundary" message. The boundary marks the
 * point where the conversation context was branched: everything in
 * `summarizedMessageIds` is replaced by `summary` for all subsequent model
 * requests, while `keptMessageIds` are forwarded verbatim. The original
 * messages remain in the tree for display/history.
 */
export type CompactionMeta = {
    // 'compacting' while the engine runs, 'done' once the summary is ready.
    // Absent on older persisted boundaries, which are always considered done.
    status?: 'compacting' | 'done';
    summary: string;
    summarizedMessageIds: MessageId[];
    keptMessageIds: MessageId[];
    stats: CompactionStats;
    createdAt: string; // ISO date
};

export type MessagePriv = {
    // Legacy fields (kept for backward compatibility)
    context?: string;
    attachments?: ShallowAttachment[]; // with empty .data and .markdown; full payloads are in IndexedDB
    contextFiles?: AttachmentId[]; // Files that were used in LLM context for this response

    // Content v1: could not have more than one tool call, and cannot interleave content and tools
    content?: string; // User-visible message string (as markdown)
    toolCall?: string; // Stringified JSON from backend
    toolResult?: string; // Stringified JSON from backend

    // Content v2: message content and tool calls are now interleaved in a clear sequence `blocks`,
    // making other fields (`content`, `toolCall`, `toolResult`) legacy.
    blocks?: ContentBlock[];

    // Reasoning: Model's internal thinking process (extended thinking models)
    reasoning?: string; // Legacy: concatenated reasoning
    reasoningChunks?: ReasoningChunk[]; // New: reasoning with sequence numbers for proper interleaving

    // Thinking timeline: events showing when reasoning/tool calls happened
    thinkingTimeline?: ThinkingTimelineEvent[];

    // Suggested follow-up questions from the model
    suggestedQuestions?: string[];

    /** Model id/hash that served this response (from SSE `model` field). */
    modelID?: string;

    /** Model id sent in the chat request, including response mode, e.g. `lumo-max (thinking)`. */
    requestedModel?: string;

    // Context compaction boundary. When set, this message is a "compaction marker"
    // rather than ordinary content: it records how the conversation was condensed
    // and is rendered as a divider in the UI. See CompactionMeta.
    compaction?: CompactionMeta;

    // Exact token usage reported by the backend for the request that produced this
    // (assistant) message. Used to anchor context-size estimates on real numbers
    // instead of the local ~4-chars/token approximation. Absent on older messages
    // and on requests where the backend did not report usage. See MessageUsage.
    usage?: MessageUsage;
};

/**
 * Backend-reported token usage for the request that produced an assistant message.
 *
 * `promptTokens`/`completionTokens`/`totalTokens` come verbatim from the SSE
 * `usage` chunk (exact, server-tokenized).
 * `ctxFilesTokenEstimate` is our own estimate of the file attachments that were active
 * in that request.
 * If we want to estimate the token count for a new request, but the user changes the
 * files that are active in the conversation, we can subtract the estimated token count
 * for the files in the previous context data, and add the estimated token count for the
 * current files.
 * If the attached files are the same, the token count is exact, if they change,
 * the estimate differs depending on the accuracy of our estimate of the changed files.
 *
 * The version number is here so we can bump it when we change the way we estimate the
 * token count for files, to avoid under or overestimating the token count for a message.
 *
 * All fields are optional: store
 * whatever the backend provided without assuming completeness.
 */
export type MessageUsage = {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    ctxFilesTokenEstimate?: number;
    // This has a version number, because if we change the way we estimate the token count for files,
    // we cannot use persisted estimates calculated with the old logic.
    tokenEstimateVersion?: number;
};

export type Message = MessagePub & MessagePriv;
export type SerializedMessage = MessagePub & Partial<Encrypted> & LocalFlags;
export type DeletedMessage = Omit<SerializedMessage, 'encrypted'> & Deleted;
export type SerializedMessageMap = Record<MessageId, SerializedMessage>;

export function isTextBlock(block: any): block is TextBlock {
    return typeof block === 'object' && block !== null && block.type === 'text' && typeof block.content === 'string';
}

export function isToolCallBlock(block: any): block is ToolCallBlock {
    return (
        typeof block === 'object' && block !== null && block.type === 'tool_call' && typeof block.content === 'string'
    );
}

export function isToolResultBlock(block: any): block is ToolResultBlock {
    return (
        typeof block === 'object' && block !== null && block.type === 'tool_result' && typeof block.content === 'string'
    );
}

export function isContentBlock(value: any): value is ContentBlock {
    return isTextBlock(value) || isToolCallBlock(value) || isToolResultBlock(value);
}

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
    // prettier-ignore
    return (
        typeof value === 'object' &&
        value !== null &&
        (value.content === undefined || typeof value.content === 'string') &&
        (value.context === undefined || typeof value.context === 'string') &&
        (value.attachments === undefined || (Array.isArray(value.attachments) && value.attachments.every((a: unknown) => isShallowAttachment(a)))) &&
        (value.toolCall === undefined || typeof value.toolCall === 'string') &&
        (value.toolResult === undefined || typeof value.toolResult === 'string') &&
        (value.contextFiles === undefined || (Array.isArray(value.contextFiles) && value.contextFiles.every((id: unknown) => typeof id === 'string'))) &&
        (value.blocks === undefined || (Array.isArray(value.blocks) && value.blocks.every(isContentBlock))) &&
        (value.reasoning === undefined || typeof value.reasoning === 'string') &&
        (value.reasoningChunks === undefined || Array.isArray(value.reasoningChunks)) &&
        (value.thinkingTimeline === undefined || Array.isArray(value.thinkingTimeline)) &&
        (value.suggestedQuestions === undefined || Array.isArray(value.suggestedQuestions)) &&
        (value.modelID === undefined || typeof value.modelID === 'string') &&
        (value.requestedModel === undefined || typeof value.requestedModel === 'string') &&
        (value.compaction === undefined || (typeof value.compaction === 'object' && value.compaction !== null)) &&
        (value.usage === undefined || (typeof value.usage === 'object' && value.usage !== null))
    );
}

export function getMessagePub(message: MessagePub): MessagePub {
    const { id, createdAt, role, parentId, conversationId, placeholder, status } = message;
    return { id, createdAt, role, parentId, conversationId, placeholder, status };
}

export function getMessagePriv(m: MessagePriv): MessagePriv {
    const {
        content,
        context,
        attachments,
        toolCall,
        toolResult,
        contextFiles,
        blocks,
        reasoning,
        reasoningChunks,
        thinkingTimeline,
        suggestedQuestions,
        modelID,
        requestedModel,
        compaction,
        usage,
    } = m;
    return {
        content,
        context,
        attachments,
        toolCall,
        toolResult,
        contextFiles,
        blocks,
        reasoning,
        reasoningChunks,
        thinkingTimeline,
        suggestedQuestions,
        modelID,
        requestedModel,
        compaction,
        usage,
    };
}

export function isCompactionMessage(message: MessagePriv): boolean {
    return message.compaction !== undefined;
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
        blocks,
        reasoning,
        reasoningChunks,
        thinkingTimeline,
        suggestedQuestions,
        modelID,
        requestedModel,
        compaction,
        usage,
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
        ...(attachments !== undefined && { attachments: attachments.map(cleanAttachment) }),
        ...(toolCall !== undefined && { toolCall }),
        ...(toolResult !== undefined && { toolResult }),
        ...(contextFiles !== undefined && { contextFiles }),
        ...(blocks !== undefined && { blocks }),
        ...(reasoning !== undefined && { reasoning }),
        ...(reasoningChunks !== undefined && { reasoningChunks }),
        ...(thinkingTimeline !== undefined && { thinkingTimeline }),
        ...(suggestedQuestions !== undefined && { suggestedQuestions }),
        ...(modelID !== undefined && { modelID }),
        ...(requestedModel !== undefined && { requestedModel }),
        ...(compaction !== undefined && { compaction }),
        ...(usage !== undefined && { usage }),
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
    const { id, spaceId, mimeType, uploadedAt, rawBytes, processing, error, encrypted, dirty, deleted } = attachment;
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
        value.contextFiles === undefined &&
        (value.blocks === undefined || value.blocks.length === 0) &&
        value.reasoning === undefined &&
        value.reasoningChunks === undefined &&
        value.thinkingTimeline === undefined &&
        value.suggestedQuestions === undefined &&
        value.modelID === undefined &&
        value.requestedModel === undefined &&
        value.compaction === undefined &&
        value.usage === undefined
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
    updatedAt: string; // date - last modification time (for sorting)
    starred?: boolean;
};

export type ConversationPriv = {
    title: string;
    agentId?: string; // id of an active custom agent (see LumoUserSettings.customAgents)
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
    const { id, spaceId, createdAt, updatedAt, starred } = c;
    return { id, spaceId, createdAt, updatedAt, starred };
}

export function getConversationPriv(c: ConversationPriv): ConversationPriv {
    const { title, agentId } = c;
    return { title, ...(agentId && { agentId }) };
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
    const { id, spaceId, createdAt, updatedAt, title, agentId, starred, status, ghost } = conversation;
    return {
        id,
        spaceId,
        createdAt,
        updatedAt,
        title,
        ...(agentId && { agentId }),
        ...(starred && { starred: true }),
        // `status` is local-only, so a conversation coming back from the server never carries one.
        // Defaulting it to COMPLETED invented a "generation finished" that never happened.
        ...(status && { status }),
        ...(ghost && { ghost: true }),
    };
}

export function cleanSerializedConversation(conversation: SerializedConversation): SerializedConversation {
    const { id, spaceId, createdAt, updatedAt, starred, encrypted, dirty, deleted } = conversation;
    return {
        id,
        spaceId,
        createdAt,
        updatedAt,
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
    // Auto-retrieved from Drive index via RAG (not manually uploaded)
    autoRetrieved?: boolean;
    // Source Drive node ID (for auto-retrieved attachments)
    driveNodeId?: string;
    // Relevance score for auto-retrieved attachments (0-1 normalized, 1 = most relevant)
    relevanceScore?: number;
    // Chunk-related fields for large documents split into sections
    isChunk?: boolean; // Whether this attachment represents a section of a larger document
    chunkTitle?: string; // Section title or context for this chunk
    // Ephemeral attachment bound to a sent message (e.g. @mentioned Drive file).
    // Kept in Redux after send so follow-up turns can resolve file content.
    conversationContext?: boolean;
};

// This is represents the sensitive data in its decrypted form.
export type AttachmentPriv = {
    filename: string;
    data?: Uint8Array<ArrayBuffer>; // original binary as sent by user, or HD reduction of image
    markdown?: string; // after conversion
    errorMessage?: string; // detailed error message for processing failures
    truncated?: boolean; // indicates if the file content was truncated for context limits
    originalRowCount?: number; // original number of rows in CSV/Excel files
    processedRowCount?: number; // number of rows actually processed
    tokenCount?: number; // cached token count for LLM context size calculation
    imagePreview?: Uint8Array<ArrayBuffer>; // if the attachment is an image: small definition image for preview
    role?: 'user' | 'assistant'; // source of attachment, defaults to 'user' for backward compatibility
};

// This contains metadata as well as the complete blob data.
// It is a decrypted version of what will ultimately go into IndexedDB
export type Attachment = AttachmentPub & AttachmentPriv;
// `imagePreview` is a Uint8Array (non-serializable) and is excluded so shallow attachments stored
// in Redux/message state stay serializable. The full preview lives in the attachmentDataCache.
export type ShallowAttachment = Omit<Attachment, 'data' | 'markdown' | 'imagePreview'>;

// This is how objects are serialized into both IndexedDB and the remote persistence API.
// The Encrypted part reflects AttachmentPriv and thus contains "heavy" fields like the data blob
export type SerializedAttachment = AttachmentPub & Partial<Encrypted> & LocalFlags;
export type DeletedAttachment = Omit<SerializedAttachment, 'encrypted'> & Deleted;
export type SerializedAttachmentMap = Record<AttachmentId, SerializedAttachment>;

export function isAttachmentPub(value: any): value is AttachmentPub {
    // prettier-ignore
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof value.id === 'string' &&
        (value.spaceId === undefined || typeof value.spaceId === 'string') &&
        (value.mimeType === undefined || typeof value.mimeType === 'string') &&
        typeof value.uploadedAt === 'string' &&
        (value.rawBytes === undefined || typeof value.rawBytes === 'number') &&
        (value.processing === undefined || typeof value.processing === 'boolean') &&
        (value.error === undefined || typeof value.error === 'boolean') &&
        (value.autoRetrieved === undefined || typeof value.autoRetrieved === 'boolean') &&
        (value.driveNodeId === undefined || typeof value.driveNodeId === 'string') &&
        (value.relevanceScore === undefined || typeof value.relevanceScore === 'number') &&
        (value.isChunk === undefined || typeof value.isChunk === 'boolean') &&
        (value.chunkTitle === undefined || typeof value.chunkTitle === 'string') &&
        (value.conversationContext === undefined || typeof value.conversationContext === 'boolean')
    );
}

export function isAttachmentPriv(value: any): value is AttachmentPriv {
    // prettier-ignore
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
        (value.imagePreview === undefined || value.imagePreview instanceof Uint8Array) &&
        (value.tokenCount === undefined || typeof value.tokenCount === 'number') &&
        (value.role === undefined || value.role === 'user' || value.role === 'assistant')
    );
}

export function isAttachment(value: any): value is Attachment {
    return isAttachmentPub(value) && isAttachmentPriv(value);
}

export function isShallowAttachment(value: any): value is ShallowAttachment {
    return (
        isAttachment(value) &&
        value.data === undefined &&
        value.markdown === undefined &&
        value.imagePreview === undefined
    );
}

export function getAttachmentPub(attachment: AttachmentPub): AttachmentPub {
    const {
        id,
        spaceId,
        mimeType,
        uploadedAt,
        rawBytes,
        processing,
        error,
        autoRetrieved,
        driveNodeId,
        relevanceScore,
    } = attachment;
    return {
        id,
        spaceId,
        mimeType,
        uploadedAt,
        rawBytes,
        processing,
        error,
        autoRetrieved,
        driveNodeId,
        relevanceScore,
    };
}

export function getAttachmentPriv(m: AttachmentPriv): AttachmentPriv {
    const {
        filename,
        data,
        markdown,
        errorMessage,
        truncated,
        originalRowCount,
        processedRowCount,
        tokenCount,
        imagePreview,
        role,
    } = m;
    return {
        filename,
        data,
        markdown,
        errorMessage,
        truncated,
        originalRowCount,
        processedRowCount,
        tokenCount,
        imagePreview,
        role,
    };
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
        autoRetrieved,
        driveNodeId,
        relevanceScore,
        isChunk,
        chunkTitle,
        filename,
        // Note: `data` and `imagePreview` (Uint8Array) are intentionally excluded from cleaned attachments
        // to prevent non-serializable binary blobs from being stored in Redux state.
        // These are stored in the attachmentDataCache instead and retrieved when needed.
        markdown,
        errorMessage,
        truncated,
        originalRowCount,
        processedRowCount,
        tokenCount,
        role,
    } = attachment;
    return {
        id,
        ...(spaceId !== undefined && { spaceId }),
        ...(mimeType !== undefined && { mimeType }),
        uploadedAt,
        ...(rawBytes !== undefined && { rawBytes }),
        ...(processing && { processing: true }),
        ...(error && { error: true }),
        ...(autoRetrieved !== undefined && { autoRetrieved }),
        ...(driveNodeId !== undefined && { driveNodeId }),
        ...(relevanceScore !== undefined && { relevanceScore }),
        ...(isChunk !== undefined && { isChunk }),
        ...(chunkTitle !== undefined && { chunkTitle }),
        filename,
        // data and imagePreview are intentionally NOT included - see comment above
        ...(markdown !== undefined && { markdown }),
        ...(errorMessage !== undefined && { errorMessage }),
        ...(truncated !== undefined && { truncated }),
        ...(originalRowCount !== undefined && { originalRowCount }),
        ...(processedRowCount !== undefined && { processedRowCount }),
        ...(tokenCount !== undefined && { tokenCount }),
        ...(role !== undefined && { role }),
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
    sequence?: number; // Optional sequence number for ordering (used for reasoning)
};

export type FinishMessageAction = {
    messageId: MessageId;
    conversationId: ConversationId;
    spaceId: SpaceId;
    content: string;
    status: Status;
    role: Role;
    modelID?: string;
    requestedModel?: string;
};

export type PopulateInitialStateAction = {
    spaces: SpaceMap;
    conversations: ConversationMap;
    messages: MessageMap;
    attachments: AttachmentMap;
};

// *** Credentials ***

/**
 * The master key is fetched and decrypted off the render gate, so consumers have to be able to tell
 * "not yet" from "never". A single `Base64` conflated three states — absent because we are still
 * booting, absent because the user is not eligible, and absent because the load failed — and every
 * consumer's `if (!masterKey)` was ambiguous between them.
 *
 * `loading` is the initial state and is the only one that is worth waiting on; see
 * `redux/sagas/masterKey.ts`.
 */
export type MasterKeyState =
    | { status: 'loading' }
    | { status: 'ready'; masterKey: Base64 } // CryptoKey (Wrap), base64-encoded
    | { status: 'ineligible' }
    | { status: 'failed'; message: string };

export type Credentials = {
    masterKeyState: MasterKeyState;
};

export function isCredentials(obj: any): obj is Credentials {
    return obj && typeof obj === 'object' && typeof obj.masterKeyState?.status === 'string';
}

export type MasterKey = {
    id: string;
    isLatest: boolean;
    version: number;
    createdAt: string;
    masterKey: Base64;
};

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
    Eligible = 0,
    OnWaitlist = 1,
    NotOnWaitlist = 2,
}

export function isProtonApiResponse(value: any): value is ProtonApiResponse {
    return typeof value === 'object' && value !== null && typeof value.Code === 'number';
}

export enum LUMO_USER_TYPE {
    GUEST = 'GUEST',
    FREE = 'FREE',
    PAID = 'PAID',
}

export enum LUMO_API_ERRORS {
    CONTEXT_WINDOW_EXCEEDED = 'ContextWindow',
    HIGH_DEMAND = 'HighDemand',
    GENERATION_ERROR = 'GenerationError', // This is a catch-all for any error that occurs during generation
    TIER_LIMIT = 'TierLimit', //not implemented yet for free and paid tiers - BE needs to be updated
    GENERATION_REJECTED = 'GenerationRejected',
    HARMFUL_CONTENT = 'HarmfulContent',
    STREAM_DISCONNECTED = 'StreamDisconnected', // When the server closes the stream prematurely after queuing
    // Backend-enforced resource limits (HTTP 422)
    MESSAGE_LIMIT_REACHED = 'MessageLimitReached',
    ASSET_LIMIT_REACHED = 'AssetLimitReached',
    CONVERSATION_LIMIT_REACHED = 'ConversationLimitReached',
    SPACE_LIMIT_REACHED = 'SpaceLimitReached',
    // File upload errors surfaced to the native composer
    DUPLICATE_FILE = 'DuplicateFile',
    UNSUPPORTED_FILE = 'UnsupportedFile',
    // Generic fallback
    UNKNOWN = 'Unknown',
}

export type RetryStrategy = 'simple' | 'try_again' | 'add_details' | 'more_concise' | 'think_longer' | 'custom';

export type ImageGenerationOptions = {
    aspectRatio?: ImageAspectRatio;
};

// TODO this type should be refactored in a union like:
//    ({ type: 'send', ... } | { type: 'edit', ... }) | { type: 'regenerate' } & { ...common... }
export interface ActionParams {
    actionType: 'send' | 'edit' | 'regenerate';
    newMessageContent?: string;
    originalMessage?: Message;
    isWebSearchButtonToggled: boolean;
    retryStrategy?: RetryStrategy;
    customRetryInstructions?: string;
    imageOptions?: ImageGenerationOptions;
    /** True when the message was auto-sent from a ?q= URL parameter. */
    isFromQueryParam?: boolean;
}

export interface ErrorContext {
    actionType: string;
    conversationId?: ConversationId;
    actionParams: ActionParams;
}

export interface GenerationError {
    type: LUMO_API_ERRORS;
    conversationId: ConversationId;
    originalMessage: GenerationResponseMessage;
    actionParams?: ActionParams;
}

export type GenerationErrorAction = {
    type: 'generation_error';
    payload: GenerationError;
};

export enum ComposerMode {
    NEW_CONVERSATION = 'new-conversation',
    CONVERSATION = 'conversation',
    GALLERY = 'gallery',
    PROJECT = 'project',
}
