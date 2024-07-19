import type { PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';

import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { isMessage } from '../../../helpers/elements';
import type { QueryParams, QueryResults, TaskRunningInfo } from '../../elements/elementsTypes';
import type { MailState } from '../../store';
import { localID as localIDSelector, messageByID } from '../messagesSelectors';
import type { MessagesState } from '../messagesTypes';

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
    localIDSelector({ messages: state } as MailState, { ID });

export const getMessage = (state: Draft<MessagesState>, ID: string) =>
    messageByID({ messages: state } as MailState, { ID });

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
                    /**
                     * For messages containing MimeAttachments, the NumAttachment value is updated on message load
                     * So if a message is opened in a location, we might update NumAttachments.
                     * Then, when switching location, we will receive again metadata from the API, which does not know about
                     * Mime attachments.
                     * Since the message is already loaded in the session, we will not compute this value again, and NumAttachments
                     * will be 0.
                     * We are relying on this value to display the attachment list, so in that case, the attachment would be hidden.
                     *
                     * To prevent this behaviour, we are reusing the NumAttachment value if it was already set.
                     */
                    const realNumAttachments = messageState.data?.NumAttachments
                        ? messageState.data?.NumAttachments
                        : element.NumAttachments || 0;

                    messageState.data = {
                        ...messageState.data,
                        ...(element as Message),
                        NumAttachments: realNumAttachments,
                    };
                }
            }
        });
    }
};
