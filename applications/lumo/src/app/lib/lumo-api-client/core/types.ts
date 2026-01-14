/* eslint-disable no-duplicate-imports */

/* Types for the lumo-api-client library.
 *
 * This file contains:
 * 1. Library-internal types (config, callbacks, interceptors)
 * 2. Re-exports from types-api.ts (backend API types)
 * 3. Re-exports from types.ts (app-wide types)
 *
 * Most types are re-exported to avoid breaking existing imports within the library.
 */

import type { AesGcmCryptoKey } from '../../../crypto/types';
import type { Base64, RequestId, Status } from '../../../types';
import {
    type ChatEndpointGenerationRequest,
    type Decrypted,
    type DecryptedImageDataMessage,
    type DecryptedTokenDataMessage,
    type DoneMessage,
    type Encrypted,
    type EncryptedImageDataMessage,
    type EncryptedTokenDataMessage,
    type EncryptedWireTurn,
    type ErrorMessage,
    type GenerationResponseMessage,
    type GenerationResponseMessageDecrypted,
    type GenerationTarget,
    type HarmfulMessage,
    type ImageDataMessage,
    type IngestingMessage,
    type LumoApiGenerationRequest,
    type QueuedMessage,
    type RejectedMessage,
    type RequestableGenerationTarget,
    Role,
    type TimeoutMessage,
    type TokenDataMessage,
    type ToolName,
    type UnencryptedWireTurn,
    type WireImage,
    type WireTurn,
} from '../../../types-api';
import {
    isDecrypted,
    isDecryptedImageDataMessage,
    isDecryptedTokenDataMessage,
    isDoneMessage,
    isEncrypted,
    isEncryptedImageDataMessage,
    isEncryptedTokenDataMessage,
    isEncryptedWireTurn,
    isErrorMessage,
    isGenerationResponseMessage,
    isGenerationTarget,
    isHarmfulMessage,
    isImageDataMessage,
    isIngestingMessage,
    isQueuedMessage,
    isRejectedMessage,
    isTimeoutMessage,
    isTokenDataMessage,
    isUnencryptedWireTurn,
    isWireTurn,
} from '../../../types-api';

// Re-export types with aliases
export {
    type ChatEndpointGenerationRequest,
    type Decrypted,
    type DecryptedImageDataMessage,
    type DecryptedTokenDataMessage,
    type DoneMessage,
    type Encrypted,
    type EncryptedImageDataMessage,
    type EncryptedTokenDataMessage,
    type ErrorMessage,
    type GenerationResponseMessage,
    type GenerationResponseMessageDecrypted,
    type GenerationTarget,
    type HarmfulMessage,
    type ImageDataMessage,
    type IngestingMessage,
    type LumoApiGenerationRequest,
    type QueuedMessage,
    type RejectedMessage,
    type RequestableGenerationTarget,
    Role,
    type TimeoutMessage,
    type TokenDataMessage,
    type ToolName,
    type WireImage,
};
export type EncryptedTurn = EncryptedWireTurn;
export type UnencryptedTurn = UnencryptedWireTurn;
export type Turn = WireTurn;

// Re-export functions with aliases
export {
    isDecrypted,
    isDecryptedImageDataMessage,
    isDecryptedTokenDataMessage,
    isDoneMessage,
    isEncrypted,
    isEncryptedImageDataMessage,
    isEncryptedTokenDataMessage,
    isErrorMessage,
    isGenerationResponseMessage,
    isGenerationTarget,
    isHarmfulMessage,
    isImageDataMessage,
    isIngestingMessage,
    isQueuedMessage,
    isRejectedMessage,
    isTimeoutMessage,
    isTokenDataMessage,
};
export const isEncryptedTurn = isEncryptedWireTurn;
export const isUnencryptedTurn = isUnencryptedWireTurn;
export const isTurn = isWireTurn;

export type { Base64, RequestId, Status };

export type { AesGcmCryptoKey };

// *** Library-internal types (lumo-api-client only) ***

// Configuration interfaces
export interface LumoApiClientConfig {
    enableU2LEncryption: boolean;
    enableSmoothing: boolean;
    endpoint: string;
    lumoPubKey: string;
    externalTools: ToolName[];
    internalTools: ToolName[];
    imageTools: ToolName[];
    interceptors: {
        request?: RequestInterceptor[];
        response?: ResponseInterceptor[];
    };
}

// Callback types
export type ChunkCallback = (message: GenerationResponseMessage) => Promise<void> | void;
export type FinishCallback = (status: Status) => Promise<void> | void;

// Options interface
export interface AssistantCallOptions {
    chunkCallback?: ChunkCallback;
    finishCallback?: FinishCallback;
    signal?: AbortSignal;
    enableExternalTools?: boolean;
    enableImageTools?: boolean,
    requestKey?: AesGcmCryptoKey;
    requestId?: RequestId;
    generateTitle?: boolean;
    autoGenerateEncryption?: boolean;
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
