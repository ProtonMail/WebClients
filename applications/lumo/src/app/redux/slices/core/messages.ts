import { createAction, createReducer } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

import { countAttachmentToken, countAttachmentTokenVersion } from '../../../llm/utils';
import {
    appendTextToBlocks,
    isToolCallStreamingUpdate,
    setToolCallInBlocks,
    setToolResultInBlocks,
} from '../../../messageHelpers';
import type { Priority } from '../../../remote/scheduler';
import type { IdMapEntry, RemoteMessage } from '../../../remote/types';
import type {
    ChunkAction,
    FinishMessageAction,
    Message,
    MessageId,
    MessagePub,
    MessageUsage,
    ShallowAttachment,
} from '../../../types';
import type { LumoStreamUsage } from '../../../types-api';
import type { LumoDispatch, LumoState } from '../../store';

export type PushMessageRequest = {
    id: MessageId;
    priority?: Priority;
};
export type PushMessageSuccess = PushMessageRequest & {
    entry?: IdMapEntry;
};
export type PushMessageFailure = PushMessageRequest & {
    error: string;
};

export type AddImageAttachmentAction = {
    messageId: MessageId;
    attachment: ShallowAttachment;
};

export type SetSuggestedQuestionsAction = {
    messageId: MessageId;
    questions: string[];
};

export type SetMessageUsageAction = {
    messageId: MessageId;
    usage: MessageUsage;
};

export type SetMessageModelIDAction = {
    messageId: MessageId;
    modelID: string;
};

export type SetToolResultAction = ChunkAction & {
    callId?: string;
    meta?: {
        settings: string;
    };
};

// Low-level Redux store operations without side effects.
export const addMessage = createAction<MessagePub>('lumo/message/add');
export const appendChunk = createAction<ChunkAction>('lumo/message/appendChunk');
export const appendReasoning = createAction<ChunkAction>('lumo/message/appendReasoning');
export const setToolCall = createAction<ChunkAction>('lumo/message/setToolCall');
export const setToolResult = createAction<SetToolResultAction>('lumo/message/setToolResult');
export const setSuggestedQuestions = createAction<SetSuggestedQuestionsAction>('lumo/message/setSuggestedQuestions');
export const setMessageUsage = createAction<SetMessageUsageAction>('lumo/message/setUsage');
export const setMessageModelID = createAction<SetMessageModelIDAction>('lumo/message/setModelID');
export const addImageAttachment = createAction<AddImageAttachmentAction>('lumo/message/addImageAttachment');
export const finishMessage = createAction<FinishMessageAction>('lumo/message/finish');
export const deleteMessage = createAction<MessageId>('lumo/message/delete');
export const deleteAllMessages = createAction('lumo/message/deleteAll');

// High-level Redux-saga requests and events.
export const pushMessageRequest = createAction<PushMessageRequest>('lumo/message/pushRequest');
export const pushMessageSuccess = createAction<PushMessageSuccess>('lumo/message/pushSuccess');
export const pushMessageNoop = createAction<PushMessageRequest>('lumo/message/pushNoop');
export const pushMessageNeedsRetry = createAction<PushMessageRequest>('lumo/message/pushNeedsRetry');
export const pushMessageFailure = createAction<PushMessageFailure>('lumo/message/pushFailure');
export const locallyRefreshMessageFromRemoteRequest = createAction<RemoteMessage>('lumo/message/remoteRefresh');
export const pullMessageRequest = createAction<RemoteMessage>('lumo/message/pullRequest');
export const pullMessageSuccess = createAction<RemoteMessage>('lumo/message/pullSuccess');
export const pullMessageFailure = createAction<RemoteMessage>('lumo/message/pullFailure');

export type MessageMap = { [id: MessageId]: Message };
export const EMPTY_MESSAGE_MAP: MessageMap = {};

