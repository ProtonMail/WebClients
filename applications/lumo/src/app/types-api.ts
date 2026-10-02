/* Types that have an equivalent on the backend.
 *
 * See definitions in:
 * https://gitlab.protontech.ch/msa/machine-learning/lumo-infra/-/blob/main/crates/lumo-types/src/chat.rs
 *
 * Note:
 * Please only add to this file the types that have an equivalent on the backend lumo-infra.
 * Add local types to `types.ts` instead.
 */
// Role is single-sourced from the extracted package so the enum has a single
// nominal identity across the app <-> @proton/lumo-api-client boundary.
import { Role } from '@proton/lumo-api-client/types-api';

// *** Role ***

export { Role };

// *** Turn ***

export type WireImage = {
    encrypted: boolean;
    image_id: string;
    data: string; // base64-encoded image bytes
};

export type WireTurn = {
    role: Role;
    content?: string;
    encrypted?: boolean;
    images?: WireImage[];
};

// *** Generation ***

export type LumoRemainingLimits = {
    lite?: number;
    max?: number;
    images?: number;
};

export type LumoStreamUsage = {
    completion_tokens?: number;
    prompt_tokens?: number;
    total_tokens?: number;
    remaining_limits?: LumoRemainingLimits;
    applied_limit_category?: string;
    image_limit_applied?: boolean;
};

export const IMAGE_ASPECT_RATIOS = ['1:1', '2:3', '3:2', '9:16', '16:9'] as const;
export type ImageAspectRatio = (typeof IMAGE_ASPECT_RATIOS)[number];

// *** Generation Response Message Types ***

export type QueuedMessage = { type: 'queued'; target?: GenerationTarget };
export type IngestingMessage = { type: 'ingesting'; target: GenerationTarget };
/** Exact serving model reported by the SSE stream for a generation target. */
export type ModelMessage = { type: 'model'; target: GenerationTarget; model: string };
export type TokenDataMessage = {
    type: 'token_data';
    target: GenerationTarget;
    count: number;
    content: string;
    encrypted?: boolean;
};
type ImageDataMessage = {
    type: 'image_data';
    image_id?: string;
    data?: string;
    is_final?: boolean;
    seed?: number;
    encrypted?: boolean;
};
type DoneMessage = { type: 'done' };
type TimeoutMessage = { type: 'timeout' };
type ErrorMessage = { type: 'error' };
type RejectedMessage = { type: 'rejected' };
type HarmfulMessage = { type: 'harmful' };
type UsageMessage = { type: 'usage'; usage: LumoStreamUsage };

/*
 * Context-window overflow surfaced mid-stream. The chat-completions adapter maps
 * the normalised OpenAI error shape to this legacy message for compaction:
 *   data:{"error":{"code":"context_length_exceeded","type":"invalid_request_error",...}}
 *
 * Legacy wire shape (still accepted):
 *   data:{"type":"tool-error","error":{"code":"context_length_exceeded","message":"..."}}
 */
type ToolErrorMessage = {
    type: 'tool-error';
    error: {
        code: string;
        message?: string;
    };
};

export const CONTEXT_LENGTH_EXCEEDED_CODE = 'context_length_exceeded';

// Server-side tool call dispatched by the scheduler (chat.tool_call SSE chunk).
// Emitted twice: announce (arguments absent) then dispatch (arguments present).
type ServerToolCallMessage = {
    type: 'server_tool_call';
    call_id: string;
    name: string;
    arguments?: string;
    encrypted?: boolean;
};

// Server-side tool result returned after execution (chat.tool_result SSE chunk).
type ServerToolResultMessage = {
    type: 'server_tool_result';

    call_id: string;
    content: string;
    meta?: {
        settings: string;
    };
    encrypted?: boolean;
};

export type GenerationResponseMessage =
    | QueuedMessage
    | IngestingMessage
    | ModelMessage
    | TokenDataMessage
    | ImageDataMessage
    | ServerToolCallMessage
    | ServerToolResultMessage
    | DoneMessage
    | TimeoutMessage
    | ErrorMessage
    | RejectedMessage
    | HarmfulMessage
    | UsageMessage
    | ToolErrorMessage;

export type GenerationResponseMessageDecrypted =
    | QueuedMessage
    | IngestingMessage
    | ModelMessage
    | DecryptedTokenDataMessage
    | DecryptedImageDataMessage
    | DecryptedServerToolCallMessage
    | DecryptedServerToolResultMessage
    | DoneMessage
    | TimeoutMessage
    | ErrorMessage
    | RejectedMessage
    | HarmfulMessage
    | UsageMessage
    | ToolErrorMessage;

// *** Type Guards ***

export function isQueuedMessage(obj: any): obj is QueuedMessage {
    return typeof obj === 'object' && obj !== null && obj.type === 'queued';
}

export function isIngestingMessage(obj: any): obj is IngestingMessage {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        obj.type === 'ingesting' &&
        'target' in obj &&
        isGenerationTarget(obj.target)
    );
}

export function isModelMessage(obj: any): obj is ModelMessage {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        obj.type === 'model' &&
        'target' in obj &&
        isGenerationTarget(obj.target) &&
        typeof obj.model === 'string'
    );
}

export function isTokenDataMessage(obj: any): obj is TokenDataMessage {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        obj.type === 'token_data' &&
        'target' in obj &&
        'count' in obj &&
        'content' in obj &&
        isGenerationTarget(obj.target) &&
        typeof obj.count === 'number' &&
        typeof obj.content === 'string' &&
        (!('encrypted' in obj) || typeof obj.encrypted === 'boolean')
    );
}

