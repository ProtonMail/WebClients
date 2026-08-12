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
import type { AesGcmCryptoKey } from '../crypto/types';
import type { Base64, RequestId, Status } from '../types';
import {
    type ChatCompletionsFunctionTool,
    type ChatCompletionsRequest,
    type ChatEndpointGenerationRequest,
    type Decrypted,
    type DecryptedImageDataMessage,
    type DecryptedServerToolCallMessage,
    type DecryptedServerToolResultMessage,
    type DecryptedTokenDataMessage,
    type DoneMessage,
    type Encrypted,
    type EncryptedImageDataMessage,
    type EncryptedServerToolCallMessage,
    type EncryptedServerToolResultMessage,
    type EncryptedTokenDataMessage,
    type EncryptedWireTurn,
    type ErrorMessage,
    type GenerationResponseMessage,
    type GenerationResponseMessageDecrypted,
    type GenerationTarget,
    type HarmfulMessage,
    type ImageAspectRatio,
    type ImageDataMessage,
    type IngestingMessage,
    type LumoApiGenerationRequest,
    type LumoCompletionTarget,
    type QueuedMessage,
    type RejectedMessage,
    type RequestableGenerationTarget,
    type ResponseFormat,
    Role,
    type ServerToolCallMessage,
    type ServerToolResultMessage,
    type TimeoutMessage,
    type TokenDataMessage,
    type ToolName,
    type WireImage,
    type WireTurn,
} from '../types-api';
import {
    isDecrypted,
    isDecryptedImageDataMessage,
    isDecryptedServerToolCallMessage,
    isDecryptedServerToolResultMessage,
    isDecryptedTokenDataMessage,
    isDoneMessage,
    isEncrypted,
    isEncryptedImageDataMessage,
    isEncryptedServerToolCallMessage,
    isEncryptedServerToolResultMessage,
    isEncryptedTokenDataMessage,
    isErrorMessage,
    isGenerationResponseMessage,
    isGenerationTarget,
    isHarmfulMessage,
    isImageDataMessage,
    isIngestingMessage,
    isQueuedMessage,
    isRejectedMessage,
    isServerToolCallMessage,
    isServerToolResultMessage,
    isTimeoutMessage,
    isTokenDataMessage,
} from '../types-api';
import type { ClientToolExecutor, ClientToolResult, PendingClientToolCall } from './client-tools';

// Re-export types with aliases
export {
    type ChatCompletionsFunctionTool,
    type ChatCompletionsRequest,
    type ChatEndpointGenerationRequest,
    type Decrypted,
    type DecryptedImageDataMessage,
    type DecryptedServerToolCallMessage,
    type DecryptedServerToolResultMessage,
    type DecryptedTokenDataMessage,
    type DoneMessage,
    type Encrypted,
    type EncryptedImageDataMessage,
    type EncryptedServerToolCallMessage,
    type EncryptedServerToolResultMessage,
    type EncryptedTokenDataMessage,
    type ErrorMessage,
    type GenerationResponseMessage,
    type GenerationResponseMessageDecrypted,
    type GenerationTarget,
    type HarmfulMessage,
    type ImageAspectRatio,
    type ImageDataMessage,
    type IngestingMessage,
    type LumoApiGenerationRequest,
    type LumoCompletionTarget,
    type QueuedMessage,
    type RejectedMessage,
    type RequestableGenerationTarget,
    type ResponseFormat,
    Role,
    type ServerToolCallMessage,
    type ServerToolResultMessage,
    type TimeoutMessage,
    type TokenDataMessage,
    type ToolName,
    type WireImage,
};
export type EncryptedTurn = EncryptedWireTurn;
export type Turn = WireTurn;

