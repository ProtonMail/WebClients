import { v4 as uuidv4 } from 'uuid';

import type { Api } from '@proton/shared/lib/interfaces';

import { when } from '../../../util/collections';
import { DEFAULT_LUMO_PUB_KEY, encryptTurns } from './encryption';
import { RequestEncryptionParams } from './encryptionParams';
import { LUMO_CHAT_ENDPOINT, callChatEndpoint } from './network';
import { RequestBuilder } from './request-builder';
import { makeAbortTransformStream } from './transforms/abort';
import { makeChunkParserTransformStream } from './transforms/chunks';
import { makeContextUpdaterTransformStream } from './transforms/context';
import { makeDecryptionTransformStream } from './transforms/decrypt';
import { makeFinishSink } from './transforms/finish';
import { makeImageLoggerTransformStream } from './transforms/image-logger';
import { makeSmoothingTransformStream } from './transforms/smoothing';
import { makeUtf8DecodingTransformStream } from './transforms/utf8';
import {
    type AssistantCallOptions,
    type ChatEndpointGenerationRequest,
    type ChunkCallback,
    type FinishCallback,
    type GenerationResponseMessage,
    type LumoApiClientConfig,
    type LumoApiGenerationRequest,
    type RequestContext,
    type RequestInterceptor,
    type RequestableGenerationTarget,
    type ResponseContext,
    type ResponseInterceptor,
    Role,
    type Status,
    type Turn,
} from './types';

// Default configuration
const DEFAULT_CONFIG: LumoApiClientConfig = {
    enableU2LEncryption: true,
    enableSmoothing: true,
    endpoint: LUMO_CHAT_ENDPOINT,
    lumoPubKey: DEFAULT_LUMO_PUB_KEY,
    externalTools: ['web_search', 'weather', 'stock', 'cryptocurrency'],
    internalTools: ['proton_info'],
    imageTools: ['generate_image', 'describe_image', 'edit_image'],
    interceptors: {
        request: [],
        response: [],
    },
};

/**
 * Main LLM API Client class
 */
export class LumoApiClient {
    private config: LumoApiClientConfig;

    constructor(config: Partial<LumoApiClientConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /******* Toplevel logic *******/

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
            enableImageTools = false,
            requestKey,
            requestId,
            generateTitle = false,
            autoGenerateEncryption = true,
        } = options;
        const { enableU2LEncryption, endpoint } = this.config;

        // Setup U2L encryption
        const encryption = await RequestEncryptionParams.create(requestKey, requestId, {
            enableU2LEncryption,
            autoGenerateEncryption,
        });

        // Prepare the request
        // TODO consider just passing `options` instead of rebuilding a narrower object
        let request: LumoApiGenerationRequest = await this.prepareGenerationRequest(turns, encryption, {
            enableExternalTools,
            enableImageTools,
            generateTitle,
        });

        // Prepare request context and run interceptors
        const requestContext: RequestContext = this.initializeRequestContext(endpoint, {
            enableU2LEncryption,
            enableExternalTools,
        });
        request = await this.notifyRequestInterceptors(request, requestContext);

