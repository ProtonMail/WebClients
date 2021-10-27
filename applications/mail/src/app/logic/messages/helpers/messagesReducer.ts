import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { Draft } from 'immer';
import { RootState } from '../../store';
import { MessagesState } from '../messagesTypes';
import { localID as localIDSelector, messageByID } from '../messagesSelectors';

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
