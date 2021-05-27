import { useHandler, useCache } from 'react-components';
import { MessageCountsModel, ConversationCountsModel } from 'proton-shared/lib/models';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';
import { Element } from '../../models/element';
import { useMessageCache } from '../../containers/MessageProvider';
import { useGetElementsCache, useSetElementsCache } from '../mailbox/useElementsCache';
import { useConversationCache, useUpdateConversationCache } from '../../containers/ConversationProvider';
import { MessageExtended } from '../../models/message';
import { replaceCounter } from '../../helpers/counter';
import { isConversation, isUnread } from '../../helpers/elements';
import { CacheEntry } from '../../models/tools';
import { ConversationCacheEntry } from '../../models/conversation';

const useOptimisticDelete = () => {
    const globalCache = useCache();
    const getElementsCache = useGetElementsCache();
    const setElementsCache = useSetElementsCache();
    const messageCache = useMessageCache();
    const conversationCache = useConversationCache();
    const updateConversationCache = useUpdateConversationCache();

    return useHandler((elements: Element[], labelID: string) => {
        const elementIDs = elements.map(({ ID }) => ID);
        const conversationMode = isConversation(elements[0]);
        const total = elementIDs.length;
        const totalUnread = elements.filter((element) => isUnread(element, labelID)).length;
        const rollbackMessages = [] as MessageExtended[];
        const rollbackConversations = [] as ConversationCacheEntry[];
        const rollbackCounters = {} as { [key: string]: LabelCount };

        // Message cache
        const messageIDs = [...messageCache.keys()];
        messageIDs.forEach((messageID) => {
            const message = messageCache.get(messageID) as MessageExtended;
            if (elementIDs.includes(messageID)) {
                messageCache.delete(messageID);
                rollbackMessages.push(message);
            }
        });

        // Conversation cache
        const conversationIDs = [...conversationCache.keys()];
        conversationIDs.forEach((conversationID) => {
            const conversation = conversationCache.get(conversationID) as ConversationCacheEntry;
            if (elementIDs.includes(conversationID)) {
                conversationCache.delete(conversationID);
                rollbackConversations.push(conversation);
            } else {
                const messages = conversation.Messages?.filter((Message) => !elementIDs.includes(Message.ID));
                if (messages?.length !== conversation.Messages?.length) {
                    updateConversationCache(conversationID, () => ({ Messages: messages }));
                    rollbackConversations.push(conversation);
                }
            }
        });

        // Elements cache
        const rollbackElements = getElementsCache();
        setElementsCache({
            ...rollbackElements,
            elements: Object.entries(rollbackElements.elements).reduce<{ [ID: string]: Element }>(
                (acc, [elementID, element]) => {
                    if (!elementIDs.includes(elementID)) {
                        acc[elementID] = element;
                    }
                    return acc;
                },
                {}
            ),
        });

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
            rollbackMessages.forEach((message) => {
                messageCache.set(message.localID, message);
            });
            rollbackConversations.forEach((conversation) => {
                conversationCache.set(conversation?.Conversation?.ID || '', conversation);
            });
            setElementsCache(rollbackElements);
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
