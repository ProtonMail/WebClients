import { useHandler, useCache } from '@proton/components';
import { MessageCountsModel, ConversationCountsModel } from '@proton/shared/lib/models';
import { LabelCount } from '@proton/shared/lib/interfaces/Label';
import { useDispatch } from 'react-redux';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { Element } from '../../models/element';
import { replaceCounter } from '../../helpers/counter';
import { isConversation, isUnread } from '../../helpers/elements';
import { CacheEntry } from '../../models/tools';
import {
    optimisticDelete as optimisticDeleteElementAction,
    optimisticRestoreDelete as optimisticRestoreDeleteElementAction,
} from '../../logic/elements/elementsActions';
import {
    optimisticDelete as optimisticDeleteConversationAction,
    optimisticDeleteConversationMessages,
    optimisticRestore as optimisticRestoreConversationsAction,
} from '../../logic/conversations/conversationsActions';
import { useGetElementByID } from '../mailbox/useElements';
import { ConversationState } from '../../logic/conversations/conversationsTypes';
import { useGetAllConversations } from '../conversation/useConversation';
import { MessageState } from '../../logic/messages/messagesTypes';
import { useGetMessage } from '../message/useMessage';
import {
    optimisticDelete as optimisticDeleteMessageAction,
    optimisticRestore as optimisticRestoreMessageAction,
} from '../../logic/messages/optimistic/messagesOptimisticActions';

const useOptimisticDelete = () => {
    const dispatch = useDispatch();
    const getElementByID = useGetElementByID();
    const globalCache = useCache();
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
            // Conversation counters
            const conversationCounters = globalCache.get(ConversationCountsModel.key) as CacheEntry<LabelCount[]>;
            const currentConversationCounter = conversationCounters.value.find(
                (counter: any) => counter.LabelID === labelID
            ) as LabelCount;
            rollbackCounters[ConversationCountsModel.key] = currentConversationCounter;
            globalCache.set(ConversationCountsModel.key, {
                ...conversationCounters,
                value: replaceCounter(conversationCounters.value, {
                    LabelID: labelID,
                    Total: (currentConversationCounter.Total || 0) - total,
                    Unread: (currentConversationCounter.Unread || 0) - totalUnread,
                }),
            });
        } else {
            // Message counters
            const messageCounters = globalCache.get(MessageCountsModel.key) as CacheEntry<LabelCount[]>;
            const currentMessageCounter = messageCounters.value.find(
                (counter: any) => counter.LabelID === labelID
            ) as LabelCount;
            rollbackCounters[MessageCountsModel.key] = currentMessageCounter;
            globalCache.set(MessageCountsModel.key, {
                ...messageCounters,
                value: replaceCounter(messageCounters.value, {
                    LabelID: labelID,
                    Total: (currentMessageCounter.Total || 0) - total,
                    Unread: (currentMessageCounter.Unread || 0) - totalUnread,
                }),
            });
        }

        return () => {
            dispatch(optimisticRestoreMessageAction(rollbackMessages));
            dispatch(optimisticRestoreConversationsAction(rollbackConversations));
            dispatch(optimisticRestoreDeleteElementAction({ elements: rollbackElements }));
            Object.entries(rollbackCounters).forEach(([key, value]) => {
                const entry = globalCache.get(key) as CacheEntry<LabelCount[]>;
                globalCache.set(key, {
                    ...entry,
                    value: replaceCounter(entry.value, value),
                });
            });
        };
    });
};

export default useOptimisticDelete;