// Re-export functions with aliases
export {
    isDecrypted,
    isDecryptedImageDataMessage,
    isDecryptedServerToolCallMessage,
    isDecryptedServerToolResultMessage,
    isDecryptedTokenDataMessage,
    isDoneMessage,
    isEncrypted,
    isEncryptedImageDataMessage,
    isEncryptedServerToolCallMessage,
    isEncryptedServerToolResultMessage,
    isEncryptedTokenDataMessage,
    isErrorMessage,
    isGenerationResponseMessage,
    isGenerationTarget,
    isHarmfulMessage,
    isImageDataMessage,
    isIngestingMessage,
    isQueuedMessage,
    isRejectedMessage,
    isServerToolCallMessage,
    isServerToolResultMessage,
    isTimeoutMessage,
    isTokenDataMessage,
};

export type { Base64, RequestId, Status };

export type { AesGcmCryptoKey };

export type { ClientToolExecutor, ClientToolResult, PendingClientToolCall };

// *** Library-internal types (lumo-api-client only) ***

// Configuration interfaces
export interface LumoApiClientConfig {
    enableU2LEncryption: boolean;
    enableSmoothing: boolean;
    endpoint: string;
    lumoPubKey: string;
    externalTools: ToolName[];
    imageTools: ToolName[];
    /** When true and no `clientToolExecutor` is supplied, registers the Lumo Desktop bridge executor. */
    enableDesktopTools: boolean;
    interceptors: {
        request?: RequestInterceptor[];
        response?: ResponseInterceptor[];
    };
}

// Callback types
export type ChunkCallback = (message: GenerationResponseMessage) => Promise<void> | void;
export type FinishCallback = (status: Status) => Promise<void> | void;

// Options interface -
export interface AssistantCallOptions {
    chunkCallback?: ChunkCallback;
    finishCallback?: FinishCallback;
    signal?: AbortSignal;
    enableExternalTools?: boolean;
    enableImageTools?: boolean;
    enableReasoning?: boolean;
    modelTier?: 'auto' | 'lumo-lite' | 'lumo-max';
    enableSuggestedQuestions?: boolean;
    /** Auto-register the Lumo Desktop bridge executor when no `clientToolExecutor` is supplied. Default: false. */
    enableDesktopTools?: boolean;
    requestKey?: AesGcmCryptoKey;
    requestId?: RequestId;
    generateTitle?: boolean;
    autoGenerateEncryption?: boolean;
    imageAspectRatio?: ImageAspectRatio;
    /**
     * OpenAI structured-outputs response format. When set, the model's streamed output for the
     * main message is constrained to the given JSON schema (title/suggested-question generation
     * is unaffected).
     */
    responseFormat?: ResponseFormat;
    /**
     * Client-defined function tools (OpenAI shape) advertised on the wire alongside any server
     * tools. The model emits `delta.tool_calls` against these; a {@link ClientToolExecutor}
     * runs them and feeds results back as tool turns. Omit execution by leaving
     * `clientToolExecutor` unset — the stream still emits tool_call chunks for an external loop.
     */
    clientTools?: ChatCompletionsFunctionTool[];
    /**
     * Built-in server-side tools (e.g. `web_search`) to advertise alongside `clientTools`. The
     * backend runs these worker-side and folds the result back into the same stream.
     */
    serverTools?: ToolName[];
    /**
     * Product-supplied executor for client-side tool calls. When set (or when `enableDesktopTools`
     * auto-registers the desktop bridge), `callAssistant` runs a multi-round loop. Implement
     * human-in-the-loop approval inside `execute()` before running mutation handlers.
     */
    clientToolExecutor?: ClientToolExecutor;
}

export interface AssistantCallResult {
    status: Status;
    /** The chain ran out of client-tool rounds mid-task, so the model never got to close it off. */
    stoppedOnBudget: boolean;
    /**
     * The chain as it stands, ending on an empty assistant turn — pass it back to carry on from a
     * `stoppedOnBudget` stop. Only meaningful then: on a normal finish the closing answer is not in it.
     */
    turns: Turn[];
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
