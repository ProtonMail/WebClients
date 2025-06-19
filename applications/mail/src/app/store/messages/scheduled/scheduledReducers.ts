import type { Draft, PayloadAction } from '@reduxjs/toolkit';

import type { MessagesState } from '@proton/mail/store/messages/messagesTypes';

import { getMessage } from '../helpers/messagesReducer';

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

export const cancelScheduled = (
    state: Draft<MessagesState>,
    { payload: { ID, scheduledAt } }: PayloadAction<{ ID: string; scheduledAt?: number }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        /*
           Reset the load retry so that if the user schedules again the message and clicks on the view message link,
           the body of message can be loaded. Without the reset, the message can have a loadRetry > 3, which will block
           the loading of the mail body.
         */
        messageState.loadRetry = 0;
        if (scheduledAt) {
            if (messageState.draftFlags) {
                messageState.draftFlags.scheduledAt = scheduledAt;
            } else {
                messageState.draftFlags = { scheduledAt };
            }
        } else {
            if (messageState.draftFlags) {
                delete messageState.draftFlags.scheduledAt;
            }
        }
    }
};
