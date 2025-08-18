import type { Api } from '@proton/shared/lib/interfaces';

import type { GenerationToFrontendMessage } from '../../../types-api';
import {
    DEFAULT_LUMO_PUB_KEY,
    decryptContent,
    encryptTurns,
    generateRequestId,
    generateRequestKey,
    prepareEncryptedRequestKey,
} from './encryption';
import { callEndpoint } from './network';
import { RequestBuilder } from './request-builder';
import { StreamProcessor } from './streaming';
import type {
    AssistantCallOptions,
    LumoApiClientConfig,
    LumoApiGenerationRequest,
    RequestContext,
    RequestInterceptor,
    RequestableGenerationTarget,
    ResponseContext,
    ResponseInterceptor,
    Status,
    Turn,
} from './types';

// Default configuration

// Default configuration
const DEFAULT_CONFIG: Required<LumoApiClientConfig> = {
    enableU2LEncryption: true,
    endpoint: '', // No custom endpoint by default
    lumoPubKey: DEFAULT_LUMO_PUB_KEY,
    externalTools: ['web_search', 'weather', 'stock', 'cryptocurrency'],
    internalTools: ['proton_info'],
    interceptors: {
        request: [],
        response: [],
    },
};

/**
 * Main LLM API Client class
 */
export class LumoApiClient {
    private config: Required<LumoApiClientConfig>;

