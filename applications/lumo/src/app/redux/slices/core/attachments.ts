import { createAction, createReducer } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

import type { Priority } from '../../../remote/scheduler';
import type { IdMapEntry, RemoteAttachment } from '../../../remote/types';
import type { SerializedAttachment } from '../../../types';
import { type Attachment, type AttachmentId } from '../../../types';

export type PushAttachmentRequest = {
    id: AttachmentId;
    priority?: Priority;
};

export type PushAttachmentSuccess = PushAttachmentRequest & {
    attachment?: Attachment;
    serializedAttachment?: SerializedAttachment;
    entry?: IdMapEntry;
};

export type PushAttachmentFailure = PushAttachmentRequest & {
    error: string;
};
export type PullAttachmentRequest = {
    id: AttachmentId;
};

// Low-level Redux store operations without side-effects.
export const upsertAttachment = createAction<Attachment>('lumo/attachment/upsert');
export const deleteAttachment = createAction<AttachmentId>('lumo/attachment/delete');
export const deleteAllAttachments = createAction('lumo/attachment/deleteAll');
export const clearProvisionalAttachments = createAction('lumo/attachment/clearProvisional');
export const addAttachment = createAction<Attachment>('lumo/attachment/add');

// High-level Redux-saga requests and events.
export const pushAttachmentRequest = createAction<PushAttachmentRequest>('lumo/attachment/pushRequest');
export const pushAttachmentSuccess = createAction<PushAttachmentSuccess>('lumo/attachment/pushSuccess');
export const pushAttachmentNoop = createAction<PushAttachmentRequest>('lumo/attachment/pushNoop');
export const pushAttachmentNeedsRetry = createAction<PushAttachmentRequest>('lumo/attachment/pushNeedsRetry');
export const pushAttachmentFailure = createAction<PushAttachmentFailure>('lumo/attachment/pushFailure');
export const locallyDeleteAttachmentFromLocalRequest = createAction<AttachmentId>(
    'lumo/attachment/locallyDeleteFromLocalRequest'
);
export const locallyDeleteAttachmentFromRemoteRequest = createAction<AttachmentId>(
    'lumo/attachment/locallyDeleteFromRemoteRequest'
);
export const locallyRefreshAttachmentFromRemoteRequest = createAction<RemoteAttachment>(
    'lumo/attachment/refreshFromRemoteRequest'
);
// export const locallyRefreshAttachmentFromRemoteMessageRequest = createAction<ShallowAttachment>(
//     'lumo/attachment/refreshFromRemoteMessageRequest'
// );
export const pullAttachmentRequest = createAction<PullAttachmentRequest>('lumo/attachment/pullRequest');
export const pullAttachmentSuccess = createAction<RemoteAttachment>('lumo/attachment/pullSuccess');
export const pullAttachmentFailure = createAction<AttachmentId>('lumo/attachment/pullFailure');

export type AttachmentMap = Record<AttachmentId, Attachment>;
export const EMPTY_ATTACHMENT_MAP = {};
export const EMPTY_ATTACHMENT_ARRAY = [];

const initialState: AttachmentMap = EMPTY_ATTACHMENT_MAP;
const attachmentsReducer = createReducer<AttachmentMap>(initialState, (builder) => {
    builder
        .addCase(upsertAttachment, (state, action) => {
            console.log('Action triggered: upsertAttachment', action.payload);
            let attachment = action.payload;
            state[attachment.id] = attachment;
        })
        .addCase(addAttachment, (state, action) => {
            console.log('Action triggered: addAttachment', action.payload);
            let attachment = action.payload;
            state[attachment.id] = attachment;
        })
        .addCase(deleteAttachment, (state, action) => {
            console.log('Action triggered: deleteAttachment', action.payload);
            let attachmentId = action.payload;
            delete state[attachmentId];
        })
        .addCase(deleteAllAttachments, () => {
            console.log('Action triggered: deleteAllAttachments');
            return EMPTY_ATTACHMENT_MAP;
        })
        .addCase(clearProvisionalAttachments, (state) => {
            console.log('Action triggered: clearProvisionalAttachments');
            // Remove all attachments that don't have a spaceId (provisional attachments)
            const provisionalIds = Object.keys(state).filter(id => !state[id].spaceId);
            provisionalIds.forEach(id => {
                delete state[id];
            });
            console.log(`Cleared ${provisionalIds.length} provisional attachments`);
        })
        .addCase(pushAttachmentRequest, (state, action) => {
            console.log('Action triggered: pushAttachmentRequest', action.payload);
            return state;
        })
        .addCase(pushAttachmentSuccess, (state, action) => {
            console.log('Action triggered: pushAttachmentSuccess', action.payload);
            return state;
        })
        .addCase(pushAttachmentNoop, (state, action) => {
            console.log('Action triggered: pushAttachmentNoop', action.payload);
            return state;
        })
        .addCase(pushAttachmentNeedsRetry, (state, action) => {
            console.log('Action triggered: pushAttachmentNeedsRetry', action.payload);
            return state;
        })
        .addCase(pushAttachmentFailure, (state, action) => {
            console.log('Action triggered: pushAttachmentFailure', action.payload);
            return state;
        })
        .addCase(locallyDeleteAttachmentFromLocalRequest, (state, action) => {
            console.log('Action triggered: locallyDeleteAttachmentFromLocalRequest', action.payload);
            return state;
        })
        .addCase(locallyDeleteAttachmentFromRemoteRequest, (state, action) => {
            console.log('Action triggered: locallyDeleteAttachmentFromRemoteRequest', action.payload);
            return state;
        })
        .addCase(locallyRefreshAttachmentFromRemoteRequest, (state, action) => {
            console.log('Action triggered: locallyRefreshAttachmentFromRemoteRequest', action.payload);
            return state;
        })
        .addCase(pullAttachmentRequest, (state, action) => {
            console.log('Action triggered: pullAttachmentRequest', action.payload);
            return state;
        })
        .addCase(pullAttachmentSuccess, (state, action) => {
            console.log('Action triggered: pullAttachmentSuccess', action.payload);
            return state;
        })
        .addCase(pullAttachmentFailure, (state, action) => {
            console.log('Action triggered: pullAttachmentFailure', action.payload);
            return state;
        });
});

export function newAttachmentId(): AttachmentId {
    return uuidv4();
}

export default attachmentsReducer;
