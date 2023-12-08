import { useHandler } from '@proton/components';
import {
    conversationCountsActions,
    messageCountsActions,
    selectConversationCounts,
    selectMessageCounts,
} from '@proton/mail';
import { LabelCount } from '@proton/shared/lib/interfaces/Label';
import isTruthy from '@proton/utils/isTruthy';

import { useMailStore } from 'proton-mail/store/hooks';

import { replaceCounter } from '../../helpers/counter';
import { isConversation, isUnread } from '../../helpers/elements';
import {
    optimisticDelete as optimisticDeleteConversationAction,
    optimisticDeleteConversationMessages,
    optimisticRestore as optimisticRestoreConversationsAction,
} from '../../logic/conversations/conversationsActions';
import { ConversationState } from '../../logic/conversations/conversationsTypes';
import {
    optimisticDelete as optimisticDeleteElementAction,
    optimisticRestoreDelete as optimisticRestoreDeleteElementAction,
} from '../../logic/elements/elementsActions';
import { MessageState } from '../../logic/messages/messagesTypes';
import {
    optimisticDelete as optimisticDeleteMessageAction,
    optimisticRestore as optimisticRestoreMessageAction,
} from '../../logic/messages/optimistic/messagesOptimisticActions';
import { useAppDispatch } from '../../logic/store';
import { Element } from '../../models/element';
import { useGetAllConversations } from '../conversation/useConversation';
import { useGetElementByID } from '../mailbox/useElements';
import { useGetMessage } from '../message/useMessage';

const useOptimisticDelete = () => {
    const store = useMailStore();
    const dispatch = useAppDispatch();
    const getElementByID = useGetElementByID();
    const getAllConversations = useGetAllConversations();
    const getMessage = useGetMessage();

    return useHandler((elements: Element[], labelID: string) => {
        const elementIDs = elements.map(({ ID }) => ID || '');
        const conversationMode = isConversation(elements[0]);
        const total = elementIDs.length;
        const totalUnread = elements.filter((element) => isUnread(element, labelID)).length;
        const rollbackMessages = [] as MessageState[];
        const rollbackConversations = [] as ConversationState[];
        const rollbackCounters = {} as { [key: string]: LabelCount };

        // Message cache
        elementIDs.forEach((elementID) => {
            const message = getMessage(elementID);
            if (message) {
                rollbackMessages.push(message);
            }
        });
        dispatch(optimisticDeleteMessageAction(elementIDs));

        // Conversation cache
        const allConversations = getAllConversations();
        allConversations.forEach((conversation) => {
            if (conversation?.Conversation.ID && elementIDs.includes(conversation?.Conversation.ID)) {
                dispatch(optimisticDeleteConversationAction(conversation?.Conversation.ID));
                rollbackConversations.push(conversation);
            } else if (conversation?.Messages) {
                const messages = conversation.Messages?.filter((message) => !elementIDs.includes(message.ID));
                if (conversation && messages?.length !== conversation?.Messages?.length) {
                    dispatch(optimisticDeleteConversationMessages({ ID: conversation.Conversation.ID, messages }));
                    rollbackConversations.push(conversation);
                }
            }
        });

        // Elements cache
        const rollbackElements = elementIDs.map((elementID) => getElementByID(elementID)).filter(isTruthy);
        dispatch(optimisticDeleteElementAction({ elementIDs }));

        if (conversationMode) {
            let { value: conversationCounters = [] } = selectConversationCounts(store.getState());

            // Conversation counters
            const currentConversationCounter = conversationCounters.find(
                (counter: any) => counter.LabelID === labelID
            ) as LabelCount;
            rollbackCounters.conversations = currentConversationCounter;
            store.dispatch(
                conversationCountsActions.set(
                    replaceCounter(conversationCounters, {
                        LabelID: labelID,
                        Total: (currentConversationCounter.Total || 0) - total,
                        Unread: (currentConversationCounter.Unread || 0) - totalUnread,
                    })
                )
            );
        } else {
            let { value: messageCounters = [] } = selectMessageCounts(store.getState());
            // Message counters
            const currentMessageCounter = messageCounters.find(
                (counter: any) => counter.LabelID === labelID
            ) as LabelCount;
            rollbackCounters.messages = currentMessageCounter;
            store.dispatch(
                messageCountsActions.set(
                    replaceCounter(messageCounters, {
                        LabelID: labelID,
                        Total: (currentMessageCounter.Total || 0) - total,
                        Unread: (currentMessageCounter.Unread || 0) - totalUnread,
                    })
                )
            );
        }

        return () => {
            dispatch(optimisticRestoreMessageAction(rollbackMessages));
            dispatch(optimisticRestoreConversationsAction(rollbackConversations));
            dispatch(optimisticRestoreDeleteElementAction({ elements: rollbackElements }));
            if (rollbackCounters.conversations) {
                let { value: conversationCounters = [] } = selectConversationCounts(store.getState());
                store.dispatch(
                    conversationCountsActions.set(replaceCounter(conversationCounters, rollbackCounters.conversations))
                );
            }
            if (rollbackCounters.messages) {
                let { value: messageCounters = [] } = selectMessageCounts(store.getState());
                store.dispatch(messageCountsActions.set(replaceCounter(messageCounters, rollbackCounters.messages)));
            }
        };
    });
};

export default useOptimisticDelete;