    constructor(config: LumoApiClientConfig = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Call the Lumo Assistant API
     * @param api - Proton API instance
     * @param turns - Array of conversation turns
     * @param options - Request options
     * @returns Promise that resolves when the generation is complete
     */
    async callAssistant(api: Api, turns: Turn[], options: AssistantCallOptions = {}): Promise<void> {
        const {
            chunkCallback,
            finishCallback,
            signal,
            enableExternalTools = false,
            requestKey: providedRequestKey,
            requestId: providedRequestId,
            requestTitle = false,
            autoGenerateEncryption = true,
        } = options;
        const { enableU2LEncryption, lumoPubKey, internalTools, externalTools, endpoint } = this.config;

        // Auto-generate encryption keys if needed and not provided
        let requestKey = providedRequestKey;
        let requestId = providedRequestId;

        // TODO Print warnings in case the caller uses an invalid combo of options.
        //      The spec is that only these cases are allowed:
        //      - requestKey set, requestid set, autoGenerateEncryption = false
        //      - requestKey unset, requestid unset, autoGenerateEncryption = true or false
        if (enableU2LEncryption && autoGenerateEncryption && (!requestKey || !requestId)) {
            if (!requestKey) {
                requestKey = await generateRequestKey();
            }
            if (!requestId) {
                requestId = generateRequestId();
            }
        }

        // Setup U2L encryption
        let requestKeyEncB64: string | undefined = undefined;
        let processedTurns = turns;

        if (enableU2LEncryption) {
            if (!requestKey || !requestId) {
                throw new Error('Cannot use U2L encryption without request key and request id');
            }

            requestKeyEncB64 = await prepareEncryptedRequestKey(requestKey, lumoPubKey);
            processedTurns = await encryptTurns(turns, requestKey, requestId);
        }

        // Determine request targets
        const targets: RequestableGenerationTarget[] = requestTitle ? ['title', 'message'] : ['message'];

        // Prepare the request
        let request: LumoApiGenerationRequest = {
            type: 'generation_request',
            turns: processedTurns,
            options: {
                tools: enableExternalTools ? [...internalTools, ...externalTools] : internalTools,
            },
            targets,
            request_key: requestKeyEncB64,
            request_id: requestId,
        };

        const requestContext: RequestContext = {
            requestId: requestId || '<none>',
            timestamp: Date.now(),
            endpoint,
            enableU2LEncryption,
            enableExternalTools,
        };

        // Run request interceptors
        try {
            request = await this.notifyRequest(request, requestContext);
        } catch (error: any) {
            // Run request error interceptors
            await this.notifyRequestError(error, requestContext);
            throw error;
        }

        // Prepare payload
        const payload = {
            Prompt: request,
        };

        // Final status will be changed to succeeded on success
        let finalStatus: Status = 'failed';

        // Response context for interceptors
        const responseContext: ResponseContext = {
            ...requestContext,
            startTime: Date.now(),
            chunkCount: 0,
            totalContentLength: 0,
        };

        // Call server and read the streamed result
        try {
            const responseBody = await callEndpoint(api, payload, {
                endpoint,
                signal,
            });

            const reader = responseBody.getReader();
            const decoder = new TextDecoder('utf-8');
            const processor = new StreamProcessor();

            while (true) {
                // Manual signal check since API wrapper does not preserve abort signal connection to streams
                if (signal?.aborted) {
                    throw new DOMException('Aborted', 'AbortError');
                }

                const { done, value } = await reader.read();
                if (done) {
                    finalStatus = 'succeeded';
                    break;
                }
                if (!value) continue;

                const s = decoder.decode(value, { stream: true });
                if (s === '') continue;

                // todo: deduplicate complex logic (copy #1)
                const parsedData = processor.processChunk(s);
                for (const chunk of parsedData) {
                    // Decrypt chunk content if needed
                    let processedChunk = chunk;
                    if (
                        chunk.type === 'token_data' &&
                        chunk.encrypted &&
                        enableU2LEncryption &&
                        requestKey &&
                        requestId
                    ) {
                        try {
                            const adString = `lumo.response.${requestId}.chunk`;
                            const decryptedContent = await decryptContent(chunk.content, requestKey, adString);
                            processedChunk = {
                                ...chunk,
                                content: decryptedContent,
                                encrypted: false,
                            };
                        } catch (error) {
                            console.error('Failed to decrypt chunk:', error);
                            // Continue with encrypted content - let the callback handle it
                            // FIXME I don't think it's a good idea to pass the encrypted content to the callback in
                            //  case of error. It means we could start displaying gibberish base64 inside the Lumo UI
                            //  instead of properly failing.
                        }
                    }

                    // Update response context
                    responseContext.chunkCount++;
                    if (processedChunk.type === 'token_data') {
                        responseContext.totalContentLength += processedChunk.content.length;
                    }

                    // Run response chunk interceptors
                    try {
                        processedChunk = await this.notifyResponse(processedChunk, responseContext);
                    } catch (error: any) {
                        // Run response error interceptors
                        await this.notifyResponseError(error, responseContext);
                        throw error;
                    }

                    if (chunkCallback) {
                        const result = await chunkCallback(processedChunk);
                        if (result && result.error) {
                            throw result.error;
                        }
                    }
                }
            }

            // Process any remaining data
            // todo: deduplicate complex logic (copy #2)
            const parsedData = processor.finalize();
            for (const chunk of parsedData) {
                // Decrypt chunk content if needed
                let processedChunk = chunk;
                if (chunk.type === 'token_data' && chunk.encrypted && enableU2LEncryption && requestKey && requestId) {
                    try {
                        const adString = `lumo.response.${requestId}.chunk`;
                        const decryptedContent = await decryptContent(chunk.content, requestKey, adString);
                        processedChunk = {
                            ...chunk,
                            content: decryptedContent,
                            encrypted: false,
                        };
                    } catch (error) {
                        console.error('Failed to decrypt chunk:', error);
                        // Continue with encrypted content - let the callback handle it
                    }
                }

                // Update response context
                responseContext.chunkCount++;
                if (processedChunk.type === 'token_data') {
                    responseContext.totalContentLength += processedChunk.content.length;
                }

                // Run response chunk interceptors
                try {
                    processedChunk = await this.notifyResponse(processedChunk, responseContext);
                } catch (error: any) {
                    // Run response error interceptors
                    await this.notifyResponseError(error, responseContext);
                    throw error;
                }

                if (chunkCallback) {
                    const result = await chunkCallback(processedChunk);
                    if (result && result.error) {
                        throw result.error;
                    }
                }
            }

            // Run response complete interceptors
            await this.notifyResponseComplete(finalStatus, responseContext);
        } catch (error: any) {
            // Run response error interceptors
            await this.notifyResponseError(error, responseContext);
            if (error.name === 'AbortError') {
                console.warn('Generation aborted');
                finalStatus = 'succeeded';
                return; // Don't re-throw AbortError, finish gracefully
            }
            throw error;
        } finally {
            if (finishCallback) {
                await finishCallback(finalStatus);
            }
        }
    }

    private async notifyResponseComplete(finalStatus: 'failed' | 'succeeded', responseContext: ResponseContext) {
        for (const interceptor of this.config.interceptors.response || []) {
            if (interceptor.onResponseComplete) {
                await interceptor.onResponseComplete(finalStatus, responseContext);
            }
        }
    }

    private async notifyResponse(processedChunk: GenerationToFrontendMessage, responseContext: ResponseContext) {
        // FIXME: The code supports modifying the response chunk, but I don't think we ever need to do it in
        //        fact. This is further highlighted by the fact that the function
        //        createContentTransformInterceptor() is never used.
        //        Another fundamental reason is that we almost never need to transform the individual chunks
        //        ("hel", "lo", " wor", "ld\n\n") but we often need to transform the overall concatenated string
        //        ("hello world\n\n" needs trimming)
        //        TLDR: remove the transform capability
        for (const interceptor of this.config.interceptors.response || []) {
            if (interceptor.onResponseChunk) {
                processedChunk = await interceptor.onResponseChunk(processedChunk, responseContext);
            }
        }
        return processedChunk;
    }

    private async notifyRequest(request: LumoApiGenerationRequest, requestContext: RequestContext) {
        for (const interceptor of this.config.interceptors.request || []) {
            if (interceptor.onRequest) {
                request = await interceptor.onRequest(request, requestContext);
            }
        }
        return request;
    }

    private async notifyRequestError(error: any, requestContext: RequestContext) {
        for (const interceptor of this.config.interceptors.request || []) {
            if (interceptor.onRequestError) {
                await interceptor.onRequestError(error, requestContext);
            }
        }
    }

    private async notifyResponseError(error: any, responseContext: ResponseContext) {
        for (const interceptor of this.config.interceptors.response || []) {
            if (interceptor.onResponseError) {
                await interceptor.onResponseError(error, responseContext);
            }
        }
    }

    /**
     * Simplified method for quick conversations
     */
    async quickChat(
        api: Api,
        message: string,
        options: {
            enableWebSearch?: boolean;
            onChunk?: (content: string) => void;
            signal?: AbortSignal;
        } = {}
    ): Promise<string> {
        const { enableWebSearch = false, onChunk, signal } = options;
        let response = '';

        await this.callAssistant(api, [{ role: 'user', content: message }], {
            enableExternalTools: enableWebSearch,
            signal,
            chunkCallback: async (msg) => {
                if (msg.type === 'token_data' && msg.target === 'message') {
                    response += msg.content;
                    onChunk?.(msg.content);
                }
                return {};
            },
        });

        return response;
    }

    /**
     * Create a new request builder for fluent API
     * @returns RequestBuilder instance
     */
    createRequest(): RequestBuilder {
        return new RequestBuilder();
    }

    /**
     * Execute a request builder
     * @param builder RequestBuilder instance
     * @param api Proton API instance
     * @returns Promise that resolves when the request completes
     */
    async executeRequest(builder: RequestBuilder, api: Api): Promise<void> {
        const turns = builder.getTurns();
        const options = builder.getOptions();
        await this.callAssistant(api, turns, options as AssistantCallOptions);
    }

    /**
     * Execute a quick chat request builder
     * @param builder RequestBuilder instance
     * @param api Proton API instance
     * @returns Promise that resolves with the response content
     */
    async executeQuickRequest(builder: RequestBuilder, api: Api): Promise<string> {
        const turns = builder.getTurns();

        if (turns.length !== 1 || turns[0].role !== 'user') {
            throw new Error('Quick requests must contain exactly one user message');
        }

        const options = builder.getOptions();
        return this.quickChat(api, turns[0].content || '', {
            enableWebSearch: options.enableExternalTools,
            signal: options.signal,
        });
    }

    /**
     * Get the current configuration
     * @returns Current client configuration
     */
    getConfig(): Readonly<Required<LumoApiClientConfig>> {
        return { ...this.config };
    }

    /**
     * Update the client configuration
     * @param config Partial configuration to merge with current config
     */
    updateConfig(config: Partial<LumoApiClientConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Add a request interceptor
     * @param interceptor - Request interceptor to add
     */
    addRequestInterceptor(interceptor: RequestInterceptor): void {
        if (!this.config.interceptors.request) {
            this.config.interceptors.request = [];
        }
        this.config.interceptors.request.push(interceptor);
    }

    /**
     * Add a response interceptor
     * @param interceptor - Response interceptor to add
     */
    addResponseInterceptor(interceptor: ResponseInterceptor): void {
        if (!this.config.interceptors.response) {
            this.config.interceptors.response = [];
        }
        this.config.interceptors.response.push(interceptor);
    }

    /**
     * Remove all interceptors
     */
    clearInterceptors(): void {
        this.config.interceptors.request = [];
        this.config.interceptors.response = [];
    }

    /**
     * Remove request interceptors
     */
    clearRequestInterceptors(): void {
        this.config.interceptors.request = [];
    }

    /**
     * Remove response interceptors
     */
    clearResponseInterceptors(): void {
        this.config.interceptors.response = [];
    }
}
