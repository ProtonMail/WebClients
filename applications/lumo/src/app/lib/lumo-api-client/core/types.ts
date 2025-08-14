// FIXME FIXME FIXME
//
// Most of those types are duplicated from `applications/lumo/src/app/types-api.ts`!
// It would be wise to merge them to have a single source of truth.
// I'm not sure what is the best location: here (lib/lumo-api-client) or there (applications/lumo) -> TBD.
//
// FIXME FIXME FIXME

export type Role = 'assistant' | 'user' | 'system' | 'tool_call' | 'tool_result';

export type Turn = {
    role: Role;
    content?: string;
    encrypted?: boolean;
};

export type EncryptedTurn = Turn & { encrypted: true };

export type Base64 = string;
export type RequestId = string;

export type AesGcmCryptoKey = {
    type: 'AesGcmCryptoKey';
    encryptKey: CryptoKey;
};

export type ToolName = 'proton_info' | 'web_search' | 'weather' | 'stock' | 'cryptocurrency';

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

export type GenerationToFrontendMessage =
    | { type: 'queued'; target?: GenerationTarget }
    | { type: 'ingesting'; target: GenerationTarget }
    | { type: 'token_data'; target: GenerationTarget; count: number; content: string; encrypted?: boolean }
    | { type: 'done' }
    | { type: 'timeout' }
    | { type: 'error' }
    | { type: 'rejected' }
    | { type: 'harmful' };

export type Status = 'succeeded' | 'failed';

// Configuration interfaces
export interface LumoApiClientConfig {
    enableU2LEncryption?: boolean;
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
export type ChunkCallback = (message: GenerationToFrontendMessage) => Promise<{ error?: any }> | { error?: any };
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
export function isGenerationToFrontendMessage(obj: any): obj is GenerationToFrontendMessage {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }

    if (!('type' in obj)) {
        return false;
    }

    switch (obj.type) {
        case 'queued':
        case 'ingesting':
        case 'done':
        case 'timeout':
        case 'error':
        case 'rejected':
        case 'harmful':
            return true;

        case 'token_data':
            return (
                'target' in obj &&
                'count' in obj &&
                'content' in obj &&
                isGenerationTarget(obj.target) &&
                typeof obj.count === 'number' &&
                typeof obj.content === 'string' &&
                (!('encrypted' in obj) || typeof obj.encrypted === 'boolean')
            );

        default:
            return false;
    }
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
        chunk: GenerationToFrontendMessage,
        context: ResponseContext
    ) => Promise<GenerationToFrontendMessage> | GenerationToFrontendMessage;

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
