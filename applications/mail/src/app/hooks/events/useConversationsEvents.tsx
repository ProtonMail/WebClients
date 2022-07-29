import { useDispatch } from 'react-redux';

import { useApi, useSubscribeEventManager } from '@proton/components';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { parseLabelIDsInEvent } from '../../helpers/elements';
import {
    eventConversationUpdate,
    eventDelete,
    eventMessageUpdate,
    load as loadAction,
} from '../../logic/conversations/conversationsActions';
import { Conversation } from '../../models/conversation';
import { Event, LabelIDsChanges } from '../../models/event';
import { useGetConversation } from '../conversation/useConversation';

export const useConversationsEvent = () => {
    const api = useApi();
    const dispatch = useDispatch();
    const getConversation = useGetConversation();

    useSubscribeEventManager(async ({ Conversations = [], Messages = [] }: Event) => {
        // Conversation messages event
        const { toCreate, toUpdate, toDelete } = Messages.reduce<{
            toCreate: Message[];
            toUpdate: Message[];
            toDelete: { [ID: string]: boolean };
        }>(
            ({ toCreate, toUpdate, toDelete }, { ID, Action, Message }) => {
                const data = Message && getConversation(Message.ConversationID);

                if (Action === EVENT_ACTIONS.CREATE && data) {
                    toCreate.push(Message as Message);
                } else if ((Action === EVENT_ACTIONS.UPDATE_DRAFT || Action === EVENT_ACTIONS.UPDATE_FLAGS) && data) {
                    toUpdate.push({ ID, ...(Message as Omit<Message, 'ID'>) });
                } else if (Action === EVENT_ACTIONS.DELETE) {
                    toDelete[ID] = true;
                }

                return { toCreate, toUpdate, toDelete };
            },
            { toCreate: [], toUpdate: [], toDelete: {} }
        );

        void dispatch(eventMessageUpdate({ toCreate, toUpdate, toDelete }));

        // Conversation events
        for (const { ID, Action, Conversation } of Conversations) {
            if (!getConversation(ID)) {
                return;
            }
            if (Action === EVENT_ACTIONS.DELETE) {
                void dispatch(eventDelete(ID));
            }
            if (Action === EVENT_ACTIONS.UPDATE_DRAFT || Action === EVENT_ACTIONS.UPDATE_FLAGS) {
                const currentConversation = getConversation(ID);

                // Try to update the conversation from event data without reloading it
                try {
                    const updatedConversation: Conversation = parseLabelIDsInEvent(
                        currentConversation?.Conversation || ({} as Conversation),
                        Conversation as Conversation & LabelIDsChanges
                    );

                    if (updatedConversation.NumMessages !== currentConversation?.Messages?.length) {
                        void dispatch(loadAction({ api, conversationID: ID, messageID: undefined }));
                    } else {
                        void dispatch(eventConversationUpdate({ ID, updatedConversation }));
                    }
                } catch (error: any) {
                    console.warn('Something went wrong on updating a conversation from an event.', error);
                    void dispatch(loadAction({ api, conversationID: ID, messageID: undefined }));
                }
            }
        }
    });
};