const messagesReducer = createReducer<MessageMap>(EMPTY_MESSAGE_MAP, (builder) => {
    builder
        .addCase(addMessage, (state, action) => {
            const message = action.payload;
            state[message.id] = message;
        })
        .addCase(deleteMessage, (state, action) => {
            const id = action.payload;
            delete state[id];
        })
        .addCase(appendChunk, (state, action) => {
            const chunk = action.payload;
            const message = state[chunk.messageId];
            if (!message) {
                console.warn(`appendChunk: message ${chunk.messageId} not found`);
                return;
            }
            // Update legacy field (backward compat)
            message.content ??= '';
            console.log('appendChunk: ', chunk.content);
            message.content += chunk.content;

            // Update blocks
            message.blocks ??= [];
            message.blocks = appendTextToBlocks(message.blocks, chunk.content);
        })
        .addCase(appendReasoning, (state, action) => {
            const chunk = action.payload;
            const message = state[chunk.messageId];
            if (!message) {
                console.warn(`appendReasoning: message ${chunk.messageId} not found`);
                return;
            }

            message.thinkingTimeline ??= [];
            message.reasoningChunks ??= [];

            const lastEvent = message.thinkingTimeline[message.thinkingTimeline.length - 1];
            const isNewReasoningBlock = !lastEvent || lastEvent.type !== 'reasoning';

            if (isNewReasoningBlock) {
                message.thinkingTimeline.push({
                    type: 'reasoning',
                    timestamp: Date.now(),
                    content: chunk.content,
                });
            } else {
                lastEvent.content += chunk.content;
            }

            message.reasoning ??= '';
            message.reasoning += chunk.content;

            message.reasoningChunks.push({
                content: chunk.content,
                sequence: chunk.sequence ?? message.reasoningChunks.length,
            });
        })
        .addCase(setToolCall, (state, action) => {
            const chunk = action.payload;
            const message = state[chunk.messageId];
            if (!message) {
                console.warn(`setToolCall: message ${chunk.messageId} not found`);
                return;
            }

            message.thinkingTimeline ??= [];
            message.blocks ??= [];
            const existingToolCallCount = message.blocks.filter((block) => block.type === 'tool_call').length;
            const isStreamingToolCallUpdate = isToolCallStreamingUpdate(message.blocks, chunk.content);

            if (!isStreamingToolCallUpdate) {
                message.thinkingTimeline.push({
                    type: 'tool_call',
                    timestamp: Date.now(),
                    toolCallIndex: existingToolCallCount,
                });
            }

            message.toolCall = chunk.content;
            message.blocks = setToolCallInBlocks(message.blocks, chunk.content);
        })
        .addCase(setToolResult, (state, action) => {
            const chunk = action.payload;
            const message = state[chunk.messageId];
            if (!message) {
                console.warn(`setToolResult: message ${chunk.messageId}: not found`);
                return;
            }

            // Update legacy field (backward compat)
            message.toolResult = chunk.content;

            // Update blocks
            message.blocks ??= [];
            message.blocks = setToolResultInBlocks(message.blocks, chunk.content, chunk.meta, chunk.callId);
        })
        .addCase(setSuggestedQuestions, (state, action) => {
            const { messageId, questions } = action.payload;
            const message = state[messageId];
            if (!message) {
                console.warn(`setSuggestedQuestions: message ${messageId} not found`);
                return;
            }
            message.suggestedQuestions = questions;
        })
        .addCase(setMessageUsage, (state, action) => {
            const { messageId, usage } = action.payload;
            const message = state[messageId];
            if (!message) {
                console.warn(`setMessageUsage: message ${messageId} not found`);
                return;
            }
            // Merge so partial updates don't clobber previously stored fields.
            message.usage = { ...message.usage, ...usage };
        })
        .addCase(setMessageModelID, (state, action) => {
            const { messageId, modelID } = action.payload;
            const message = state[messageId];
            if (!message) {
                console.warn(`setMessageModelID: message ${messageId} not found`);
                return;
            }
            message.modelID = modelID;
        })
        .addCase(addImageAttachment, (state, action) => {
            const { messageId, attachment } = action.payload;
            const message = state[messageId];
            if (!message) {
                console.warn(`cannot add image attachment to message ${messageId}: not found in Redux state`);
                return;
            }
            message.attachments ??= [];
            // Remove non-serializable fields before storing in Redux
            const { imagePreview, data, ...serializableAttachment } = attachment as any;
            message.attachments.push(serializableAttachment);
        })
        .addCase(finishMessage, (state, action) => {
            const finishAction = action.payload;
            const { messageId, content, status, modelID, requestedModel } = finishAction;
            const message = state[messageId];
            if (!message) {
                console.warn(`cannot modify message ${messageId}: not found in Redux state`);
                return;
            }

            // Only update content if a message has no content yet (wasn't streamed)
            // If content was streamed via appendChunk, keep the streamed version
            if (!message.content || message.content.length === 0) {
                message.content = content;
            }
            message.placeholder = false;
            message.status = status;
            if (modelID !== undefined) {
                message.modelID = modelID;
            }
            if (requestedModel !== undefined) {
                message.requestedModel = requestedModel;
            }
        })
        .addCase(deleteAllMessages, () => {
            return EMPTY_MESSAGE_MAP;
        })
        .addCase(pushMessageRequest, (state) => {
            return state;
        })
        .addCase(pushMessageSuccess, (state) => {
            return state;
        })
        .addCase(pushMessageNoop, (state) => {
            return state;
        })
        .addCase(pushMessageNeedsRetry, (state) => {
            return state;
        })
        .addCase(pushMessageFailure, (state) => {
            return state;
        })
        .addCase(locallyRefreshMessageFromRemoteRequest, (state) => {
            return state;
        })
        .addCase(pullMessageRequest, (state) => {
            return state;
        })
        .addCase(pullMessageSuccess, (state) => {
            return state;
        })
        .addCase(pullMessageFailure, (state) => {
            return state;
        });
});

