import { useSubscribeEventManager } from '@proton/components';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { useMailDispatch } from 'proton-mail/store/hooks';

import { parseLabelIDsInEvent } from '../../helpers/elements';
import type { Conversation } from '../../models/conversation';
import type { Event, LabelIDsChanges } from '../../models/event';
import {
    eventConversationUpdate,
    eventDelete,
    eventMessageUpdate,
    load as loadAction,
} from '../../store/conversations/conversationsActions';
import { useGetConversation } from '../conversation/useConversation';

export const useConversationsEvent = () => {
    const dispatch = useMailDispatch();
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

        const isStateEqual = toCreate.length === 0 && toUpdate.length === 0 && Object.keys(toDelete).length === 0;
        if (!isStateEqual) {
            void dispatch(eventMessageUpdate({ toCreate, toUpdate, toDelete }));
        }

        // Conversation events
        for (const { ID, Action, Conversation } of Conversations) {
            const currentConversation = getConversation(ID);

            if (!currentConversation) {
                return;
            }
            if (Action === EVENT_ACTIONS.DELETE) {
                void dispatch(eventDelete(ID));
            }
            if (
                Action === EVENT_ACTIONS.UPDATE_DRAFT ||
                Action === EVENT_ACTIONS.UPDATE_FLAGS ||
                Action === EVENT_ACTIONS.CREATE
            ) {
                // Try to update the conversation from event data without reloading it
                try {
                    const updatedConversation: Conversation = parseLabelIDsInEvent(
                        currentConversation?.Conversation || ({} as Conversation),
                        Conversation as Conversation & LabelIDsChanges
                    );

                    dispatch(eventConversationUpdate({ ID, updatedConversation }));
                } catch (error: any) {
                    console.warn('Something went wrong on updating a conversation from an event.', error);
                    void dispatch(loadAction({ conversationID: ID, messageID: undefined }));
                }
            }
        }
    });
};
