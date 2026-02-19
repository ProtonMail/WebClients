import { createAction, createReducer } from '@reduxjs/toolkit';

import type { AttachmentId } from '../../types';

export type AttachmentLoadingStateEntry = {
    loading: boolean;
    error?: string;
};

export type AttachmentLoadingStateMap = {
    [id: AttachmentId]: AttachmentLoadingStateEntry;
};

// Actions
export const setAttachmentLoading = createAction<AttachmentId>('lumo/attachmentLoadingState/setLoading');
export const setAttachmentError = createAction<{ id: AttachmentId; error: string }>(
    'lumo/attachmentLoadingState/setError'
);
export const clearAttachmentLoading = createAction<AttachmentId>('lumo/attachmentLoadingState/clearLoading');

const initialState: AttachmentLoadingStateMap = {};

export const attachmentLoadingStateReducer = createReducer<AttachmentLoadingStateMap>(initialState, (builder) => {
    builder
        .addCase(setAttachmentLoading, (state, action) => {
            const id = action.payload;
            state[id] = { loading: true };
        })
        .addCase(setAttachmentError, (state, action) => {
            const { id, error } = action.payload;
            state[id] = { loading: false, error };
        })
        .addCase(clearAttachmentLoading, (state, action) => {
            const id = action.payload;
            delete state[id];
        });
});
