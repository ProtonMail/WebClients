// FIXME FIXME FIXME
//
// Most of those types are duplicated from `applications/lumo/src/app/types-api.ts`!
// It would be wise to merge them to have a single source of truth.
// I'm not sure what is the best location: here (lib/lumo-api-client) or there (applications/lumo) -> TBD.
//
// FIXME FIXME FIXME
import type { WireImage } from '../../../types';

export type Role = 'assistant' | 'user' | 'system' | 'tool_call' | 'tool_result';

export type Turn = {
    role: Role;
    content?: string;
    encrypted?: boolean;
    images?: WireImage[];
};

export type EncryptedTurn = Turn & { encrypted: true };

export type Base64 = string;
export type RequestId = string;

export type AesGcmCryptoKey = {
    type: 'AesGcmCryptoKey';
    encryptKey: CryptoKey;
};

export type ToolName = 'proton_info' | 'web_search' | 'weather' | 'stock' | 'cryptocurrency' | 'generate_image';

export type RequestableGenerationTarget = 'message' | 'title';

export type GenerationTarget = 'message' | 'title' | 'tool_call' | 'tool_result';

export type LumoApiGenerationRequest = {
    type: 'generation_request';
    turns: Turn[];
    options?: {
        tools?: ToolName[] | boolean;
    };
    targets?: RequestableGenerationTarget[];
    request_key?: string; // aes-gcm-256, pgp-encrypted, base64
    request_id?: RequestId; // uuid used solely for AEAD encryption
};

// Type utilities for encryption state
export type Encrypted<T extends { encrypted?: boolean }> = Omit<T, 'encrypted'> & { encrypted: true };
export type Decrypted<T extends { encrypted?: boolean }> = Omit<T, 'encrypted'> & { encrypted?: false };

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
    data: string;
    is_final?: boolean;
    seed?: number;
    encrypted?: boolean;
};

export type EncryptedTokenDataMessage = Encrypted<TokenDataMessage>;
export type DecryptedTokenDataMessage = Decrypted<TokenDataMessage>;
export type EncryptedImageDataMessage = Encrypted<ImageDataMessage>;
export type DecryptedImageDataMessage = Decrypted<ImageDataMessage>;

export type DoneMessage = { type: 'done' };
export type TimeoutMessage = { type: 'timeout' };
export type ErrorMessage = { type: 'error' };
export type RejectedMessage = { type: 'rejected' };
export type HarmfulMessage = { type: 'harmful' };

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

export type Status = 'succeeded' | 'failed';

// Configuration interfaces
export interface LumoApiClientConfig {
    enableU2LEncryption?: boolean;
    enableSmoothing?: boolean;
    endpoint?: string;
    lumoPubKey?: string;
    externalTools?: ToolName[];
    internalTools?: ToolName[];
    interceptors?: {
        request?: RequestInterceptor[];
        response?: ResponseInterceptor[];
    };
}

// Callback types
export type ChunkCallback = (message: GenerationResponseMessage) => Promise<{ error?: any }> | { error?: any };
export type FinishCallback = (status: Status) => Promise<void> | void;

// Options interface
export interface AssistantCallOptions {
    chunkCallback?: ChunkCallback;
    finishCallback?: FinishCallback;
    signal?: AbortSignal;
    enableExternalTools?: boolean;
    requestKey?: AesGcmCryptoKey;
    requestId?: RequestId;
    requestTitle?: boolean;
    autoGenerateEncryption?: boolean;
}

// Type guards
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
    const isValid =
        typeof obj === 'object' &&
        obj !== null &&
        obj.type === 'image_data' &&
        (!('image_id' in obj) || typeof obj.image_id === 'string') &&
        (!('data' in obj) || typeof obj.data === 'string') &&
        (!('is_final' in obj) || typeof obj.is_final === 'boolean') &&
        (!('seed' in obj) || typeof obj.seed === 'number') &&
        (!('encrypted' in obj) || typeof obj.encrypted === 'boolean');
    if (!isValid) {
        console.warn('[IMAGE_DATA] Type guard failed:', obj);
    }
    return isValid;
}

// Type guard utilities for encryption state
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

export function isGenerationTarget(value: any): value is GenerationTarget {
    return ['message', 'title', 'tool_call', 'tool_result'].includes(value);
}

/**
 * Request interceptor function type
 */
export interface RequestInterceptor {
    /**
     * Called before the request is sent
     * @param request - The request being sent
     * @param context - Additional context about the request
     * @returns Modified request or the original request
     */
    onRequest?: (
        request: LumoApiGenerationRequest,
        context: RequestContext
    ) => Promise<LumoApiGenerationRequest> | LumoApiGenerationRequest;

    /**
     * Called if the request fails before being sent
     * @param error - The error that occurred
     * @param context - Additional context about the request
     */
    onRequestError?: (error: Error, context: RequestContext) => Promise<void> | void;
}

/**
 * Response interceptor function type
 */
export interface ResponseInterceptor {
    /**
     * Called when a response chunk is received
     * @param chunk - The response chunk
     * @param context - Additional context about the response
     * @returns Modified chunk or the original chunk
     */
    onResponseChunk?: (
        chunk: GenerationResponseMessage,
        context: ResponseContext
    ) => Promise<GenerationResponseMessage> | GenerationResponseMessage;

    /**
     * Called when the response is complete
     * @param status - The final status
     * @param context - Additional context about the response
     */
    onResponseComplete?: (status: Status, context: ResponseContext) => Promise<void> | void;

    /**
     * Called if the response fails
     * @param error - The error that occurred
     * @param context - Additional context about the response
     */
    onResponseError?: (error: Error, context: ResponseContext) => Promise<void> | void;
}

/**
 * Context provided to request interceptors
 */
export interface RequestContext {
    requestId: string;
    timestamp: number;
    endpoint: string;
    enableU2LEncryption: boolean;
    enableExternalTools: boolean;
    metadata?: Record<string, any>;
}

/**
 * Context provided to response interceptors
 */
export interface ResponseContext extends RequestContext {
    startTime: number;
    chunkCount: number;
    totalContentLength: number;
}
