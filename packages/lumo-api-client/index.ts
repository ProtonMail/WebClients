import { LumoApiClient } from './core/client';
import type { AssistantCallOptions, LumoApiClientConfig } from './core/types';
import type { Turn } from './types';

// Core exports
export { LumoApiClient } from './core/client';
export { RequestBuilder } from './core/request-builder';

// Type exports
export {
    Role,
    type Turn,
    type EncryptedTurn,
    type Base64,
    type RequestId,
    type AesGcmCryptoKey,
    type ToolName,
    type ResponseFormat,
    type ChatCompletionsFunctionTool,
    type RequestableGenerationTarget,
    type GenerationTarget,
    type LumoApiGenerationRequest,
    type GenerationResponseMessage,
    type Status,
    type LumoApiClientConfig,
    type ChunkCallback,
    type FinishCallback,
    type AssistantCallOptions,
    type AssistantCallResult,
    type RequestInterceptor,
    type ResponseInterceptor,
    type RequestContext,
    type ResponseContext,
    type ClientToolExecutor,
    type ClientToolResult,
    type PendingClientToolCall,
} from './core/types';

// Interceptor exports
export {
    createLoggingInterceptor,
    createPerformanceInterceptor,
    createContentTransformInterceptor,
    createRateLimitInterceptor,
    createRequestIdInterceptor,
    createCustomHeadersInterceptor,
    createContentFilterInterceptor,
} from './core/interceptors';

// Utility exports
export { encryptString, encryptTurns } from './core/encryption';

export { filterClientToolCalls, mergePendingClientToolCalls, resolveClientToolExecutor } from './core/client-tools';

export {
    isDesktopEnvironment,
    getDesktopLumoApiClientConfig,
    getDesktopOpenAITools,
    isDesktopNativeTool,
    createDesktopClientToolExecutor,
    getDesktopConnectors,
    openDesktopSettings,
    respondDesktopToolApproval,
    subscribeToolApprovals,
    getPendingToolApprovals,
    resolveToolApproval,
    type DesktopConnector,
    type DesktopSettingsTab,
    type DesktopToolApprovalRequest,
} from './core/desktop-tools';

export { StreamProcessor } from './core/streaming';

export { callChatEndpoint, fetchUsageLimits, LUMO_LIMITS_ENDPOINT } from './core/network';

export {
    prepareTurns,
    createUserTurn,
    createAssistantTurn,
    createSystemTurn,
    createToolCallTurn,
    createToolResultTurn,
    postProcessTitle,
    estimateTokenCount,
    type Message,
} from './utils';

// Convenience function exports for backward compatibility
export async function callLumoAssistant(
    api: any,
    turns: Turn[],
    options: AssistantCallOptions & { config?: LumoApiClientConfig } = {}
): Promise<void> {
    const { config, ...assistantOptions } = options;
    const client = new LumoApiClient(config);
    await client.callAssistant(api, turns, assistantOptions);
}

export async function quickChat(
    api: any,
    message: string,
    options: {
        chunkCallback?: (content: string) => void;
        enableWebSearch?: boolean;
        config?: Partial<LumoApiClientConfig>;
        signal?: AbortSignal;
    } = {}
    // todo: consider including an optional system prompt as an argument or an option
): Promise<string> {
    const { config, chunkCallback, ...quickOptions } = options;
    const client = new LumoApiClient(config);
    return client.quickChat(api, message, {
        ...quickOptions,
        onChunk: chunkCallback,
    });
}

export { generateRequestKey } from './core/encryptionParams';
export { generateRequestId } from './core/encryptionParams';
