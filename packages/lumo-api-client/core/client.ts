import { v4 as uuidv4 } from 'uuid';

import type { Api } from '@proton/shared/lib/interfaces';

import type {
    ChatCompletionsFunctionTool,
    ChatCompletionsTool,
    LumoCompletionTarget,
    ResponseFormat,
    ToolName,
} from '../types-api';
import { when } from '../util/collections';
import { type LumoApiModelTier, toChatCompletionsBody } from './chat-completions';
import {
    type ClientToolExecutor,
    type ClientToolResult,
    type PendingClientToolCall,
    filterClientToolCalls,
    mergePendingClientToolCalls,
    resolveClientToolExecutor,
} from './client-tools';
import { createDesktopClientToolExecutor } from './desktop-tools';
import { DEFAULT_LUMO_PUB_KEY, encryptTurns } from './encryption';
import { RequestEncryptionParams } from './encryptionParams';
import { LUMO_CHAT_ENDPOINT, callChatEndpoint } from './network';
import { RequestBuilder } from './request-builder';
import { extractTitleSourceText } from './title-generation';
import { makeAbortTransformStream } from './transforms/abort';
import { makeChunkParserTransformStreamWithCapture } from './transforms/chunks';
import { makeContextUpdaterTransformStream } from './transforms/context';
import { decryptToolCallArguments, makeDecryptionTransformStream } from './transforms/decrypt';
import { makeFinishSink } from './transforms/finish';
import { makeImageLoggerTransformStream } from './transforms/image-logger';
import { makeSmoothingTransformStream } from './transforms/smoothing';
import { makeUtf8DecodingTransformStream } from './transforms/utf8';
import {
    type AssistantCallOptions,
    type AssistantCallResult,
    type ChunkCallback,
    type FinishCallback,
    type GenerationResponseMessage,
    type ImageAspectRatio,
    type LumoApiClientConfig,
    type LumoApiGenerationRequest,
    type RequestContext,
    type RequestInterceptor,
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
    externalTools: ['web_search', 'weather', 'stock', 'cryptocurrency', 'web_extract', 'proton_info'],
    imageTools: ['generate_image', 'describe_image', 'edit_image'],
    enableDesktopTools: false,
    interceptors: {
        request: [],
        response: [],
    },
};

/**
 * Rounds of billable client-tool work one turn may spend
 */
export const CLIENT_TOOL_ROUND_BUDGET = 10;

/**
 * Backstop on total rounds, billable or not
 */
export const MAX_CLIENT_TOOL_ROUNDS = CLIENT_TOOL_ROUND_BUDGET * 2;

