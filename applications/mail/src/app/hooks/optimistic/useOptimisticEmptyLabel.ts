import { useHandler } from '@proton/components';
import { conversationCountsActions, selectConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
import { messageCountsActions, selectMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import type { LabelCount } from '@proton/shared/lib/interfaces/Label';

import { useMailDispatch, useMailStore } from 'proton-mail/store/hooks';

import { replaceCounter } from '../../helpers/counter';
import { hasLabel } from '../../helpers/elements';
import {
    optimisticDelete as optimisticDeleteConversationAction,
    optimisticDeleteConversationMessages as optimisticDeleteConversationMessagesAction,
    optimisticRestore as optimisticRestoreConversationsAction,
} from '../../store/conversations/conversationsActions';
import type { ConversationState } from '../../store/conversations/conversationsTypes';
import {
    optimisticEmptyLabel as optimisticEmptyLabelElements,
    optimisticRestoreEmptyLabel as optimisticRestoreEmptyLabelElements,
} from '../../store/elements/elementsActions';
import {
    optimisticEmptyLabel as optimisticEmptyLabelMessage,
    optimisticRestore as optimisticRestoreMessage,
} from '../../store/messages/optimistic/messagesOptimisticActions';
import { useGetAllConversations } from '../conversation/useConversation';

export const useOptimisticEmptyLabel = () => {
    const mailStore = useMailStore();
    const dispatch = useMailDispatch();
    const getAllConversations = useGetAllConversations();

    return useHandler((labelID: string) => {
        const rollbackMessages = [] as MessageState[];
        const rollbackConversations = [] as ConversationState[];
        const rollbackCounters = {} as { [key: string]: LabelCount };

        // Message cache
        dispatch(optimisticEmptyLabelMessage(labelID));

        // Conversation cache
        const allConversations = getAllConversations();
        allConversations.forEach((conversation) => {
            if (conversation?.Conversation.ID && hasLabel(conversation.Conversation, labelID)) {
                dispatch(optimisticDeleteConversationAction(conversation?.Conversation.ID));
                rollbackConversations.push(conversation);
            } else if (conversation?.Messages) {
                const messages = conversation.Messages?.filter((message) => !hasLabel(message, labelID));
                if (conversation && messages?.length !== conversation?.Messages?.length) {
                    dispatch(
                        optimisticDeleteConversationMessagesAction({ ID: conversation.Conversation.ID, messages })
                    );
                    rollbackConversations.push(conversation);
                }
            }
        });

        // Elements cache
        const rollbackElements = Object.values(mailStore.getState().elements.elements);
        dispatch(optimisticEmptyLabelElements());

        // Message counters
        const { value: messageCounters = [] } = selectMessageCounts(mailStore.getState());
        rollbackCounters.messages = messageCounters.find((counter: any) => counter.LabelID === labelID) as LabelCount;
        mailStore.dispatch(
            messageCountsActions.set(
                replaceCounter(messageCounters, {
                    LabelID: labelID,
                    Total: 0,
                    Unread: 0,
                })
            )
        );

        // Conversation counters
        const { value: conversationCounters = [] } = selectConversationCounts(mailStore.getState());
        rollbackCounters.conversations = conversationCounters.find(
            (counter: any) => counter.LabelID === labelID
        ) as LabelCount;
        mailStore.dispatch(
            conversationCountsActions.set(
                replaceCounter(conversationCounters, {
                    LabelID: labelID,
                    Total: 0,
                    Unread: 0,
                })
            )
        );

        return () => {
            dispatch(optimisticRestoreMessage(rollbackMessages));
            dispatch(optimisticRestoreConversationsAction(rollbackConversations));
            dispatch(optimisticRestoreEmptyLabelElements({ elements: rollbackElements }));
            if (rollbackCounters.conversations) {
                const { value: conversationCounters = [] } = selectConversationCounts(mailStore.getState());
                mailStore.dispatch(
                    conversationCountsActions.set(replaceCounter(conversationCounters, rollbackCounters.conversations))
                );
            }
            if (rollbackCounters.messages) {
                const { value: messageCounters = [] } = selectMessageCounts(mailStore.getState());
                mailStore.dispatch(
                    messageCountsActions.set(replaceCounter(messageCounters, rollbackCounters.messages))
                );
            }
        };
    });
};
