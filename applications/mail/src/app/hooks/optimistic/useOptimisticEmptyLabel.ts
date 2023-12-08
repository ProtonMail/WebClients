import { useStore } from 'react-redux';

import { useHandler } from '@proton/components';
import {
    conversationCountsActions,
    messageCountsActions,
    selectConversationCounts,
    selectMessageCounts,
} from '@proton/mail';
import { LabelCount } from '@proton/shared/lib/interfaces/Label';

import { useMailStore } from 'proton-mail/store/hooks';

import { replaceCounter } from '../../helpers/counter';
import { hasLabel } from '../../helpers/elements';
import {
    optimisticDelete as optimisticDeleteConversationAction,
    optimisticDeleteConversationMessages as optimisticDeleteConversationMessagesAction,
    optimisticRestore as optimisticRestoreConversationsAction,
} from '../../logic/conversations/conversationsActions';
import { ConversationState } from '../../logic/conversations/conversationsTypes';
import {
    optimisticEmptyLabel as optimisticEmptyLabelElements,
    optimisticRestoreEmptyLabel as optimisticRestoreEmptyLabelElements,
} from '../../logic/elements/elementsActions';
import { MessageState } from '../../logic/messages/messagesTypes';
import {
    optimisticEmptyLabel as optimisticEmptyLabelMessage,
    optimisticRestore as optimisticRestoreMessage,
} from '../../logic/messages/optimistic/messagesOptimisticActions';
import { RootState, useAppDispatch } from '../../logic/store';
import { useGetAllConversations } from '../conversation/useConversation';

export const useOptimisticEmptyLabel = () => {
    const mailStore = useMailStore();
    const store = useStore<RootState>();
    const dispatch = useAppDispatch();
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
        const rollbackElements = Object.values(store.getState().elements.elements);
        dispatch(optimisticEmptyLabelElements());

        // Message counters
        let { value: messageCounters = [] } = selectMessageCounts(mailStore.getState());
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
        let { value: conversationCounters = [] } = selectConversationCounts(mailStore.getState());
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
                let { value: conversationCounters = [] } = selectConversationCounts(mailStore.getState());
                store.dispatch(
                    conversationCountsActions.set(replaceCounter(conversationCounters, rollbackCounters.conversations))
                );
            }
            if (rollbackCounters.messages) {
                let { value: messageCounters = [] } = selectMessageCounts(mailStore.getState());
                store.dispatch(messageCountsActions.set(replaceCounter(messageCounters, rollbackCounters.messages)));
            }
        };
    });
};
