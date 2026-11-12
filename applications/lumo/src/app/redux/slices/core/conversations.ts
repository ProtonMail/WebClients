import { createAction, createReducer, prepareAutoBatched } from '@reduxjs/toolkit';
import isEqual from 'lodash/isEqual';
import { v4 as uuidv4 } from 'uuid';

import type { ModelTier } from '../../../providers/modelTierConstants';
import type { Priority } from '../../../remote/scheduler';
import type { GetConversationRemote, IdMapEntry, RemoteConversation } from '../../../remote/types';
import type {
    ArtifactAssetPointer,
    Conversation,
    ConversationId,
    EditConversation,
    SerializedConversation,
    SpaceId,
    UpdateConversationStatusAction,
} from '../../../types';
import type { LumoDispatch, LumoState } from '../../store';

interface SetConversationModelTierAction {
    id: ConversationId;
    modelTier: ModelTier;
    answerNowUsed?: true;
}

const setConversationModelTier = createAction<SetConversationModelTierAction>('lumo/conversation/setModelTier');

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
export type SetConversationAgentAction = {
    id: ConversationId;
    agentId: string | undefined;
};

export type SetConversationArtifactCreationAction = {
    id: ConversationId;
    // Once set, a conversation keeps its own choice; there is no "back to the global default".
    artifactCreation: boolean;
};

export const addConversation = createAction('lumo/conversation/add', prepareAutoBatched<Conversation>());
export const changeConversationTitle = createAction<EditConversation>('lumo/conversation/changeTitle');
export const setConversationAgent = createAction<SetConversationAgentAction>('lumo/conversation/setAgent');
export const setConversationArtifactCreation = createAction<SetConversationArtifactCreationAction>(
    'lumo/conversation/setArtifactCreation'
);

export type SetConversationArtifactAssetAction = {
    id: ConversationId;
    artifactId: string;
    pointer: ArtifactAssetPointer;
};

export const setConversationArtifactAsset = createAction<SetConversationArtifactAssetAction>(
    'lumo/conversation/setArtifactAsset'
);
export const toggleConversationStarred = createAction<ConversationId>('lumo/conversation/toggleStarred');
export const deleteConversation = createAction('lumo/conversation/delete', prepareAutoBatched<ConversationId>());
export const deleteAllConversations = createAction('lumo/conversation/deleteAll');
export const updateConversationStatus = createAction<UpdateConversationStatusAction>('lumo/conversation/updateStatus');

// High-level Redux-saga requests and events.
export const pushConversationRequest = createAction<PushConversationRequest>('lumo/conversation/pushRequest');
export const pushConversationSuccess = createAction<PushConversationSuccess>('lumo/conversation/pushSuccess');
export const pushConversationNoop = createAction<PushConversationRequest>('lumo/conversation/pushNoop');
export const pushConversationNeedsRetry = createAction<PushConversationRequest>('lumo/conversation/pushNeedsRetry');
export const pushConversationFailure = createAction<PushConversationFailure>('lumo/conversation/pushFailure');
export type MoveConversationToSpaceRequest = {
    conversationId: ConversationId;
    targetSpaceId: SpaceId;
    /** Identifies this attempt, so a result is never taken for another attempt at the same chat. */
    attemptId: string;
};
export type MoveConversationToSpaceSuccess = MoveConversationToSpaceRequest & {
    newConversationId: ConversationId;
    /**
     * The chat is safely in the project, but removing the original failed part way. The copy is kept
     * rather than rolled back, since it is then the only complete one.
     */
    cleanupFailed?: boolean;
};
/**
 * - `loading`: fetching the chat's messages and files from the server (slow connections wait here).
 * - `copying`: creating the copy and waiting for it to sync.
 * - `finishing`: removing the original.
 */
type MoveConversationToSpaceStage = 'loading' | 'copying' | 'finishing';
export type MoveConversationToSpaceProgress = MoveConversationToSpaceRequest & {
    stage: MoveConversationToSpaceStage;
    /** Number of items the stage handles (messages and files), when known. */
    total?: number;
};
export type MoveConversationToSpaceFailure = MoveConversationToSpaceRequest & {
    error: string;
    /** Set when the failure is a known, user-actionable condition. */
    reason?: 'limit' | 'busy' | 'unsupported' | 'unavailable' | 'privacy';
};

