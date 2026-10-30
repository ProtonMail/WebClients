import type { Draft } from 'immer';

import { localID as localIDSelector, messageByID, messagesByConversationID } from '../messagesSelectors';
import type { MessagesState, MessagesStoreState } from '../messagesTypes';

export const getLocalID = (state: Draft<MessagesState>, ID: string) =>
    localIDSelector({ messages: state } as MessagesStoreState, { ID });

export const getMessage = (state: Draft<MessagesState>, ID: string) =>
    messageByID({ messages: state } as MessagesStoreState, { ID });

export const getMessagesByConversationID = (state: Draft<MessagesState>, ConversationID: string) =>
    messagesByConversationID({ messages: state } as MessagesStoreState, { ConversationID });
