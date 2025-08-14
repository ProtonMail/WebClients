import type { Api } from '@proton/shared/lib/interfaces';

import {
    changeConversationTitle,
    pushConversationRequest,
    updateConversationStatus,
} from '../../../redux/slices/core/conversations';
// Redux action creators
import {
    appendChunk,
    deleteMessage,
    finishMessage,
    pushMessageRequest,
    setToolCall,
    setToolResult,
} from '../../../redux/slices/core/messages';
import type { LumoDispatch } from '../../../redux/store';
import { ConversationStatus, Role } from '../../../types';
import { LumoApiClient } from '../core/client';
import type { AssistantCallOptions, GenerationToFrontendMessage, LumoApiClientConfig, Turn } from '../core/types';
import { postProcessTitle } from '../utils';

/**
 * Redux-integrated helper for sending messages with automatic Redux updates
 */
export function sendMessageWithRedux(
    api: Api,
    turns: Turn[],
    options: AssistantCallOptions & {
        config?: LumoApiClientConfig;
        messageId?: string;
        conversationId?: string;
        spaceId?: string;
        role?: Role;
        errorHandler?: (message: GenerationToFrontendMessage, conversationId: string) => any;
    } = {} as any
) {
    return async (dispatch: LumoDispatch): Promise<void> => {
        const {
            config,
            messageId,
            conversationId,
            spaceId,
            role = Role.Assistant,
            errorHandler,
            ...assistantOptions
        } = options;

        let accumulatedContent = '';
        let accumulatedTitle = '';
        let persistedTitle: string | undefined = undefined;

        const client = new LumoApiClient(config);

        await client.callAssistant(api, turns, {
            ...assistantOptions,
            chunkCallback: async (message: GenerationToFrontendMessage) => {
                switch (message.type) {
                    case 'error':
                    case 'timeout':
                    case 'rejected':
                    case 'harmful':
                        // Use custom error handler if provided, otherwise use generic Error
                        if (errorHandler && conversationId) {
                            return { error: errorHandler(message, conversationId) };
                        }
                        return { error: new Error(`Generation failed: ${message.type}`) };

                    case 'done':
                        // handle case for successful response with no content
                        if (!accumulatedContent.trim()) {
                            console.warn(`Generation completed with no content`);
                            if (errorHandler && conversationId) {
                                return { error: errorHandler({ type: 'error' }, conversationId) };
                            }
                            return { error: new Error('Generation failed: no content') };
                        }
                        break;

                    case 'ingesting':
                        // When we start ingesting the message and we have a title, persist it
                        if (message.target !== 'message' && accumulatedTitle && conversationId && spaceId) {
                            const processedTitle = postProcessTitle(accumulatedTitle);
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

                    case 'token_data':
                        switch (message.target) {
                            case 'title':
                                accumulatedTitle += message.content;
                                if (conversationId && spaceId) {
                                    dispatch(
                                        changeConversationTitle({
                                            id: conversationId,
                                            spaceId,
                                            title: postProcessTitle(accumulatedTitle),
                                            persist: false,
                                        })
                                    );
                                }
                                break;

                            case 'message':
                                accumulatedContent += message.content;
                                if (messageId) {
                                    dispatch(
                                        appendChunk({
                                            messageId,
                                            content: message.content,
                                        })
                                    );
                                }
                                break;

                            case 'tool_call':
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
                                if (messageId) {
                                    dispatch(
                                        setToolResult({
                                            messageId,
                                            content: message.content,
                                        })
                                    );
                                }
                                break;
                        }
                        break;
                }

                // Call the original callback if provided
                if (assistantOptions.chunkCallback) {
                    return assistantOptions.chunkCallback(message);
                }

                return {};
            },
            finishCallback: async (status) => {
                if (messageId && conversationId && spaceId) {
                    // If generation failed, delete the message instead of keeping it
                    if (status === 'failed') {
                        dispatch(deleteMessage(messageId));
                    } else {
                        dispatch(
                            finishMessage({
                                messageId,
                                conversationId,
                                spaceId,
                                content: accumulatedContent,
                                status,
                                role,
                            })
                        );
                        dispatch(pushMessageRequest({ id: messageId }));
                    }

                    // Handle final title processing
                    const finalTitle = postProcessTitle(accumulatedTitle);
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
        });
    };
}

/**
 * Create Redux callbacks for streaming responses
 */
export function createReduxCallbacks(
    messageId: string,
    conversationId: string,
    spaceId: string,
    role: Role = Role.Assistant
) {
    // FIXME
    // FIXME
    // I think we lost the ability to generate a title.
    // Reference code is getCallbacks() in llm/index.ts, notably, calls to changeConversationTitle()
    // FIXME
    // FIXME

    let accumulatedContent = '';

    return {
        // todo turn chunkCallback(message, dispatch) into dispatch(chunkCallback(message))
        chunkCallback: async (message: GenerationToFrontendMessage, dispatch: LumoDispatch) => {
            if (message.type === 'token_data' && message.target === 'message') {
                accumulatedContent += message.content;

                dispatch(
                    appendChunk({
                        messageId,
                        content: message.content,
                    })
                );
            }
            return {};
        },
        // todo turn finishCallback(status, dispatch) into dispatch(finishCallback(status))
        finishCallback: async (status: 'succeeded' | 'failed', dispatch: LumoDispatch) => {
            // If generation failed, delete the message instead of keeping it
            if (status === 'failed') {
                dispatch(deleteMessage(messageId));
            } else {
                dispatch(
                    finishMessage({
                        messageId,
                        conversationId,
                        spaceId,
                        content: accumulatedContent,
                        status,
                        role,
                    })
                );
            }

            // Update conversation status to completed
            dispatch(
                updateConversationStatus({
                    id: conversationId,
                    status: ConversationStatus.COMPLETED,
                })
            );
        },
    };
}