const missingResultFor = (call: PendingClientToolCall): ClientToolResult => ({
    content: JSON.stringify({ error: `The ${call.name} tool returned no result. Try again.` }),
    is_error: true,
});

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
    async callAssistant(api: Api, turns: Turn[], options: AssistantCallOptions = {}): Promise<AssistantCallResult> {
        const {
            chunkCallback,
            finishCallback,
            signal,
            enableExternalTools = false,
            enableImageTools = false,
            enableReasoning = false,
            modelTier = 'auto',
            enableSuggestedQuestions = false,
            enableDesktopTools = this.config.enableDesktopTools,
            requestKey,
            requestId,
            generateTitle = false,
            autoGenerateEncryption = true,
            imageAspectRatio,
            responseFormat,
            clientTools,
            serverTools,
            clientToolExecutor,
        } = options;
        const { enableU2LEncryption, endpoint } = this.config;

        const resolvedClientToolExecutor = resolveClientToolExecutor({
            clientToolExecutor,
            createDefaultExecutor: enableDesktopTools ? createDesktopClientToolExecutor : undefined,
        });

        // Setup U2L encryption
        const encryption = await RequestEncryptionParams.create(requestKey, requestId, {
            enableU2LEncryption,
            autoGenerateEncryption,
        });

        const titleSourceText = generateTitle ? extractTitleSourceText(turns) : null;

        const requestContext: RequestContext = this.initializeRequestContext(endpoint, {
            enableU2LEncryption,
            enableExternalTools,
        });

        const parallelTasks: Promise<void>[] = [];

        if (titleSourceText !== null) {
            const titleTurns: Turn[] = [
                { role: Role.User, content: titleSourceText },
                { role: Role.Assistant, content: '' },
            ];
            parallelTasks.push(
                this.runTargetedGeneration(
                    api,
                    titleTurns,
                    'title',
                    endpoint,
                    signal,
                    chunkCallback,
                    encryption,
                    enableU2LEncryption,
                    modelTier === 'apertus-15' ? 'apertus-15' : 'lumo-lite'
                ).catch((error) => {
                    if (error?.name === 'AbortError') {
                        return;
                    }
                    console.warn('Title generation failed:', error);
                })
            );
        }

        if (enableSuggestedQuestions) {
            parallelTasks.push(
                this.runTargetedGeneration(
                    api,
                    turns,
                    'suggested_questions',
                    endpoint,
                    signal,
                    chunkCallback,
                    encryption,
                    enableU2LEncryption,
                    modelTier === 'apertus-15' ? 'apertus-15' : 'lumo-lite'
                ).catch((error) => {
                    if (error?.name === 'AbortError') {
                        return;
                    }
                    console.warn('Suggested questions generation failed:', error);
                })
            );
        }

        // The model's prose reaches us only as chunks, but it has to go back into the chain or a
        // resumed turn replays a history in which the assistant never spoke.
        let roundReply = '';
        const roundChunkCallback: ChunkCallback = async (message) => {
            if (message.type === 'token_data' && message.target === 'message') {
                roundReply += message.content;
            }
            // Suppress intermediate `done` events while client tool rounds may continue.
            if (message.type === 'done') {
                return;
            }
            return chunkCallback?.(message);
        };

        let currentTurns = turns;
        let finalStatus: Status = 'failed';
        let stoppedOnBudget = false;
        try {
            let rounds = 0;
            let billableRounds = 0;
            while (true) {
                let request: LumoApiGenerationRequest = await this.prepareGenerationRequest(
                    currentTurns,
                    encryption,
                    {
                        enableExternalTools,
                        enableImageTools,
                        enableReasoning,
                        enableSuggestedQuestions: false,
                        clientToolExecutor: resolvedClientToolExecutor,
                    },
                    { imageAspectRatio }
                );
                request = await this.notifyRequestInterceptors(request, requestContext);

                const responseContext: ResponseContext = this.initializeResponseContext(requestContext);

                const { pendingClientToolCalls, status } = await this.runSseReceiveLoop(
                    api,
                    request,
                    endpoint,
                    signal,
                    encryption,
                    responseContext,
                    roundChunkCallback,
                    undefined,
                    { target: 'message', modelTier, responseFormat, clientTools, serverTools }
                );
                finalStatus = status;

                if (!resolvedClientToolExecutor) {
                    break;
                }

                const executableCalls = filterClientToolCalls(pendingClientToolCalls, resolvedClientToolExecutor);
                if (executableCalls.length === 0) {
                    break;
                }

                const executed = await this.appendClientToolResults(
                    this.withAssistantReply(currentTurns, roundReply),
                    executableCalls,
                    resolvedClientToolExecutor,
                    chunkCallback
                );
                currentTurns = executed.turns;
                roundReply = '';
                rounds++;
                if (executed.billable) {
                    billableRounds++;
                }

                if (billableRounds >= CLIENT_TOOL_ROUND_BUDGET || rounds >= MAX_CLIENT_TOOL_ROUNDS) {
                    stoppedOnBudget = true;
                    break;
                }
            }

            if (signal?.aborted) {
                stoppedOnBudget = false;
            }

            if (chunkCallback) {
                await chunkCallback({ type: 'done' });
            }

            await Promise.all(parallelTasks);
        } catch (error) {
            finalStatus = 'failed';
            throw error;
        } finally {
            if (finishCallback) {
                await finishCallback(finalStatus);
            }
        }

        return { status: finalStatus, stoppedOnBudget, turns: currentTurns };
    }

    private async runSseReceiveLoop(
        api: Api,
        request: LumoApiGenerationRequest,
        endpoint: string,
        signal: AbortSignal | undefined,
        encryption: RequestEncryptionParams | null,
        responseContext: ResponseContext,
        chunkCallback: ChunkCallback | undefined,
        finishCallback: FinishCallback | undefined,
        options: {
            enableSmoothing?: boolean;
            target?: LumoCompletionTarget;
            modelTier?: LumoApiModelTier;
            responseFormat?: ResponseFormat;
            clientTools?: ChatCompletionsFunctionTool[];
            serverTools?: ToolName[];
        } = {}
    ): Promise<{ pendingClientToolCalls: PendingClientToolCall[]; status: Status }> {
        const enableSmoothing = options.enableSmoothing ?? this.config.enableSmoothing;
        const target = options.target ?? 'message';
        const thisNotifyResponse = this.notifyResponse.bind(this);
        const chunkCapture = makeChunkParserTransformStreamWithCapture(target);

        // Final status will be changed to succeeded on success
        let finalStatus: Status = 'failed';

        const postData = this.prepareChatEndpointPostData(request, {
            enableReasoning: Boolean(request.options?.reasoning),
            modelTier: options.modelTier,
            target: options.target,
            responseFormat: options.responseFormat,
            clientTools: options.clientTools,
            serverTools: options.serverTools,
        });

        try {
            const responseBody = await callChatEndpoint(api, postData, {
                endpoint,
                signal,
            });

            // Run the processing stream: this is the core logic
            await responseBody
                .pipeThrough(makeAbortTransformStream(signal)) // deals with AbortSignal
                .pipeThrough(makeUtf8DecodingTransformStream()) // bytes -> utf8
                .pipeThrough(chunkCapture.stream) // utf8 -> chunk objects
                .pipeThrough(makeDecryptionTransformStream(encryption)) // U2L decryption
                .pipeThrough(makeImageLoggerTransformStream()) // noop - logs image_data
                .pipeThrough(makeContextUpdaterTransformStream(responseContext)) // bookkeeping (read-only)
                .pipeThrough(makeSmoothingTransformStream(enableSmoothing))
                .pipeTo(makeFinishSink(thisNotifyResponse, chunkCallback, responseContext)); // calls callbacks with final chunks

            // Stream is complete
            finalStatus = 'succeeded';
            await this.notifyResponseComplete(finalStatus, responseContext);

            const decryptedToolCalls = await decryptToolCallArguments(
                chunkCapture.getPendingClientToolCalls(),
                encryption
            );

            return {
                pendingClientToolCalls: mergePendingClientToolCalls(decryptedToolCalls),
                status: finalStatus,
            };
        } catch (error: any) {
            // Run response error interceptors
            await this.notifyResponseError(error, responseContext);

            // If the stop button was pressed, we finish gracefully
            if (error?.name === 'AbortError') {
                console.warn('Generation aborted');
                finalStatus = 'succeeded';
                return { pendingClientToolCalls: [], status: finalStatus };
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

    private prepareChatEndpointPostData(
        request: LumoApiGenerationRequest,
        options: {
            enableReasoning: boolean;
            modelTier?: LumoApiModelTier;
            target?: LumoCompletionTarget;
            responseFormat?: ResponseFormat;
            clientTools?: ChatCompletionsFunctionTool[];
            serverTools?: ToolName[];
        }
    ) {
        return toChatCompletionsBody(request, {
            enableReasoning: options.enableReasoning,
            modelTier: options.modelTier,
            target: options.target,
            responseFormat: options.responseFormat,
            clientTools: options.clientTools,
            serverTools: options.serverTools,
        });
    }

    private async prepareGenerationRequest(
        turns: Turn[],
        encryption: RequestEncryptionParams | null,
        flags: {
            enableExternalTools: boolean;
            enableImageTools: boolean;
            enableReasoning: boolean;
            enableSuggestedQuestions: boolean;
            clientToolExecutor?: ClientToolExecutor;
        },
        additionalOptions?: {
            imageAspectRatio?: ImageAspectRatio;
        }
    ): Promise<LumoApiGenerationRequest> {
        const { lumoPubKey } = this.config;
        const { enableExternalTools, enableImageTools, enableReasoning, enableSuggestedQuestions, clientToolExecutor } =
            flags;
        const { imageAspectRatio } = additionalOptions || {};

        // Encrypt request if needed
        if (encryption) {
            turns = await encryptTurns(turns, encryption);
        }
        const tools = await this.getTools(enableExternalTools, enableImageTools, clientToolExecutor);
        return {
            type: 'generation_request',
            turns,
            options: {
                tools,
                reasoning: enableReasoning,
                ...(enableImageTools && imageAspectRatio && { image_aspect_ratio: imageAspectRatio }),
                suggested_questions: enableSuggestedQuestions,
            },
            request_key: (await encryption?.encryptRequestKey(lumoPubKey)) || undefined,
            request_id: encryption?.requestId,
        };
    }

    private stripTrailingEmptyAssistant(turns: Turn[]): Turn[] {
        if (turns.length === 0) {
            return turns;
        }

        const last = turns[turns.length - 1];
        if (last.role === Role.Assistant && !last.content?.trim()) {
            return turns.slice(0, -1);
        }

        return turns;
    }

    private withAssistantReply(turns: Turn[], reply: string): Turn[] {
        const stripped = this.stripTrailingEmptyAssistant(turns);
        if (!reply.trim()) {
            return stripped;
        }

        return [...stripped, { role: Role.Assistant, content: reply }];
    }

    private async appendClientToolResults(
        turns: Turn[],
        calls: PendingClientToolCall[],
        executor: ClientToolExecutor,
        chunkCallback: ChunkCallback | undefined
    ): Promise<{ turns: Turn[]; billable: boolean }> {
        const results = await executor.execute(calls);
        // An executor that answers fewer calls than it was given must not take the whole turn down
        // with it; the model can recover from a per-call error.
        const executed = calls.map((call, index) => ({ call, result: results[index] ?? missingResultFor(call) }));
        const nextTurns = [...turns];

        for (const { call, result } of executed) {
            let parsedArguments: unknown = {};
            try {
                parsedArguments = JSON.parse(call.arguments || '{}');
            } catch {
                parsedArguments = call.arguments;
            }

            const toolCallContent = JSON.stringify({
                id: call.id,
                name: call.name,
                arguments: parsedArguments,
            });

            nextTurns.push({
                role: Role.ToolCall,
                content: toolCallContent,
            });

            nextTurns.push({
                role: Role.ToolResult,
                content: result.content,
            });

            if (chunkCallback) {
                // Replace the streamed tool-call block, whose arguments are still U2L
                // ciphertext, with the decrypted form so it persists and replays correctly.
                await chunkCallback({
                    type: 'token_data',
                    target: 'tool_call',
                    count: 0,
                    content: toolCallContent,
                });
                await chunkCallback({
                    type: 'token_data',
                    target: 'tool_result',
                    count: 0,
                    content: result.content,
                });
            }
        }

        nextTurns.push({
            role: Role.Assistant,
            content: '',
        });

        return { turns: nextTurns, billable: executed.some(({ result }) => result.billable !== false) };
    }

    private async runTargetedGeneration(
        api: Api,
        turns: Turn[],
        target: Exclude<LumoCompletionTarget, 'message'>,
        endpoint: string,
        signal: AbortSignal | undefined,
        chunkCallback: ChunkCallback | undefined,
        encryption: RequestEncryptionParams | null,
        enableU2LEncryption: boolean,
        modelTier: AssistantCallOptions['modelTier'] = 'auto'
    ): Promise<void> {
        const request = await this.prepareGenerationRequest(turns, encryption, {
            enableExternalTools: false,
            enableImageTools: false,
            enableReasoning: false,
            enableSuggestedQuestions: false,
        });
        const context: ResponseContext = {
            ...this.initializeRequestContext(endpoint, {
                enableU2LEncryption,
                enableExternalTools: false,
            }),
            startTime: Date.now(),
            chunkCount: 0,
            totalContentLength: 0,
        };

        await this.runSseReceiveLoop(api, request, endpoint, signal, encryption, context, chunkCallback, undefined, {
            enableSmoothing: false,
            target,
            modelTier,
        });
    }

    private async getTools(
        enableExternalTools: boolean,
        enableImageTools: boolean,
        clientToolExecutor?: ClientToolExecutor
    ): Promise<ChatCompletionsTool[]> {
        const { externalTools, imageTools } = this.config;
        const builtinTools: ChatCompletionsTool[] = [
            ...when(enableExternalTools, externalTools).map((name) => ({ name })),
            ...when(enableImageTools, imageTools).map((name) => ({ name })),
        ];

        const advertisedClientTools = (await clientToolExecutor?.getClientTools?.()) ?? [];
        if (advertisedClientTools.length === 0) {
            return builtinTools;
        }

        return [...builtinTools, ...advertisedClientTools];
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
            enableReasoning: false,
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
