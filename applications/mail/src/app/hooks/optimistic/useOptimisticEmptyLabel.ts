import { useHandler, useCache } from '@proton/components';
import { MessageCountsModel, ConversationCountsModel } from '@proton/shared/lib/models';
import { LabelCount } from '@proton/shared/lib/interfaces/Label';
import { useStore, useDispatch } from 'react-redux';
import { useMessageCache } from '../../containers/MessageProvider';
import { MessageExtended } from '../../models/message';
import { useConversationCache, useUpdateConversationCache } from '../../containers/ConversationProvider';
import { hasLabel } from '../../helpers/elements';
import { replaceCounter } from '../../helpers/counter';
import { CacheEntry } from '../../models/tools';
import { ConversationCacheEntry } from '../../models/conversation';
import { optimisticEmptyLabel, optimisticRestoreEmptyLabel } from '../../logic/elements/elementsActions';
import { RootState } from '../../logic/store';

export const useOptimisticEmptyLabel = () => {
    const store = useStore<RootState>();
    const dispatch = useDispatch();
    const globalCache = useCache();
    const messageCache = useMessageCache();
    const conversationCache = useConversationCache();
    const updateConversationCache = useUpdateConversationCache();

    return useHandler((labelID: string) => {
        const rollbackMessages = [] as MessageExtended[];
        const rollbackConversations = [] as ConversationCacheEntry[];
        const rollbackCounters = {} as { [key: string]: LabelCount };

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
            const conversation = conversationCache.get(conversationID) as ConversationCacheEntry;
            if (hasLabel(conversation.Conversation, labelID)) {
                conversationCache.delete(conversationID);
                rollbackConversations.push(conversation);
            } else {
                const messages = conversation.Messages?.filter((Message) => !hasLabel(Message, labelID));
                if (messages?.length !== conversation.Messages?.length) {
                    updateConversationCache(conversationID, () => ({ Messages: messages }));
                    rollbackConversations.push(conversation);
                }
            }
        });

        // Elements cache
        const rollbackElements = Object.values(store.getState().elements.elements);
        dispatch(optimisticEmptyLabel());

        // Message counters
        const messageCounters = globalCache.get(MessageCountsModel.key) as CacheEntry<LabelCount[]>;
        rollbackCounters[MessageCountsModel.key] = messageCounters.value.find(
            (counter: any) => counter.LabelID === labelID
        ) as LabelCount;
        globalCache.set(MessageCountsModel.key, {
            ...messageCounters,
            value: replaceCounter(messageCounters.value, { LabelID: labelID, Total: 0, Unread: 0 }),
        });

        // Conversation counters
        const conversationCounters = globalCache.get(ConversationCountsModel.key) as CacheEntry<LabelCount[]>;
        rollbackCounters[ConversationCountsModel.key] = conversationCounters.value.find(
            (counter: any) => counter.LabelID === labelID
        ) as LabelCount;
        globalCache.set(ConversationCountsModel.key, {
            ...conversationCounters,
            value: replaceCounter(conversationCounters.value, { LabelID: labelID, Total: 0, Unread: 0 }),
        });

        return () => {
            rollbackMessages.forEach((message) => {
                messageCache.set(message.localID, message);
            });
            rollbackConversations.forEach((conversation) => {
                conversationCache.set(conversation.Conversation?.ID || '', conversation);
            });
            dispatch(optimisticRestoreEmptyLabel({ elements: rollbackElements }));
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