        // Prepare response context and call server, then monitor the SSE stream until the end
        const responseContext: ResponseContext = this.initializeResponseContext(requestContext);
        await this.runSseReceiveLoop(
            api,
            request,
            endpoint,
            signal,
            encryption,
            responseContext,
            chunkCallback,
            finishCallback
        );
    }

    private async runSseReceiveLoop(
        api: Api,
        request: LumoApiGenerationRequest,
        endpoint: string,
        signal: AbortSignal | undefined,
        encryption: RequestEncryptionParams | null,
        responseContext: ResponseContext,
        chunkCallback: ChunkCallback | undefined,
        finishCallback: FinishCallback | undefined
    ) {
        const thisNotifyResponse = this.notifyResponse.bind(this);

        // Final status will be changed to succeeded on success
        let finalStatus: Status = 'failed';

        // Prepare payload
        const postData = this.prepareChatEndpointPostData(request);

        try {
            const responseBody = await callChatEndpoint(api, postData, {
                endpoint,
                signal,
            });

            // Run the processing stream: this is the core logic
            await responseBody
                .pipeThrough(makeAbortTransformStream(signal)) // deals with AbortSignal
                .pipeThrough(makeUtf8DecodingTransformStream()) // bytes -> utf8
                .pipeThrough(makeChunkParserTransformStream()) // utf8 -> chunk objects
                .pipeThrough(makeDecryptionTransformStream(encryption)) // U2L decryption
                .pipeThrough(makeImageLoggerTransformStream()) // noop - logs image_data
                .pipeThrough(makeContextUpdaterTransformStream(responseContext)) // bookkeeping (read-only)
                .pipeThrough(makeSmoothingTransformStream(this.config.enableSmoothing))
                .pipeTo(makeFinishSink(thisNotifyResponse, chunkCallback, responseContext)); // calls callbacks with final chunks

            // Stream is complete
            finalStatus = 'succeeded';
            await this.notifyResponseComplete(finalStatus, responseContext);
        } catch (error: any) {
            // Run response error interceptors
            await this.notifyResponseError(error, responseContext);

            // If the stop button was pressed, we finish gracefully
            if (error.name === 'AbortError') {
                console.warn('Generation aborted');
                finalStatus = 'succeeded';
                return; // Don't re-throw
            }

            // Bubble up
            throw error;
        } finally {
            if (finishCallback) {
                await finishCallback(finalStatus);
            }
        }
    }

    /******* Request preparation methods *******/

    private prepareChatEndpointPostData(request: LumoApiGenerationRequest): ChatEndpointGenerationRequest {
        return {
            Prompt: request,
        };
    }

    private async prepareGenerationRequest(
        turns: Turn[],
        encryption: RequestEncryptionParams | null,
        flags: {
            enableExternalTools: boolean;
            enableImageTools: boolean;
            generateTitle: boolean;
        }
    ): Promise<LumoApiGenerationRequest> {
        const { lumoPubKey } = this.config;
        const { enableExternalTools, enableImageTools, generateTitle } = flags;

        // Encrypt request if needed
        if (encryption) {
            turns = await encryptTurns(turns, encryption);
        }

        // Determine tools and targets
        const tools = this.getTools(enableExternalTools, enableImageTools);
        const targets = this.getTargets(generateTitle);

        return {
            type: 'generation_request',
            turns,
            options: { tools },
            targets,
            request_key: (await encryption?.encryptRequestKey(lumoPubKey)) || undefined,
            request_id: encryption?.requestId,
        };
    }

    private getTools(enableExternalTools: boolean, enableImageTools: boolean) {
        const { internalTools, externalTools, imageTools } = this.config;
        // prettier-ignore
        return [
            ...internalTools,
            ...when(enableExternalTools, externalTools),
            ...when(enableImageTools, imageTools),
        ];
    }

    private getTargets(requestTitle: boolean): RequestableGenerationTarget[] {
        return requestTitle ? ['title', 'message'] : ['message'];
    }

    /******* Interceptor internal methods *******/

    private initializeRequestContext(
        endpoint: string,
        flags: {
            enableU2LEncryption: boolean;
            enableExternalTools: boolean;
        }
    ) {
        const { enableU2LEncryption, enableExternalTools } = flags;
        return {
            requestId: uuidv4(), // do not use encryption.requestId, which is ONLY meant for cryptographic purposes (AEAD)
            timestamp: Date.now(),
            endpoint,
            enableU2LEncryption,
            enableExternalTools,
        };
    }

    private initializeResponseContext(requestContext: RequestContext): ResponseContext {
        return {
            ...requestContext,
            startTime: Date.now(),
            chunkCount: 0,
            totalContentLength: 0,
        };
    }

    private async notifyRequestInterceptors(request: LumoApiGenerationRequest, requestContext: RequestContext) {
        try {
            return await this.notifyRequest(request, requestContext);
        } catch (error: any) {
            // Run request error interceptors
            await this.notifyRequestError(error, requestContext);
            throw error;
        }
    }

    private async notifyResponseComplete(finalStatus: 'failed' | 'succeeded', responseContext: ResponseContext) {
        for (const interceptor of this.config.interceptors.response || []) {
            if (interceptor.onResponseComplete) {
                await interceptor.onResponseComplete(finalStatus, responseContext);
            }
        }
    }

    private async notifyResponse(
        value: GenerationResponseMessage,
        responseContext: ResponseContext
    ): Promise<GenerationResponseMessage> {
        // FIXME: The code supports modifying the response chunk, but I don't think we ever need to do it in
        //        fact. This is further highlighted by the fact that the function
        //        createContentTransformInterceptor() is never used.
        //        Another fundamental reason is that we almost never need to transform the individual chunks
        //        ("hel", "lo", " wor", "ld\n\n") but we often need to transform the overall concatenated string
        //        ("hello world\n\n" needs trimming)
        //        TLDR: remove the transform capability
        for (const interceptor of this.config.interceptors.response || []) {
            if (interceptor.onResponseChunk) {
                value = await interceptor.onResponseChunk(value, responseContext);
            }
        }
        return value;
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

    /******* Interceptor external methods *******/

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
        this.clearRequestInterceptors();
        this.clearResponseInterceptors();
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

    /******* Secondary entry points *******/

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

        await this.callAssistant(api, [{ role: Role.User, content: message }], {
            enableExternalTools: enableWebSearch,
            signal,
            chunkCallback: async (msg) => {
                if (msg.type === 'token_data' && msg.target === 'message') {
                    response += msg.content;
                    onChunk?.(msg.content);
                }
            },
        });

        return response;
    }

    /******* Request builder public methods *******/

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

        const turn = turns[0];
        if (!turn || turns.length !== 1 || turn.role !== 'user') {
            throw new Error('Quick requests must contain exactly one user message');
        }

        const options = builder.getOptions();
        return this.quickChat(api, turn.content || '', {
            enableWebSearch: options.enableExternalTools,
            signal: options.signal,
        });
    }

    /******* Config getter/setter *******/

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
}
