import { applyRetentionPolicy } from '../../layouts/sidepanel/helpers';
import { selectAttachments, selectMessagesGroupedByConversationId } from '../../redux/selectors';
import type { LumoState } from '../../redux/store';
import type { Conversation } from '../../types';
import { getConversationPreview } from './allChatsHelpers';
import type { AllChatsRowDataMap } from './selectAllChatsRowData';

export type AllChatsFilterValue = 'all' | 'favorites' | 'projects';

/** Date sorts use the last-updated date, the date each row shows. */
export type AllChatsSortValue = 'newest' | 'oldest' | 'name';

export type AllChatsEmptyVariant = 'no-chats' | 'no-favorites' | 'no-projects' | 'no-results';

interface FilterAllChatsConversationsInput {
    conversations: Conversation[];
    filter: AllChatsFilterValue;
    searchQuery: string;
    rowDataMap: AllChatsRowDataMap;
    sort: AllChatsSortValue;
    hasLumoPlus: boolean;
    // Read imperatively (only when a search query is present) instead of subscribing to a live
    // selector, so streaming messages in any conversation don't force this list to recompute.
    getState: () => LumoState;
}

type BaseInput = Omit<FilterAllChatsConversationsInput, 'searchQuery' | 'getState'>;

/** Everything except the search: non-ghost, retention, filter chip and sort. Independent of the query. */
export const getSortedAllChatsConversations = ({
    conversations,
    filter,
    rowDataMap,
    sort,
    hasLumoPlus,
}: BaseInput): Conversation[] => {
    const nonGhostConversations = conversations.filter((conversation) => {
        return !conversation.ghost && !conversation.scheduleRun;
    });

    let items = applyRetentionPolicy(nonGhostConversations, hasLumoPlus);

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

    return sortAllChatsConversations(items, sort);
};

/** Narrows an already sorted list by title and preview. Filtering keeps the order, so no re-sort. */
export const searchAllChatsConversations = (
    conversations: Conversation[],
    searchQuery: string,
    getState: () => LumoState
): Conversation[] => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
        return conversations;
    }

    const state = getState();
    const messagesByConversationId = selectMessagesGroupedByConversationId(state);
    const attachments = selectAttachments(state);

    return conversations.filter((conversation) => {
        const title = (conversation.title || '').toLowerCase();
        const preview = getConversationPreview(
            messagesByConversationId[conversation.id] ?? [],
            attachments
        ).toLowerCase();
        return title.includes(normalizedQuery) || preview.includes(normalizedQuery);
    });
};

export const filterAllChatsConversations = ({
    searchQuery,
    getState,
    ...base
}: FilterAllChatsConversationsInput): Conversation[] => {
    return searchAllChatsConversations(getSortedAllChatsConversations(base), searchQuery, getState);
};

const nameCollator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

const getUpdatedTime = (conversation: Conversation): number => {
    return new Date(conversation.updatedAt).getTime();
};

const sortAllChatsConversations = (conversations: Conversation[], sort: AllChatsSortValue): Conversation[] => {
    return [...conversations].sort((left, right) => {
        if (sort === 'oldest') {
            return getUpdatedTime(left) - getUpdatedTime(right);
        }

        if (sort === 'name') {
            const leftTitle = left.title.trim();
            const rightTitle = right.title.trim();

            // Untitled chats go last instead of first.
            if (!leftTitle || !rightTitle) {
                return Number(!leftTitle) - Number(!rightTitle) || getUpdatedTime(right) - getUpdatedTime(left);
            }

            return nameCollator.compare(leftTitle, rightTitle) || getUpdatedTime(right) - getUpdatedTime(left);
        }

        return getUpdatedTime(right) - getUpdatedTime(left);
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
