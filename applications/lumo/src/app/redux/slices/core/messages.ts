import { createAction, createReducer } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

import { appendTextToBlocks, setToolCallInBlocks, setToolResultInBlocks } from '../../../messageHelpers';
import type { Priority } from '../../../remote/scheduler';
import type { IdMapEntry, RemoteMessage } from '../../../remote/types';
import type {
    ChunkAction,
    FinishMessageAction,
    Message,
    MessageId,
    MessagePub,
    ShallowAttachment,
} from '../../../types';

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

// Low-level Redux store operations without side-effects.
export const addMessage = createAction<MessagePub>('lumo/message/add');
export const appendChunk = createAction<ChunkAction>('lumo/message/appendChunk');
export const appendReasoning = createAction<ChunkAction>('lumo/message/appendReasoning');
export const setToolCall = createAction<ChunkAction>('lumo/message/setToolCall');
export const setToolResult = createAction<ChunkAction>('lumo/message/setToolResult');
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

const initialState: MessageMap = EMPTY_MESSAGE_MAP;

const messagesReducer = createReducer<MessageMap>(initialState, (builder) => {
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
            const toolCallIndex = (message.blocks?.filter(b => b.type === 'tool_call').length ?? 0);
            message.thinkingTimeline.push({
                type: 'tool_call',
                timestamp: Date.now(),
                toolCallIndex,
            });

            message.toolCall = chunk.content;
            message.blocks ??= [];
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
            message.blocks = setToolResultInBlocks(message.blocks, chunk.content);
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
            const { messageId, content, status } = finishAction;
            const message = state[messageId];
            if (!message) {
                console.warn(`cannot modify message ${messageId}: not found in Redux state`);
                return;
            }

            // Only update content if message has no content yet (wasn't streamed)
            // If content was streamed via appendChunk, keep the streamed version
            if (!message.content || message.content.length === 0) {
                message.content = content;
            }
            message.placeholder = false;
            message.status = status;
        })
        .addCase(deleteAllMessages, () => {
            return EMPTY_MESSAGE_MAP;
        })
        .addCase(pushMessageRequest, (state, action) => {
            return state;
        })
        .addCase(pushMessageSuccess, (state, action) => {
            return state;
        })
        .addCase(pushMessageNoop, (state, action) => {
            return state;
        })
        .addCase(pushMessageNeedsRetry, (state, action) => {
            return state;
        })
        .addCase(pushMessageFailure, (state, action) => {
            return state;
        })
        .addCase(locallyRefreshMessageFromRemoteRequest, (state, action) => {
            return state;
        })
        .addCase(pullMessageRequest, (state, action) => {
            return state;
        })
        .addCase(pullMessageSuccess, (state, action) => {
            return state;
        })
        .addCase(pullMessageFailure, (state, action) => {
            return state;
        });
});

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