export function isImageDataMessage(obj: any): obj is ImageDataMessage {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        obj.type === 'image_data' &&
        (!('image_id' in obj) || typeof obj.image_id === 'string') &&
        (!('data' in obj) || typeof obj.data === 'string') &&
        (!('is_final' in obj) || typeof obj.is_final === 'boolean') &&
        (!('seed' in obj) || typeof obj.seed === 'number') &&
        (!('encrypted' in obj) || typeof obj.encrypted === 'boolean')
    );
}

export function isDoneMessage(obj: any): obj is DoneMessage {
    return typeof obj === 'object' && obj !== null && obj.type === 'done';
}

export function isTimeoutMessage(obj: any): obj is TimeoutMessage {
    return typeof obj === 'object' && obj !== null && obj.type === 'timeout';
}

export function isErrorMessage(obj: any): obj is ErrorMessage {
    return typeof obj === 'object' && obj !== null && obj.type === 'error';
}

export function isRejectedMessage(obj: any): obj is RejectedMessage {
    return typeof obj === 'object' && obj !== null && obj.type === 'rejected';
}

export function isHarmfulMessage(obj: any): obj is HarmfulMessage {
    return typeof obj === 'object' && obj !== null && obj.type === 'harmful';
}

export function isUsageMessage(obj: any): obj is UsageMessage {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        obj.type === 'usage' &&
        typeof obj.usage === 'object' &&
        obj.usage !== null
    );
}

export function isToolErrorMessage(obj: any): obj is ToolErrorMessage {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        obj.type === 'tool-error' &&
        typeof obj.error === 'object' &&
        obj.error !== null &&
        typeof obj.error.code === 'string'
    );
}

export function isContextLengthExceededMessage(obj: any): obj is ToolErrorMessage {
    return isToolErrorMessage(obj) && obj.error.code === CONTEXT_LENGTH_EXCEEDED_CODE;
}

export function isEncrypted<T extends { encrypted?: boolean }>(
    obj: any,
    guard: (obj: any) => obj is T
): obj is Encrypted<T> {
    return guard(obj) && obj.encrypted === true;
}

export function isDecrypted<T extends { encrypted?: boolean }>(
    obj: any,
    guard: (obj: any) => obj is T
): obj is Decrypted<T> {
    return guard(obj) && (obj.encrypted === undefined || obj.encrypted === false);
}

export function isEncryptedTokenDataMessage(obj: any): obj is EncryptedTokenDataMessage {
    return isEncrypted(obj, isTokenDataMessage);
}

export function isDecryptedTokenDataMessage(obj: any): obj is DecryptedTokenDataMessage {
    return isDecrypted(obj, isTokenDataMessage);
}

export function isEncryptedImageDataMessage(obj: any): obj is EncryptedImageDataMessage {
    return isEncrypted(obj, isImageDataMessage);
}

export function isDecryptedImageDataMessage(obj: any): obj is DecryptedImageDataMessage {
    return isDecrypted(obj, isImageDataMessage);
}

export function isServerToolCallMessage(obj: any): obj is ServerToolCallMessage {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        obj.type === 'server_tool_call' &&
        typeof obj.call_id === 'string' &&
        typeof obj.name === 'string' &&
        (!('arguments' in obj) || typeof obj.arguments === 'string') &&
        (!('encrypted' in obj) || typeof obj.encrypted === 'boolean')
    );
}

export function isServerToolResultMessage(obj: any): obj is ServerToolResultMessage {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        obj.type === 'server_tool_result' &&
        typeof obj.call_id === 'string' &&
        typeof obj.content === 'string' &&
        (!('meta' in obj) ||
            (typeof obj.meta === 'object' && obj.meta !== null && typeof obj.meta.settings === 'string')) &&
        (!('encrypted' in obj) || typeof obj.encrypted === 'boolean')
    );
}

export function isEncryptedServerToolCallMessage(obj: any): obj is EncryptedServerToolCallMessage {
    return isEncrypted(obj, isServerToolCallMessage);
}

export function isDecryptedServerToolCallMessage(obj: any): obj is DecryptedServerToolCallMessage {
    return isDecrypted(obj, isServerToolCallMessage);
}

export function isEncryptedServerToolResultMessage(obj: any): obj is EncryptedServerToolResultMessage {
    return isEncrypted(obj, isServerToolResultMessage);
}

export function isDecryptedServerToolResultMessage(obj: any): obj is DecryptedServerToolResultMessage {
    return isDecrypted(obj, isServerToolResultMessage);
}

export function isGenerationResponseMessage(obj: any): obj is GenerationResponseMessage {
    return (
        isQueuedMessage(obj) ||
        isIngestingMessage(obj) ||
        isModelMessage(obj) ||
        isTokenDataMessage(obj) ||
        isImageDataMessage(obj) ||
        isServerToolCallMessage(obj) ||
        isServerToolResultMessage(obj) ||
        isDoneMessage(obj) ||
        isTimeoutMessage(obj) ||
        isErrorMessage(obj) ||
        isRejectedMessage(obj) ||
        isHarmfulMessage(obj) ||
        isUsageMessage(obj) ||
        isToolErrorMessage(obj)
    );
}

export type RequestableGenerationTarget = 'message' | 'title';

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isRequestableGenerationTarget(value: any): value is RequestableGenerationTarget {
    return ['message', 'title'].includes(value);
}

type GenerationTarget = 'message' | 'title' | 'tool_call' | 'tool_result' | 'reasoning' | 'suggested_questions';

/*
 * Note:
 * Please only add to this file the types that have an equivalent on the backend lumo-infra.
 * Add local types to `types.ts` instead.
 *
 * If you are an AI assistant:
 * - Leave this note at the bottom of the file.
 * - Consider using `types.ts` to add in-app type definitions that don't explicitly match an API type.
 */