/**
 * Persist backend-reported usage onto an assistant message.
 *
 * Reads the raw SSE `usage` payload and stores `model` on `message.modelID` (for
 * feedback) when present. Token counts are mapped to `message.usage`; using the
 * message's `contextFiles`, computes `ctxFilesTokenEstimate` (our estimate of the
 * file attachments that were active in that request) so a file-independent baseline
 * can be reconstructed later. Stores nothing when usage is absent or carries neither
 * token counts nor a model id, and never throws on missing/partial data.
 */
export function recordMessageUsage(messageId: MessageId, usage: LumoStreamUsage | undefined) {
    return (dispatch: LumoDispatch, getState: () => LumoState): void => {
        if (!usage) {
            return;
        }

        const {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: totalTokens,
            model,
        } = usage;

        if (model) {
            dispatch(setMessageModelID({ messageId, modelID: model }));
        }

        const hasTokenCounts =
            promptTokens !== undefined || completionTokens !== undefined || totalTokens !== undefined;
        if (!hasTokenCounts) {
            return;
        }

        const state = getState();
        const message = state.messages[messageId];

        let ctxFilesTokenEstimate: number | undefined;
        const tokenEstimateVersion: number = countAttachmentTokenVersion;
        const contextFiles = message?.contextFiles;
        if (contextFiles && contextFiles.length > 0) {
            const attachments = state.attachments;
            ctxFilesTokenEstimate = contextFiles.reduce((sum, id) => {
                const attachment = attachments[id];
                return sum + (attachment ? countAttachmentToken(attachment) : 0);
            }, 0);
        }

        const next: MessageUsage = {
            ...(promptTokens !== undefined && { promptTokens }),
            ...(completionTokens !== undefined && { completionTokens }),
            ...(totalTokens !== undefined && { totalTokens }),
            ...(ctxFilesTokenEstimate !== undefined && { ctxFilesTokenEstimate }),
            ...(tokenEstimateVersion !== undefined && { tokenEstimateVersion }),
        };

        dispatch(setMessageUsage({ messageId, usage: next }));
    };
}

export function newMessageId(): MessageId {
    return uuidv4();
}

export function createDate(): string {
    const date1 = new Date();
    return date1.toISOString();
}

export function createDatePair(): [string, string] {
    const date1 = new Date();
    const date2 = new Date(date1.getTime() + 1);
    return [date1.toISOString(), date2.toISOString()];
}

export default messagesReducer;
