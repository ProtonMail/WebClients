import { PayloadAction } from '@reduxjs/toolkit';
import { Draft } from 'immer';

import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { isMessage } from '../../../helpers/elements';
import { QueryParams, QueryResults, TaskRunningInfo } from '../../elements/elementsTypes';
import { RootState } from '../../store';
import { localID as localIDSelector, messageByID } from '../messagesSelectors';
import { MessagesState } from '../messagesTypes';

/**
 * Only takes technical stuff from the updated message
 */
export const mergeSavedMessage = (messageSaved: Draft<Message>, messageReturned: Message) => {
    Object.assign(messageSaved, {
        ID: messageReturned.ID,
        Time: messageReturned.Time,
        ConversationID: messageReturned.ConversationID,
        LabelIDs: messageReturned.LabelIDs,
    });
};

export const getLocalID = (state: Draft<MessagesState>, ID: string) =>
    localIDSelector({ messages: state } as RootState, { ID });

export const getMessage = (state: Draft<MessagesState>, ID: string) =>
    messageByID({ messages: state } as RootState, { ID });

export const updateFromElements = (
    state: Draft<MessagesState>,
    action: PayloadAction<
        {
            result: QueryResults;
            taskRunning: TaskRunningInfo;
        },
        string,
        {
            arg: QueryParams;
            requestId: string;
            requestStatus: 'fulfilled';
        },
        never
    >
) => {
    const { Elements } = action.payload.result;

    if (Elements && Elements.length) {
        Elements.forEach((element) => {
            if (isMessage(element)) {
                const messageState = getMessage(state, element.ID);

                if (messageState) {
                    messageState.data = { ...messageState.data, ...(element as Message) };
                }
            }
        });
    }
};
