import { differenceInCalendarDays, startOfDay, subDays } from 'date-fns';
import { c } from 'ttag';

import { FREE_USER_CHAT_RETENTION_DAYS } from '../../constants/limits';
import type { ChatHistoryDateField } from '../../redux/slices/lumoUserSettings';
import type { Conversation } from '../../types';

export type ConversationSortField = ChatHistoryDateField;

export interface ConversationDateGroup {
    key: string;
    title: string;
    conversations: Conversation[];
}

const DEFAULT_OLDER_THAN_DAYS = 30;

export const sortConversationsByField = (
    conversations: Conversation[],
    sortBy: ConversationSortField = 'updatedAt'
): Conversation[] =>
    [...conversations].sort((a, b) => new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime());

export const formatConversationDateGroupLabel = (dayStart: Date, now: Date = startOfDay(new Date())): string => {
    const dayDiff = differenceInCalendarDays(now, dayStart);

    if (dayDiff === 0) {
        return c('collider_2025: Date').t`Today`;
    }
    if (dayDiff === 1) {
        return c('collider_2025: Date').t`Yesterday`;
    }

    return dayStart.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: dayStart.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
};

/**
 * Group conversations by calendar day (Claude-style): Today, Yesterday, individual
 * dates, then Older for chats beyond the recent window.
 */
export const groupConversationsByDate = (
    conversations: Conversation[],
    {
        sortBy = 'updatedAt',
        olderThanDays = DEFAULT_OLDER_THAN_DAYS,
    }: { sortBy?: ConversationSortField; olderThanDays?: number } = {}
): ConversationDateGroup[] => {
    const now = startOfDay(new Date());
    const sorted = sortConversationsByField(conversations, sortBy);
    const groups = new Map<string, ConversationDateGroup>();

    for (const conversation of sorted) {
        const dayStart = startOfDay(new Date(conversation[sortBy]));
        const dayDiff = differenceInCalendarDays(now, dayStart);
        const isOlder = dayDiff > olderThanDays;
        const key = isOlder ? 'older' : `day-${dayStart.toISOString()}`;

        const existing = groups.get(key);
        if (existing) {
            existing.conversations.push(conversation);
            continue;
        }

        groups.set(key, {
            key,
            title: isOlder
                ? c('collider_2025:Title').t`Older`
                : formatConversationDateGroupLabel(dayStart, now),
            conversations: [conversation],
        });
    }

    return [...groups.values()].sort((a, b) => {
        if (a.key === 'older') return 1;
        if (b.key === 'older') return -1;
        return b.key.localeCompare(a.key);
    });
};

export const searchConversations = (conversations: Conversation[], searchInput: string) => {
    const normalizedSearchInput = searchInput.trim().toLowerCase(); // todo unidecode accents
    const matchesSearch = (c: Conversation) => !searchInput || c.title.toLowerCase().includes(normalizedSearchInput);
    return conversations.filter(matchesSearch);
};

/**
 * Filter conversations to only those within the free-user retention window.
 * Retention is based on createdAt.
 */
export const filterConversationsWithinRetentionWindow = (
    conversations: Conversation[],
    retentionDays: number = FREE_USER_CHAT_RETENTION_DAYS
): Conversation[] => {
    const cutoff = subDays(startOfDay(new Date()), retentionDays);

    return conversations.filter((conversation) => {
        const createdAt = startOfDay(new Date(conversation.createdAt));
        return createdAt >= cutoff;
    });
};

/**
 * Apply chat retention policy based on subscription status.
 * Free users can only access conversations from the retention window.
 */
export const applyRetentionPolicy = (conversations: Conversation[], hasLumoPlus: boolean): Conversation[] => {
    if (hasLumoPlus) {
        return conversations;
    }

    return filterConversationsWithinRetentionWindow(conversations);
};
