import { useHandler, useCache } from 'react-components';
import { MessageCountsModel, ConversationCountsModel } from 'proton-shared/lib/models';

import { useMessageCache } from '../../containers/MessageProvider';
import { useElementsCache } from '../useElementsCache';
import { MessageExtended } from '../../models/message';
import { useConversationCache } from '../../containers/ConversationProvider';
import { hasLabel } from '../../helpers/elements';
import { ConversationResult } from '../useConversation';
import { PAGE_SIZE } from '../../constants';

interface Counter {
    LabelID: string;
    Total: number;
    Unread: number;
}

interface CacheEntry<T> {
    status: number;
    value: T;
}

const replaceCounter = (counters: Counter[], counter: Counter) =>
    counters.map((existingCounter: any) => {
        if (existingCounter.LabelID === counter.LabelID) {
            return counter;
        } else {
            return existingCounter;
        }
    });

export const useOptimisticEmptyLabel = () => {
    const globalCache = useCache();
    const [elementsCache, setElementsCache] = useElementsCache();
    const messageCache = useMessageCache();
    const conversationCache = useConversationCache();

    return useHandler((labelID: string) => {
        const rollbackMessages = [] as MessageExtended[];
        const rollbackConversations = [] as ConversationResult[];
        const rollbackCounters = {} as { [key: string]: Counter };

        // Message cache
        const messageIDs = [...messageCache.keys()];
        messageIDs.forEach((messageID) => {
            const message = messageCache.get(messageID) as MessageExtended;
            if (hasLabel(message.data || {}, labelID)) {
                messageCache.delete(messageID);
                rollbackMessages.push(message);
            }
        });

        // Conversation cache
        const conversationIDs = [...conversationCache.keys()];
        conversationIDs.forEach((conversationID) => {
            const conversation = conversationCache.get(conversationID) as ConversationResult;
            if (hasLabel(conversation.Conversation, labelID)) {
                conversationCache.delete(conversationID);
                rollbackConversations.push(conversation);
            } else {
                const messages = conversation.Messages?.filter((Message) => !hasLabel(Message, labelID));
                if (messages?.length !== conversation.Messages?.length) {
                    conversationCache.set(conversationID, {
                        Conversation: conversation.Conversation,
                        Messages: messages
                    });
                    rollbackConversations.push(conversation);
                }
            }
        });

        // Elements cache
        const rollbackElements = elementsCache;
        setElementsCache({
            ...elementsCache,
            elements: {},
            page: {
                limit: PAGE_SIZE,
                page: 0,
                size: PAGE_SIZE,
                total: 0
            }
        });

        // Message counters
        const messageCounters = globalCache.get(MessageCountsModel.key) as CacheEntry<Counter[]>;
        rollbackCounters[MessageCountsModel.key] = messageCounters.value.find(
            (counter: any) => counter.LabelID === labelID
        ) as Counter;
        globalCache.set(MessageCountsModel.key, {
            ...messageCounters,
            value: replaceCounter(messageCounters.value, { LabelID: labelID, Total: 0, Unread: 0 })
        });

        // Conversation counters
        const conversationCounters = globalCache.get(ConversationCountsModel.key) as CacheEntry<Counter[]>;
        rollbackCounters[ConversationCountsModel.key] = conversationCounters.value.find(
            (counter: any) => counter.LabelID === labelID
        ) as Counter;
        globalCache.set(ConversationCountsModel.key, {
            ...conversationCounters,
            value: replaceCounter(conversationCounters.value, { LabelID: labelID, Total: 0, Unread: 0 })
        });

        return () => {
            rollbackMessages.forEach((message) => {
                messageCache.set(message.localID, message);
            });
            rollbackConversations.forEach((conversation) => {
                conversationCache.set(conversation.Conversation.ID || '', conversation);
            });
            setElementsCache(rollbackElements);
            Object.entries(rollbackCounters).forEach(([key, value]) => {
                const entry = globalCache.get(key) as CacheEntry<Counter[]>;
                globalCache.set(key, {
                    ...entry,
                    value: replaceCounter(entry.value, value)
                });
            });
        };
    });
};
