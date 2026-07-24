import { applyRetentionPolicy } from '../../layouts/sidepanel/helpers';
import { selectAttachments, selectMessagesGroupedByConversationId } from '../../redux/selectors';
import type { ChatHistoryDateField } from '../../redux/slices/lumoUserSettings';
import type { LumoState } from '../../redux/store';
import type { Conversation } from '../../types';
import { getConversationPreview } from './allChatsHelpers';
import type { AllChatsRowDataMap } from './selectAllChatsRowData';

export type AllChatsFilterValue = 'all' | 'favorites' | 'projects';

export type AllChatsEmptyVariant = 'no-chats' | 'no-favorites' | 'no-projects' | 'no-results';

interface FilterAllChatsConversationsInput {
    conversations: Conversation[];
    filter: AllChatsFilterValue;
    searchQuery: string;
    rowDataMap: AllChatsRowDataMap;
    sortField: ChatHistoryDateField;
    hasLumoPlus: boolean;
    // Read imperatively (only when a search query is present) instead of subscribing to a live
    // selector, so streaming messages in any conversation don't force this list to recompute.
    getState: () => LumoState;
}

export const filterAllChatsConversations = ({
    conversations,
    filter,
    searchQuery,
    rowDataMap,
    sortField,
    hasLumoPlus,
    getState,
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

    if (filter === 'projects') {
        items = items.filter((conversation) => {
            return rowDataMap[conversation.id]?.isProject === true;
        });
    }

    if (normalizedQuery) {
        const state = getState();
        const messagesByConversationId = selectMessagesGroupedByConversationId(state);
        const attachments = selectAttachments(state);

        items = items.filter((conversation) => {
            const title = (conversation.title || '').toLowerCase();
            const preview = getConversationPreview(
                messagesByConversationId[conversation.id] ?? [],
                attachments
            ).toLowerCase();
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

    if (filter === 'projects') {
        return 'no-projects';
    }

    return 'no-chats';
};
