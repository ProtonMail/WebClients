import type {
    GenerationResponseMessage,
    LumoApiGenerationRequest,
    RequestContext,
    RequestInterceptor,
    ResponseContext,
    ResponseInterceptor,
    Status,
} from './types';

/**
 * Built-in interceptors for common use cases
 */

/**
 * Logging interceptor for debugging
 */
export const createLoggingInterceptor = (
    options: {
        logRequests?: boolean;
        logResponses?: boolean;
        logTiming?: boolean;
        prefix?: string;
    } = {}
): RequestInterceptor & ResponseInterceptor => {
    const { logRequests = true, logResponses = true, logTiming = true, prefix = '[Lumo API]' } = options;

    return {
        onRequest: (request: LumoApiGenerationRequest, context: RequestContext) => {
            if (logRequests) {
                console.log(`${prefix} Request:`, {
                    requestId: context.requestId,
                    endpoint: context.endpoint,
                    turns: request.turns.length,
                    tools: request.options?.tools,
                    timestamp: new Date(context.timestamp).toISOString(),
                });
            }
            return request;
        },

        onResponseChunk: (chunk: GenerationResponseMessage, context: ResponseContext) => {
            if (logResponses && chunk.type === 'token_data') {
                console.log(`${prefix} Chunk:`, {
                    requestId: context.requestId,
                    target: chunk.target,
                    contentLength: chunk.content.length,
                    chunkNumber: context.chunkCount,
                });
            }
            return chunk;
        },

        onResponseComplete: (status: Status, context: ResponseContext) => {
            if (logTiming) {
                const duration = Date.now() - context.startTime;
                console.log(`${prefix} Complete:`, {
                    requestId: context.requestId,
                    status,
                    duration: `${duration}ms`,
                    totalChunks: context.chunkCount,
                    totalContentLength: context.totalContentLength,
                });
            }
        },

        onRequestError: (error: Error, context: RequestContext) => {
            console.error(`${prefix} Request Error:`, {
                requestId: context.requestId,
                error: error.message,
                endpoint: context.endpoint,
            });
        },

        onResponseError: (error: Error, context: ResponseContext) => {
            console.error(`${prefix} Response Error:`, {
                requestId: context.requestId,
                error: error.message,
                duration: `${Date.now() - context.startTime}ms`,
                chunksReceived: context.chunkCount,
            });
        },
    };
};

// todo try to unifiy with RequestContext
type MetricsContext = {
    requestId: string;
    endpoint: string;
    duration: number;
    chunkCount: number;
    contentLength: number;
    status: Status;
    error?: Error;
};

/**
 * Performance monitoring interceptor
 */
export const createPerformanceInterceptor = (
    onMetrics?: (metrics: MetricsContext) => void
): RequestInterceptor & ResponseInterceptor => {
    const requestTimes = new Map<string, number>();

    return {
        onRequest: (request: LumoApiGenerationRequest, context: RequestContext) => {
            requestTimes.set(context.requestId, context.timestamp);
            return request;
        },

        onResponseComplete: (status: Status, context: ResponseContext) => {
            const startTime = requestTimes.get(context.requestId) || context.startTime;
            const duration = Date.now() - startTime;

            if (onMetrics) {
                onMetrics({
                    requestId: context.requestId,
                    endpoint: context.endpoint,
                    duration,
                    chunkCount: context.chunkCount,
                    contentLength: context.totalContentLength,
                    status,
                });
            }

            requestTimes.delete(context.requestId);
        },

        onResponseError: (error: Error, context: ResponseContext) => {
            const startTime = requestTimes.get(context.requestId) || context.startTime;
            const duration = Date.now() - startTime;

            if (onMetrics) {
                onMetrics({
                    requestId: context.requestId,
                    endpoint: context.endpoint,
                    duration,
                    chunkCount: context.chunkCount,
                    contentLength: context.totalContentLength,
                    status: 'failed',
                    error,
                });
            }

            requestTimes.delete(context.requestId);
        },
    };
};

/**
 * Content transformation interceptor
 */
export const createContentTransformInterceptor = (
    transform: (content: string, context: ResponseContext) => string
): ResponseInterceptor => ({
    onResponseChunk: (chunk: GenerationResponseMessage, context: ResponseContext) => {
        if (chunk.type === 'token_data' && chunk.target === 'message') {
            return {
                ...chunk,
                content: transform(chunk.content, context),
            };
        }
        return chunk;
    },
});

/**
 * Rate limiting interceptor
 */
export const createRateLimitInterceptor = (maxRequestsPerMinute: number): RequestInterceptor => {
    const requestTimes: number[] = [];

    return {
        onRequest: (request: LumoApiGenerationRequest, context: RequestContext) => {
            const now = Date.now();
            const oneMinuteAgo = now - 60000;

            // Remove old requests
            while (requestTimes.length > 0 && requestTimes[0] < oneMinuteAgo) {
                requestTimes.shift();
            }

            // Check rate limit
            if (requestTimes.length >= maxRequestsPerMinute) {
                throw new Error(`Rate limit exceeded: ${maxRequestsPerMinute} requests per minute`);
            }

            requestTimes.push(now);
            return request;
        },
    };
};

/**
 * Request ID injection interceptor
 */
export const createRequestIdInterceptor = (onRequestId?: (requestId: string) => void): RequestInterceptor => ({
    onRequest: (request: LumoApiGenerationRequest, context: RequestContext) => {
        if (onRequestId) {
            onRequestId(context.requestId);
        }
        return request;
    },
});

/**
 * Custom headers interceptor (for when using custom endpoints)
 */
export const createCustomHeadersInterceptor = (headers: Record<string, string>): RequestInterceptor => ({
    onRequest: (request: LumoApiGenerationRequest, context: RequestContext) => {
        // Store headers in context metadata for the network layer to use
        context.metadata = {
            ...context.metadata,
            customHeaders: headers,
        };
        return request;
    },
});

/**
 * Content filtering interceptor
 */
export const createContentFilterInterceptor = (filter: (content: string) => string): ResponseInterceptor => ({
    onResponseChunk: (chunk: GenerationResponseMessage, context: ResponseContext) => {
        if (chunk.type === 'token_data') {
            return {
                ...chunk,
                content: filter(chunk.content),
            };
        }
        return chunk;
    },
});
