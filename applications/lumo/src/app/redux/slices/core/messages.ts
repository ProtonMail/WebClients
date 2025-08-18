import { createAction, createReducer } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

import { type Priority } from '../../../remote/scheduler';
import type { IdMapEntry, RemoteMessage } from '../../../remote/types';
import type { MessagePub } from '../../../types';
import { type ChunkAction, type FinishMessageAction, type Message, type MessageId } from '../../../types';

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

// Low-level Redux store operations without side-effects.
export const addMessage = createAction<MessagePub>('lumo/message/add');
export const appendChunk = createAction<ChunkAction>('lumo/message/appendChunk');
export const setToolCall = createAction<ChunkAction>('lumo/message/setToolCall');
export const setToolResult = createAction<ChunkAction>('lumo/message/setToolResult');
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
            console.log('Action triggered: addMessage', action.payload);
            const message = action.payload;
            state[message.id] = message;
        })
        .addCase(deleteMessage, (state, action) => {
            console.log('Action triggered: deleteMessage', action.payload);
            const id = action.payload;
            delete state[id];
        })
        .addCase(appendChunk, (state, action) => {
            console.log('Action triggered: appendChunk', action.payload);
            const chunk = action.payload;
            const message = state[chunk.messageId];
            message.content ??= '';
            message.content += chunk.content;
        })
        .addCase(setToolCall, (state, action) => {
            console.log('Action triggered: setToolCall', action.payload);
            const chunk = action.payload;
            const message = state[chunk.messageId];
            message.toolCall = chunk.content;
        })
        .addCase(setToolResult, (state, action) => {
            console.log('Action triggered: setToolResult', action.payload);
            const chunk = action.payload;
            const message = state[chunk.messageId];
            if (!message) {
                console.warn(`cannot modify message ${chunk.messageId}: not found in Redux state`);
                return;
            }
            message.toolResult = chunk.content;
        })
        .addCase(finishMessage, (state, action) => {
            console.log('Action triggered: finishMessage', action.payload);
            const finishAction = action.payload;
            const { messageId, content, status } = finishAction;
            const message = state[messageId];
            if (!message) {
                console.warn(`cannot modify message ${messageId}: not found in Redux state`);
                return;
            }
            message.content = content;
            message.placeholder = false;
            message.status = status;
        })
        .addCase(deleteAllMessages, () => {
            console.log('Action triggered: deleteAllMessages');
            return EMPTY_MESSAGE_MAP;
        })
        .addCase(pushMessageRequest, (state, action) => {
            console.log('Action triggered: pushMessageRequest', action.payload);
            return state;
        })
        .addCase(pushMessageSuccess, (state, action) => {
            console.log('Action triggered: pushMessageSuccess', action.payload);
            return state;
        })
        .addCase(pushMessageNoop, (state, action) => {
            console.log('Action triggered: pushMessageNoop', action.payload);
            return state;
        })
        .addCase(pushMessageNeedsRetry, (state, action) => {
            console.log('Action triggered: pushMessageNeedsRetry', action.payload);
            return state;
        })
        .addCase(pushMessageFailure, (state, action) => {
            console.log('Action triggered: pushMessageFailure', action.payload);
            return state;
        })
        .addCase(locallyRefreshMessageFromRemoteRequest, (state, action) => {
            console.log('Action triggered: locallyRefreshMessageFromRemoteRequest', action.payload);
            return state;
        })
        .addCase(pullMessageRequest, (state, action) => {
            console.log('Action triggered: pullMessageRequest', action.payload);
            return state;
        })
        .addCase(pullMessageSuccess, (state, action) => {
            console.log('Action triggered: pullMessageSuccess', action.payload);
            return state;
        })
        .addCase(pullMessageFailure, (state, action) => {
            console.log('Action triggered: pullMessageFailure', action.payload);
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
