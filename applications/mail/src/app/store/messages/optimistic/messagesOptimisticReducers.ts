import type { PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';

import type { MessageState, MessagesState } from '@proton/mail/store/messages/messagesTypes';

import { hasLabel } from '../../../helpers/elements';
import type { LabelChanges } from '../../../helpers/labels';
import { applyLabelChangesOnMessage } from '../../../helpers/labels';
import { applyMarkAsChangesOnMessage } from '../../../helpers/message/messages';
import type { MarkAsChanges } from '../../../hooks/optimistic/useOptimisticMarkAs';
import { getLocalID, getMessage } from '../helpers/messagesReducer';

export const optimisticApplyLabels = (
    state: Draft<MessagesState>,
    {
        payload: { ID, changes, unreadStatuses },
    }: PayloadAction<{ ID: string; changes: LabelChanges; unreadStatuses?: { id: string; unread: number }[] }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState && messageState.data) {
        messageState.data = applyLabelChangesOnMessage(messageState.data, changes, unreadStatuses);
    }
};

export const optimisticMarkAs = (
    state: Draft<MessagesState>,
    { payload: { ID, changes } }: PayloadAction<{ ID: string; changes: MarkAsChanges }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState && messageState.data) {
        messageState.data = applyMarkAsChangesOnMessage(messageState.data, changes);
    }
};

export const optimisticDelete = (state: Draft<MessagesState>, { payload: IDs }: PayloadAction<string[]>) => {
    IDs.forEach((ID) => {
        const localID = getLocalID(state, ID);
        delete state[localID];
    });
};

export const optimisticEmptyLabel = (state: Draft<MessagesState>, { payload: labelID }: PayloadAction<string>) => {
    Object.entries(state).forEach(([ID, message]) => {
        if (message && message.data && hasLabel(message.data, labelID)) {
            delete state[ID];
        }
    });
};

export const optimisticRestore = (
    state: Draft<MessagesState>,
    { payload: messages }: PayloadAction<MessageState[]>
) => {
    messages.forEach((message) => {
        state[message.localID] = message as any;
    });
};
