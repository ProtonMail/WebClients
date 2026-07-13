import { applyRetentionPolicy } from '../../layouts/sidepanel/helpers';
import type { ChatHistoryDateField } from '../../redux/slices/lumoUserSettings';
import type { Conversation } from '../../types';
import type { AllChatsRowDataMap } from './selectAllChatsRowData';

export type AllChatsFilterValue = 'all' | 'favorites';

export type AllChatsEmptyVariant = 'no-chats' | 'no-favorites' | 'no-results';

interface FilterAllChatsConversationsInput {
    conversations: Conversation[];
    filter: AllChatsFilterValue;
    searchQuery: string;
    rowDataMap: AllChatsRowDataMap;
    sortField: ChatHistoryDateField;
    hasLumoPlus: boolean;
}

export const filterAllChatsConversations = ({
    conversations,
    filter,
    searchQuery,
    rowDataMap,
    sortField,
    hasLumoPlus,
}: FilterAllChatsConversationsInput): Conversation[] => {
    const nonGhostConversations = conversations.filter((conversation) => {
        return !conversation.ghost;
    });

    const accessibleConversations = applyRetentionPolicy(nonGhostConversations, hasLumoPlus);

    const normalizedQuery = searchQuery.trim().toLowerCase();

    let items = accessibleConversations;

    if (filter === 'favorites') {
        items = items.filter((conversation) => {
            return conversation.starred === true;
        });
    }

    if (normalizedQuery) {
        items = items.filter((conversation) => {
            const title = (conversation.title || '').toLowerCase();
            const preview = (rowDataMap[conversation.id]?.preview || '').toLowerCase();
            return title.includes(normalizedQuery) || preview.includes(normalizedQuery);
        });
    }

    return [...items].sort((left, right) => {
        return new Date(right[sortField]).getTime() - new Date(left[sortField]).getTime();
    });
};

export const getAllChatsEmptyVariant = (searchQuery: string, filter: AllChatsFilterValue): AllChatsEmptyVariant => {
    if (searchQuery.trim()) {
        return 'no-results';
    }

    if (filter === 'favorites') {
        return 'no-favorites';
    }

    return 'no-chats';
};