// Copies a conversation (with its messages and attachments) into another space, then removes the original.
// Space ownership can't be changed in place: the space key encrypts the data and the conversation id is
// bound to its space, so this creates new resources under new ids.
export const moveConversationToSpaceRequest = createAction<MoveConversationToSpaceRequest>(
    'lumo/conversation/moveToSpaceRequest'
);
export const moveConversationToSpaceProgress = createAction<MoveConversationToSpaceProgress>(
    'lumo/conversation/moveToSpaceProgress'
);
export const moveConversationToSpaceSuccess = createAction<MoveConversationToSpaceSuccess>(
    'lumo/conversation/moveToSpaceSuccess'
);
export const moveConversationToSpaceFailure = createAction<MoveConversationToSpaceFailure>(
    'lumo/conversation/moveToSpaceFailure'
);

export type ExpireConversationsRequest = {
    hasLumoPlus: boolean;
};

export const expireConversationsRequest = createAction<ExpireConversationsRequest>(
    'lumo/conversation/expireConversationsRequest'
);
export const locallyDeleteConversationFromLocalRequest = createAction<ConversationId>('lumo/conversation/locallyDeleteFromLocalRequest'); // oxfmt-ignore
export const locallyDeleteConversationFromRemoteRequest = createAction('lumo/conversation/locallyDeleteFromRemoteRequest', prepareAutoBatched<ConversationId>()); // oxfmt-ignore
export const locallyRefreshConversationFromRemoteRequest = createAction('lumo/conversation/refreshFromRemoteRequest', prepareAutoBatched<RemoteConversation>()); // oxfmt-ignore
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
            const existing = state[conversation.id];

            // `status` and `ghost` are local-only (`ConversationExtra`) and never round-trip through
            // the server, so a remotely-sourced conversation cannot carry them. Replacing wholesale
            // would drop an in-flight `generating` and mark the generation finished while the answer
            // is still streaming, hiding the stop button and leaving no way to cancel.
            const merged = { ...conversation };
            if (merged.status === undefined && existing?.status !== undefined) {
                merged.status = existing.status;
            }
            if (merged.ghost === undefined && existing?.ghost !== undefined) {
                merged.ghost = existing.ghost;
            }

            if (existing && isEqual(existing, merged)) {
                return;
            }
            state[conversation.id] = merged;
        })
        .addCase(changeConversationTitle, (state, action) => {
            console.log('Action triggered: changeConversationTitle', action.payload);
            const payload = action.payload;
            const conversation = state[payload.id];
            if (!conversation) return;
            conversation.title = payload.title;
        })
        .addCase(setConversationAgent, (state, action) => {
            console.log('Action triggered: setConversationAgent', action.payload);
            const { id, agentId } = action.payload;
            const conversation = state[id];
            if (conversation) {
                conversation.agentId = agentId;
            }
        })
        .addCase(setConversationModelTier, (state, { payload }) => {
            const conversation = state[payload.id];
            if (conversation) {
                conversation.modelTier = payload.modelTier;
                if (payload.answerNowUsed) {
                    conversation.answerNowUsed = true;
                }
            }
        })
        .addCase(setConversationArtifactCreation, (state, action) => {
            console.log('Action triggered: setConversationArtifactCreation', action.payload);
            const { id, artifactCreation } = action.payload;
            const conversation = state[id];
            if (conversation) {
                conversation.artifactCreation = artifactCreation;
            }
        })
        .addCase(setConversationArtifactAsset, (state, action) => {
            console.log('Action triggered: setConversationArtifactAsset', action.payload);
            const { id, artifactId, pointer } = action.payload;
            const conversation = state[id];
            if (!conversation) {
                return;
            }
            conversation.artifactAssets = {
                ...conversation.artifactAssets,
                [artifactId]: pointer,
            };
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
            if (!conversation) return;
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

export function saveConversationModelTier(payload: SetConversationModelTierAction) {
    return (dispatch: LumoDispatch, getState: () => LumoState): void => {
        const conversation = getState().conversations[payload.id];
        if (!conversation) {
            return;
        }
        dispatch(setConversationModelTier(payload));
        if (!conversation.ghost) {
            dispatch(pushConversationRequest({ id: payload.id }));
        }
    };
}

export default conversationsReducer;
