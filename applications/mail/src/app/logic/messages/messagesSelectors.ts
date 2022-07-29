import { createSelector } from 'reselect';

import { DRAFT_ID_PREFIX } from '@proton/shared/lib/mail/messages';

import { RootState } from '../store';

const messages = (state: RootState) => state.messages;

const currentID = (_: RootState, { ID }: { ID: string }) => ID;

export const localID = createSelector([messages, currentID], (messages, currentID) => {
    const localID = [...Object.keys(messages)]
        .filter((key) => key?.startsWith(DRAFT_ID_PREFIX))
        .find((key) => messages[key]?.data?.ID === currentID);

    return localID || currentID;
});

export const messageByID = createSelector([messages, localID], (messages, localID) => messages[localID]);
