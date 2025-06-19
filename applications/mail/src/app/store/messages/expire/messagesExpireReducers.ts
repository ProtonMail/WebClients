import type { Draft, PayloadAction } from '@reduxjs/toolkit';

import type { MessagesState } from '@proton/mail/store/messages/messagesTypes';

import { getLocalID, getMessage } from '../helpers/messagesReducer';

const previousExpiration: Record<string, number | undefined> = {};
const previousDraftFlagsExpiresIn: Record<string, Date | undefined> = {};

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
            messageState.data.ExpirationTime = expirationTime || 0;

            if (messageState.draftFlags?.expiresIn) {
                previousDraftFlagsExpiresIn[localID] = messageState.draftFlags.expiresIn;
                messageState.draftFlags.expiresIn = undefined;
            }
        }
    });
};

export const expireFullfilled = (
    state: Draft<MessagesState>,
    action: PayloadAction<Promise<void>, string, { arg: { IDs: string[] } }>
) => {
    const { IDs } = action.meta.arg;

    IDs.forEach((ID) => {
        const localID = getLocalID(state, ID);

        if (localID) {
            delete previousExpiration[localID];
            delete previousDraftFlagsExpiresIn[localID];
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

            if (messageState.draftFlags) {
                messageState.draftFlags.expiresIn = previousDraftFlagsExpiresIn[localID];
                delete previousDraftFlagsExpiresIn[localID];
            }
        }
    });
};
