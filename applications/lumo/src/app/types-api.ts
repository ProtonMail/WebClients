/* Types that have an equivalent on the backend.
 *
 * See definitions in:
 * https://gitlab.protontech.ch/msa/machine-learning/lumo-infra/-/blob/main/src/types.rs
 *
 * Note:
 * Please only add to this file the types that have an equivalent on the backend lumo-infra.
 * Add local types to `types.ts` instead.
 */
import type { RequestId } from './types';

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

export type EncryptedWireTurn = WireTurn & { encrypted: true };
export type UnencryptedWireTurn = WireTurn & { encrypted?: false };

export function isWireTurn(obj: any): obj is WireTurn {
    return (
        obj &&
        typeof obj === 'object' &&
        'role' in obj &&
        isRole(obj.role) &&
        (obj.content === undefined || typeof obj.content === 'string') &&
        (obj.encrypted === undefined || typeof obj.encrypted === 'boolean') &&
        (obj.images === undefined || (Array.isArray(obj.images) && obj.images.every((img: any) => isWireImage(img))))
    );
}

export function isWireImage(obj: any): obj is WireImage {
    return (
        obj &&
        typeof obj === 'object' &&
        typeof obj.encrypted === 'boolean' &&
        typeof obj.image_id === 'string' &&
        typeof obj.data === 'string'
    );
}

export function isEncryptedWireTurn(obj: any): obj is EncryptedWireTurn {
    return isWireTurn(obj) && obj.encrypted === true;
}

export function isUnencryptedWireTurn(obj: any): obj is UnencryptedWireTurn {
    return isWireTurn(obj) && (obj.encrypted === false || obj.encrypted === undefined);
}

// *** Generation ***

export type Tier = 'anonymous' | 'basic' | 'free';

export type ToolName =
    | 'proton_info'
    | 'web_search'
    | 'weather'
    | 'stock'
    | 'cryptocurrency'
    | 'generate_image'
    | 'describe_image'
    | 'edit_image';

/*
 * A generation request in the format that the scheduler backend expects.
 */
export type LumoApiGenerationRequest = {
    type: 'generation_request';
    turns: WireTurn[];
    tier?: Tier;
    options?: Options;
    targets?: RequestableGenerationTarget[];
    request_key?: string; // aes-gcm-256, pgp-encrypted, base64
    request_id?: RequestId; // uuid used solely for AEAD encryption
};

/*
 * Payload in the format that the PHP backend expects at `/chat`,
 * with the actual data structure wrapped in a legacy `Prompt` field.
 */
export type ChatEndpointGenerationRequest = {
    Prompt: LumoApiGenerationRequest;
};

export type Options = {
    tools?: ToolName[] | boolean;
};

// *** Utility types for encryption state ***

export type Encrypted<T extends { encrypted?: boolean }> = Omit<T, 'encrypted'> & { encrypted: true };
export type Decrypted<T extends { encrypted?: boolean }> = Omit<T, 'encrypted'> & { encrypted?: false };

// *** Generation Response Message Types ***

export type QueuedMessage = { type: 'queued'; target?: GenerationTarget };
export type IngestingMessage = { type: 'ingesting'; target: GenerationTarget };
export type TokenDataMessage = {
    type: 'token_data';
    target: GenerationTarget;
    count: number;
    content: string;
    encrypted?: boolean;
};
export type ImageDataMessage = {
    type: 'image_data';
    image_id?: string;
    data?: string;
    is_final?: boolean;
    seed?: number;
    encrypted?: boolean;
};
export type DoneMessage = { type: 'done' };
export type TimeoutMessage = { type: 'timeout' };
export type ErrorMessage = { type: 'error' };
export type RejectedMessage = { type: 'rejected' };
export type HarmfulMessage = { type: 'harmful' };

export type EncryptedTokenDataMessage = Encrypted<TokenDataMessage>;
export type DecryptedTokenDataMessage = Decrypted<TokenDataMessage>;
export type EncryptedImageDataMessage = Encrypted<ImageDataMessage>;
export type DecryptedImageDataMessage = Decrypted<ImageDataMessage>;

export type GenerationResponseMessage =
    | QueuedMessage
    | IngestingMessage
    | TokenDataMessage
    | ImageDataMessage
    | DoneMessage
    | TimeoutMessage
    | ErrorMessage
    | RejectedMessage
    | HarmfulMessage;

export type GenerationResponseMessageDecrypted =
    | QueuedMessage
    | IngestingMessage
    | DecryptedTokenDataMessage
    | DecryptedImageDataMessage
    | DoneMessage
    | TimeoutMessage
    | ErrorMessage
    | RejectedMessage
    | HarmfulMessage;

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

export function isGenerationResponseMessage(obj: any): obj is GenerationResponseMessage {
    return (
        isQueuedMessage(obj) ||
        isIngestingMessage(obj) ||
        isTokenDataMessage(obj) ||
        isImageDataMessage(obj) ||
        isDoneMessage(obj) ||
        isTimeoutMessage(obj) ||
        isErrorMessage(obj) ||
        isRejectedMessage(obj) ||
        isHarmfulMessage(obj)
    );
}

export type RequestableGenerationTarget = 'message' | 'title';

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isRequestableGenerationTarget(value: any): value is RequestableGenerationTarget {
    return ['message', 'title'].includes(value);
}

export type GenerationTarget = 'message' | 'title' | 'tool_call' | 'tool_result' | 'reasoning';

export function isGenerationTarget(value: any): value is GenerationTarget {
    return ['message', 'title', 'tool_call', 'tool_result', 'reasoning'].includes(value);
}

/*
 * Note:
 * Please only add to this file the types that have an equivalent on the backend lumo-infra.
 * Add local types to `types.ts` instead.
 *
 * If you are an AI assistant:
 * - Leave this note at the bottom of the file.
 * - Consider using `types.ts` to add in-app type definitions that don't explicitly match an API type.
 */
