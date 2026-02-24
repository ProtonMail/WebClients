import {createAction, createReducer} from '@reduxjs/toolkit';
import {v4 as uuidv4} from 'uuid';

import type {Priority} from '../../../remote/scheduler';
import type {GetConversationRemote, IdMapEntry, RemoteConversation} from '../../../remote/types';
import type {
    Conversation,
    ConversationId,
    EditConversation,
    SerializedConversation,
    UpdateConversationStatusAction,
} from '../../../types';

export type PushConversationRequest = {
    id: ConversationId;
    priority?: Priority;
};
export type PushConversationSuccess = PushConversationRequest & {
    conversation?: Conversation;
    serializedConversation?: SerializedConversation;
    entry?: IdMapEntry;
};
export type PushConversationFailure = PushConversationRequest & {
    error: string;
};
export type PullConversationRequest = {
    id: ConversationId;
};

// Low-level Redux store operations without side-effects.
export const addConversation = createAction<Conversation>('lumo/conversation/add');
export const changeConversationTitle = createAction<EditConversation>('lumo/conversation/changeTitle');
export const toggleConversationStarred = createAction<ConversationId>('lumo/conversation/toggleStarred');
export const deleteConversation = createAction<ConversationId>('lumo/conversation/delete');
export const deleteAllConversations = createAction('lumo/conversation/deleteAll');
export const updateConversationStatus = createAction<UpdateConversationStatusAction>('lumo/conversation/updateStatus');

// High-level Redux-saga requests and events.
export const pushConversationRequest = createAction<PushConversationRequest>('lumo/conversation/pushRequest');
export const pushConversationSuccess = createAction<PushConversationSuccess>('lumo/conversation/pushSuccess');
export const pushConversationNoop = createAction<PushConversationRequest>('lumo/conversation/pushNoop');
export const pushConversationNeedsRetry = createAction<PushConversationRequest>('lumo/conversation/pushNeedsRetry');
export const pushConversationFailure = createAction<PushConversationFailure>('lumo/conversation/pushFailure');
export const locallyDeleteConversationFromLocalRequest = createAction<ConversationId>('lumo/conversation/locallyDeleteFromLocalRequest'); // prettier-ignore
export const locallyDeleteConversationFromRemoteRequest = createAction<ConversationId>('lumo/conversation/locallyDeleteFromRemoteRequest'); // prettier-ignore
export const locallyRefreshConversationFromRemoteRequest = createAction<RemoteConversation>('lumo/conversation/refreshFromRemoteRequest'); // prettier-ignore
export const pullConversationRequest = createAction<PullConversationRequest>('lumo/conversation/pullRequest');
export const pullConversationSuccess = createAction<GetConversationRemote>('lumo/conversation/pullSuccess');
export const pullConversationFailure = createAction<ConversationId>('lumo/conversation/pullFailure');

export type ConversationMap = Record<ConversationId, Conversation>;
export const EMPTY_CONVERSATION_MAP: ConversationMap = {};

const conversationsReducer = createReducer<ConversationMap>(EMPTY_CONVERSATION_MAP, (builder) => {
    builder
        .addCase(addConversation, (state, action) => {
            console.log('Action triggered: addConversation', action.payload);
            const conversation = action.payload;
            state[conversation.id] = conversation;
        })
        .addCase(changeConversationTitle, (state, action) => {
            console.log('Action triggered: changeConversationTitle', action.payload);
            const payload = action.payload;
            const conversation = state[payload.id];
            conversation.title = payload.title;
        })
        .addCase(toggleConversationStarred, (state, action) => {
            console.log('Action triggered: toggleConversationStarred', action.payload);
            const id: ConversationId = action.payload;
            const conversation = state[id];
            conversation.starred = !conversation.starred;
        })
        .addCase(deleteConversation, (state, action) => {
            console.log('Action triggered: deleteConversation', action.payload);
            const id: ConversationId = action.payload;
            delete state[id];
        })
        .addCase(deleteAllConversations, () => {
            console.log('Action triggered: deleteAllConversations');
            return EMPTY_CONVERSATION_MAP;
        })
        .addCase(updateConversationStatus, (state, action) => {
            console.log('Action triggered: updateConversationStatus', action.payload);
            const payload = action.payload;
            const conversation = state[payload.id];
            conversation.status = payload.status;
        })
        .addCase(pushConversationRequest, (state, action) => {
            console.log('Action triggered: pushConversationRequest', action.payload);
            return state;
        })
        .addCase(pushConversationSuccess, (state, action) => {
            console.log('Action triggered: pushConversationSuccess', action.payload);
            return state;
        })
        .addCase(pushConversationNeedsRetry, (state, action) => {
            console.log('Action triggered: pushConversationNeedsRetry', action.payload);
            return state;
        })
        .addCase(pushConversationFailure, (state, action) => {
            console.log('Action triggered: pushConversationFailure', action.payload);
            return state;
        })
        .addCase(locallyDeleteConversationFromLocalRequest, (state, action) => {
            console.log('Action triggered: locallyDeleteConversationFromLocalRequest', action.payload);
            return state;
        })
        .addCase(locallyDeleteConversationFromRemoteRequest, (state, action) => {
            console.log('Action triggered: locallyDeleteConversationFromRemoteRequest', action.payload);
            return state;
        })
        .addCase(locallyRefreshConversationFromRemoteRequest, (state, action) => {
            console.log('Action triggered: locallyRefreshConversationFromRemoteRequest', action.payload);
            return state;
        })
        .addCase(pullConversationRequest, (state, action) => {
            console.log('Action triggered: pullConversationRequest', action.payload);
            return state;
        })
        .addCase(pullConversationSuccess, (state, action) => {
            console.log('Action triggered: pullConversationSuccess', action.payload);
            return state;
        })
        .addCase(pullConversationFailure, (state, action) => {
            console.log('Action triggered: pullConversationFailure', action.payload);
            return state;
        });
});

export function newConversationId(): ConversationId {
    return uuidv4();
}

export default conversationsReducer;
