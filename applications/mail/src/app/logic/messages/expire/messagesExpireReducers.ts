import { Draft, PayloadAction } from '@reduxjs/toolkit';

import { getLocalID, getMessage } from '../helpers/messagesReducer';
import { MessagesState } from '../messagesTypes';

const previousExpiration: Record<string, number | undefined> = {};

export const expirePending = (
    state: Draft<MessagesState>,
    action: PayloadAction<void, string, { arg: { IDs: string[]; expirationTime: number | null } }>
) => {
    const { IDs, expirationTime } = action.meta.arg;

    IDs.forEach((ID) => {
        const localID = getLocalID(state, ID);
        const messageState = getMessage(state, localID);

        if (messageState && messageState.data) {
            previousExpiration[localID] = messageState.data.ExpirationTime;
            messageState.data.ExpirationTime = expirationTime || undefined;
        }
    });
};

export const expireFullfilled = (
    state: Draft<MessagesState>,
    action: PayloadAction<void, string, { arg: { IDs: string[] } }>
) => {
    const { IDs } = action.meta.arg;

    IDs.forEach((ID) => {
        const localID = getLocalID(state, ID);

        if (localID) {
            delete previousExpiration[localID];
        }
    });
};

export const expireRejected = (
    state: Draft<MessagesState>,
    action: PayloadAction<unknown, string, { arg: { IDs: string[] } }>
) => {
    const { IDs } = action.meta.arg;

    IDs.forEach((ID) => {
        const localID = getLocalID(state, ID);
        const messageState = getMessage(state, localID);

        if (messageState && messageState.data) {
            messageState.data.ExpirationTime = previousExpiration[localID];
            delete previousExpiration[localID];
        }
    });
};
