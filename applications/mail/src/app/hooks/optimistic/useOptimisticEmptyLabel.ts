import { useDispatch, useStore } from 'react-redux';

import { useCache, useHandler } from '@proton/components';
import { LabelCount } from '@proton/shared/lib/interfaces/Label';
import { ConversationCountsModel, MessageCountsModel } from '@proton/shared/lib/models';

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
import { RootState } from '../../logic/store';
import { CacheEntry } from '../../models/tools';
import { useGetAllConversations } from '../conversation/useConversation';

export const useOptimisticEmptyLabel = () => {
    const store = useStore<RootState>();
    const dispatch = useDispatch();
    const globalCache = useCache();
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
            dispatch(optimisticRestoreMessage(rollbackMessages));
            dispatch(optimisticRestoreConversationsAction(rollbackConversations));
            dispatch(optimisticRestoreEmptyLabelElements({ elements: rollbackElements }));
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
