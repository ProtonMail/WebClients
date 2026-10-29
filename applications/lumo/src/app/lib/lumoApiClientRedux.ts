import { c } from 'ttag';

import { formatRequestedModel, resolveChatModel } from '@proton/lumo-api-client/core/chat-completions';
import { LumoApiClient } from '@proton/lumo-api-client/core/client';
import {
    ContextLengthExceededError,
    getContextLengthExceededUpstreamMessage,
    isContextLengthExceededApiError,
    isContextLengthExceededError,
} from '@proton/lumo-api-client/core/context-length';
import { getDesktopLumoApiClientConfig } from '@proton/lumo-api-client/core/desktop-tools';
import { getTerminalTypeFromApiError } from '@proton/lumo-api-client/core/generation-terminal';
import type {
    AssistantCallOptions,
    AssistantCallResult,
    GenerationResponseMessage,
    LumoApiClientConfig,
    Turn,
} from '@proton/lumo-api-client/core/types';
import { postProcessTitle } from '@proton/lumo-api-client/utils';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { buildArtifactRegistry } from '../components/Conversation/artifact/artifactRegistry';
import type { ArtifactToolMode } from '../components/Conversation/helper';
import { selectAttachmentsBySpaceId } from '../redux/selectors';
import { addAttachment, pushAttachmentRequest } from '../redux/slices/core/attachments';
import {
    changeConversationTitle,
    pushConversationRequest,
    updateConversationStatus,
} from '../redux/slices/core/conversations';
// Redux action creators
import {
    addImageAttachment,
    appendChunk,
    appendReasoning,
    finishMessage,
    pushMessageRequest,
    recordMessageUsage,
    setSuggestedQuestions,
    setToolCall,
    setToolResult,
} from '../redux/slices/core/messages';
import type { LumoDispatch, LumoState } from '../redux/store';
import { attachmentDataCache } from '../services/attachmentDataCache';
import { recordLastRequest } from '../services/feedback/lastRequestStore';
import { syncArtifactAssets } from '../services/generation/syncArtifactAssets';
import { applyUsageFromStreamMessage } from '../services/usageLimitsStore';
import { ConversationStatus, Role } from '../types';
import { CONTEXT_LENGTH_EXCEEDED_CODE } from '../types-api';
import { getLumoFeatureFlagsForChatCompletions } from '../util/unleashFeatureFlagsForObservability';
import { createImageAttachment, generateImageMarkdown } from './imageAttachment';

/**
 * Message tokens are dispatched at most this often. A dispatch per token re-renders synchronously
 * (useSyncExternalStore), which floods React and trips its nested-update warning on fast streams.
 */
const CHUNK_FLUSH_INTERVAL_MS = 32;

export const getTerminalTypeForApiError = (error: unknown) => {
    if (
        typeof error === 'object' &&
        error !== null &&
        (error as { status?: number }).status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS
    ) {
        return null;
    }

    return getTerminalTypeFromApiError(error);
};

/**
 * Redux-integrated helper for sending messages with automatic Redux updates
 */
