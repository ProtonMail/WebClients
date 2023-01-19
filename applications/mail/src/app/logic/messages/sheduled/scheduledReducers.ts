import { Draft, PayloadAction } from '@reduxjs/toolkit';

import { getMessage } from '../helpers/messagesReducer';
import { MessagesState } from '../messagesTypes';

export const updateScheduled = (
    state: Draft<MessagesState>,
    { payload: { ID, scheduledAt } }: PayloadAction<{ ID: string; scheduledAt: number }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        if (messageState.draftFlags) {
            messageState.draftFlags.scheduledAt = scheduledAt;
        } else {
            messageState.draftFlags = { scheduledAt };
        }
    }
};

export const cancelScheduled = (state: Draft<MessagesState>, { payload: ID }: PayloadAction<string>) => {
    const message = getMessage(state, ID);

    if (message) {
        message.loadRetry = 0;
        if (message.draftFlags) {
            message.draftFlags.scheduledAt = undefined;
        }
    }
};