export function sendMessageWithRedux(
    api: Api,
    turns: Turn[],
    options: AssistantCallOptions & {
        config?: Partial<LumoApiClientConfig>;
        messageId?: string;
        conversationId?: string;
        spaceId?: string;
        role?: Role;
        errorHandler?: (message: GenerationResponseMessage, conversationId: string) => any;
        artifactToolMode?: ArtifactToolMode;
    } = {} as any
) {
    return async (dispatch: LumoDispatch, getState: () => LumoState): Promise<AssistantCallResult> => {
        const {
            config,
            messageId,
            conversationId,
            spaceId,
            role = Role.Assistant,
            errorHandler,
            artifactToolMode,
            ...assistantOptions
        } = options;

        let accumulatedContent = '';
        let accumulatedTitle = '';
        let persistedTitle: string | undefined = undefined;
        let sawToolActivity = false;
        // Filenames generated for images during this response. The Redux store may not yet
        // reflect just-added attachments when the next image_data chunk arrives, so we track
        // them locally to keep collision suffixes ((2), (3), …) correct within one response.
        const generatedImageFilenames = new Set<string>();
        let servingModelID: string | undefined;
        const requestedModel = formatRequestedModel(
            resolveChatModel(assistantOptions.modelTier ?? 'auto'),
            assistantOptions.enableReasoning ?? false
        );

        const client = new LumoApiClient({
            ...getDesktopLumoApiClientConfig(),
            ...config,
        });

        const featureFlags = getLumoFeatureFlagsForChatCompletions();

        let pendingContent = '';
        let flushTimer: ReturnType<typeof setTimeout> | undefined;
        // Must run before any other dispatch for this message, so updates keep their stream order.
        const flushContent = () => {
            if (flushTimer !== undefined) {
                clearTimeout(flushTimer);
                flushTimer = undefined;
            }
            if (pendingContent && messageId) {
                dispatch(appendChunk({ messageId, content: pendingContent }));
            }
            pendingContent = '';
        };
        const queueContent = (content: string) => {
            pendingContent += content;
            flushTimer ??= setTimeout(flushContent, CHUNK_FLUSH_INTERVAL_MS);
        };

        try {
            return await client.callAssistant(api, turns, {
                ...assistantOptions,
                featureFlags,
                chunkCallback: async (message: GenerationResponseMessage) => {
                    if (message.type !== 'token_data' || message.target !== 'message') {
                        flushContent();
                    }
                    switch (message.type) {
                        case 'tool-error':
                            // The model reported a context-window overflow mid-stream. Surface a
                            // dedicated, recoverable error so the orchestration layer can compact
                            // the conversation and retry. Other tool-error codes fall back to the
                            // generic error handling below.
                            if (message.error.code === CONTEXT_LENGTH_EXCEEDED_CODE) {
                                throw new ContextLengthExceededError({
                                    conversationId,
                                    upstreamMessage: message.error.message,
                                });
                            }
                            if (errorHandler && conversationId) {
                                throw errorHandler({ type: 'error' }, conversationId);
                            }
                            throw new Error(`Generation failed: tool-error (${message.error.code})`);

                        case 'error':
                        case 'timeout':
                        case 'rejected':
                        case 'harmful':
                            // Use custom error handler if provided, otherwise use generic Error
                            if (errorHandler && conversationId) {
                                throw errorHandler(message, conversationId);
                            }
                            throw new Error(`Generation failed: ${message.type}`);

                        case 'done':
                            // Tool-only turns (native desktop tools, server tools) may finish
                            // without prose content before the follow-up generation round.
                            if (!accumulatedContent.trim() && !sawToolActivity) {
                                console.warn(`Generation completed with no content`);
                                if (errorHandler && conversationId) {
                                    throw errorHandler({ type: 'error' }, conversationId);
                                }
                                throw new Error('Generation failed: no content');
                            }
                            break;

                        case 'ingesting':
                            // When we start ingesting the message and we have a title, persist it
                            if (message.target !== 'message' && accumulatedTitle && conversationId && spaceId) {
                                // translator: Default chat title when no usable title is available.
                                const processedTitle = postProcessTitle(
                                    accumulatedTitle,
                                    c('collider_2025:Title').t`Untitled conversation`
                                );
                                dispatch(
                                    changeConversationTitle({
                                        id: conversationId,
                                        spaceId,
                                        title: processedTitle,
                                        persist: true,
                                    })
                                );
                                dispatch(pushConversationRequest({ id: conversationId }));
                                persistedTitle = processedTitle;
                            }
                            break;

                        case 'model':
                            // A call can also generate a title or suggestions. Only the main
                            // response's model belongs on the assistant message.
                            if (message.target === 'message') {
                                servingModelID = message.model;
                            }
                            break;

                        case 'token_data':
                            switch (message.target) {
                                case 'title':
                                    accumulatedTitle += message.content;
                                    if (conversationId && spaceId) {
                                        dispatch(
                                            changeConversationTitle({
                                                id: conversationId,
                                                spaceId,
                                                // translator: Default chat title when no usable title is available.
                                                title: postProcessTitle(
                                                    accumulatedTitle,
                                                    c('collider_2025:Title').t`Untitled conversation`
                                                ),
                                                persist: false,
                                            })
                                        );
                                    }
                                    break;

                                case 'message':
                                    accumulatedContent += message.content;
                                    if (messageId) {
                                        queueContent(message.content);
                                    }
                                    break;

                                case 'tool_call':
                                    sawToolActivity = true;
                                    if (messageId) {
                                        dispatch(
                                            setToolCall({
                                                messageId,
                                                content: message.content,
                                            })
                                        );
                                    }
                                    break;

                                case 'tool_result':
                                    sawToolActivity = true;
                                    if (messageId) {
                                        dispatch(
                                            setToolResult({
                                                messageId,
                                                content: message.content,
                                            })
                                        );
                                    }
                                    break;

                                case 'reasoning':
                                    if (messageId) {
                                        dispatch(
                                            appendReasoning({
                                                messageId,
                                                content: message.content,
                                                sequence: message.count,
                                            })
                                        );
                                    }
                                    break;

                                case 'suggested_questions':
                                    if (messageId) {
                                        try {
                                            const questions: string[] = JSON.parse(message.content);
                                            if (Array.isArray(questions)) {
                                                dispatch(setSuggestedQuestions({ messageId, questions }));
                                            }
                                        } catch {
                                            console.warn(
                                                'Failed to parse suggested_questions content',
                                                message.content
                                            );
                                        }
                                    }
                                    break;
                            }
                            break;

                        case 'image_data':
                            console.log('[IMAGE_DATA] Received in Redux integration', {
                                image_id: message.image_id,
                                data: message.data
                                    ? `${message.data.substring(0, 50)}... (${message.data.length} chars)`
                                    : 'none',
                                is_final: message.is_final,
                                seed: message.seed,
                            });

                            if (message.image_id && message.data && messageId && spaceId) {
                                const storeFilenames = Object.values(
                                    selectAttachmentsBySpaceId(spaceId)(getState())
                                ).map((a) => a.filename);
                                const existingFilenames = [...storeFilenames, ...generatedImageFilenames];
                                const { attachment, data: imageData } = createImageAttachment(
                                    message.image_id,
                                    message.data,
                                    spaceId,
                                    existingFilenames
                                );
                                generatedImageFilenames.add(attachment.filename);

                                // Store image data in cache instead of Redux
                                attachmentDataCache.setData(attachment.id, imageData);

                                dispatch(addAttachment(attachment));
                                dispatch(addImageAttachment({ messageId, attachment }));
                                dispatch(appendChunk({ messageId, content: generateImageMarkdown(message.image_id) }));
                                // Push attachment to server now that it has spaceId
                                dispatch(pushAttachmentRequest({ id: message.image_id }));
                            }
                            break;

                        case 'usage':
                            applyUsageFromStreamMessage(
                                message,
                                assistantOptions.modelTier === 'lumo-lite' ||
                                    assistantOptions.modelTier === 'lumo-max' ||
                                    assistantOptions.modelTier === 'apertus-15' ||
                                    assistantOptions.modelTier === 'lumo-preview'
                                    ? assistantOptions.modelTier
                                    : undefined
                            );
                            // Persist backend usage on the assistant message: token counts for
                            // context-size estimates and model id for feedback. Only the main
                            // generation reaches this path (title/compaction summaries use
                            // quickChat), so we never mis-attribute sub-request usage.
                            if (messageId) {
                                dispatch(recordMessageUsage(messageId, message.usage));
                            }
                            break;

                        case 'server_tool_call':
                            sawToolActivity = true;
                            // Server-side tool calls arrive as dedicated `chat.tool_call` SSE chunks
                            // (parsed into 'server_tool_call' messages in streaming.ts, decrypted in
                            // decrypt.ts). We funnel them into the same block-render path used by the
                            // streamed delta tool calls (setToolCall -> setToolCallInBlocks). The
                            // playground branch routes its tool calls into this exact path too, so
                            // this stays compatible when that branch is merged in.
                            //
                            // Each call is emitted twice: an "announce" chunk (name only) followed by
                            // a "dispatch" chunk (name + arguments). setToolCallInBlocks merges those
                            // chunks when they share the same call id.
                            if (messageId) {
                                // `arguments` is an object when the backend sends plaintext, a
                                // decrypted JSON string when encrypted, or absent on the announce.
                                const rawArguments = message.arguments as unknown;
                                let toolArguments: unknown;
                                if (typeof rawArguments === 'string') {
                                    try {
                                        toolArguments = JSON.parse(rawArguments);
                                    } catch {
                                        toolArguments = rawArguments;
                                    }
                                } else {
                                    toolArguments = rawArguments;
                                }
                                dispatch(
                                    setToolCall({
                                        messageId,
                                        content: JSON.stringify({
                                            id: message.call_id,
                                            name: message.name,
                                            ...(toolArguments !== undefined ? { arguments: toolArguments } : {}),
                                        }),
                                    })
                                );
                            }
                            break;

                        case 'server_tool_result':
                            sawToolActivity = true;
                            // Companion to 'server_tool_call'; routed into the same block-render path
                            // via setToolResult. `content` is an object for plaintext payloads and a
                            // decrypted JSON string when encrypted.
                            if (messageId) {
                                const rawContent = message.content as unknown;
                                dispatch(
                                    setToolResult({
                                        messageId,
                                        content:
                                            typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent),
                                        callId: message.call_id,
                                        ...(message.meta ? { meta: message.meta } : {}),
                                    })
                                );
                            }
                            break;
                    }

                    // Call the original callback if provided
                    if (assistantOptions.chunkCallback) {
                        return assistantOptions.chunkCallback(message);
                    }
                },
                finishCallback: async (status) => {
                    flushContent();
                    if (messageId && conversationId && spaceId) {
                        // Always finish the message (even if failed) to preserve any content that was streamed
                        // This includes reasoning tokens, partial message content, or tool calls
                        dispatch(
                            finishMessage({
                                messageId,
                                conversationId,
                                spaceId,
                                content: accumulatedContent,
                                status: status === 'failed' ? 'failed' : status,
                                role,
                                requestedModel,
                                ...(servingModelID !== undefined ? { modelID: servingModelID } : {}),
                            })
                        );
                        if (artifactToolMode && artifactToolMode !== 'off') {
                            const completedMessage = getState().messages[messageId];
                            if (completedMessage) {
                                syncArtifactAssets(dispatch, conversationId, buildArtifactRegistry([completedMessage]));
                            }
                        }
                        // Always persist the message to IDB, even if generation failed.
                        // Failed messages have content the user can see (partial response,
                        // reasoning tokens, tool calls). Without this push, the message
                        // exists only in Redux and vanishes on page reload.
                        // Importantly, if the user continues the conversation below a
                        // non-persisted message, the entire child subtree is at risk:
                        // persistence relies on the message tree topology, and a missing
                        // parent means children cannot be persisted either.
                        dispatch(pushMessageRequest({ id: messageId }));

                        // Handle final title processing
                        // translator: Default chat title when no usable title is available.
                        const finalTitle = postProcessTitle(
                            accumulatedTitle,
                            c('collider_2025:Title').t`Untitled conversation`
                        );
                        if (accumulatedTitle) {
                            dispatch(
                                changeConversationTitle({
                                    id: conversationId,
                                    spaceId,
                                    title: finalTitle,
                                    persist: true,
                                })
                            );
                        }

                        // Update conversation status to completed
                        dispatch(
                            updateConversationStatus({
                                id: conversationId,
                                status: ConversationStatus.COMPLETED, // Always set to completed regardless of success/failure
                            })
                        );

                        // Push conversation request if title changed
                        if (!persistedTitle || finalTitle !== persistedTitle) {
                            dispatch(pushConversationRequest({ id: conversationId }));
                        }
                    }

                    // Call the original callback if provided
                    if (assistantOptions.finishCallback) {
                        await assistantOptions.finishCallback(status);
                    }
                },
                recordRequestCallback: (body) => {
                    if (messageId && conversationId) {
                        recordLastRequest(conversationId, messageId, body);
                    }

                    // Call the original callback if provided
                    assistantOptions.recordRequestCallback?.(body);
                },
            });
        } catch (error) {
            // A plain HTTP 400 (no SSE stream) can also signal context overflow.
            // Normalise it so the orchestration layer handles it like the SSE event.
            if (!isContextLengthExceededError(error) && isContextLengthExceededApiError(error)) {
                throw new ContextLengthExceededError({
                    conversationId,
                    upstreamMessage: getContextLengthExceededUpstreamMessage(error),
                });
            }

            // Preserve HTTP 429 so the action error handler can identify it as a
            // rate/tier limit. Converting a nested generic `error` code here would
            // discard the HTTP status and show a generic generation error instead.
            const terminalType = getTerminalTypeForApiError(error);
            if (terminalType && errorHandler && conversationId) {
                throw errorHandler({ type: terminalType }, conversationId);
            }

            throw error;
        } finally {
            flushContent();
        }
    };
}
