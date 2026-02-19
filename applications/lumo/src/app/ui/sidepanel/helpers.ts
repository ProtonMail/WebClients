 import { isToday, isWithinInterval, startOfDay, subDays, subMonths } from 'date-fns';

import type { Conversation } from '../../types';

export type DateBucketedConversations = {
    today: Conversation[];
    lastWeek: Conversation[];
    expiringSoon: Conversation[]; // 5-7 days old (will be deleted in 0-2 days for free users)
    lastMonth: Conversation[];
    earlier: Conversation[];
};

export const categorizeConversations = (conversations: Conversation[], hasLumoPlus: boolean = false): DateBucketedConversations => {
    const now = startOfDay(new Date());

    const result: DateBucketedConversations = {
        today: [],
        lastWeek: [],
        expiringSoon: [],
        lastMonth: [],
        earlier: [],
    };

    for (const c of conversations) {
        const createdAt = startOfDay(new Date(c.createdAt));

        if (isToday(createdAt)) {
            result.today.push(c);
        } else if (isWithinInterval(createdAt, { start: subDays(now, 7), end: subDays(now, 1) })) {
            // Days 1-7 ago
            if (hasLumoPlus) {
                result.lastWeek.push(c);
            } else {
                // Free users: split into "Last 7 days" (1-4 days) and "Expiring Soon" (5-7 days)
                if (isWithinInterval(createdAt, { start: subDays(now, 5), end: subDays(now, 1) })) {
                    result.lastWeek.push(c);
                } else {
                    result.expiringSoon.push(c);
                }
            }
        } else if (isWithinInterval(createdAt, { start: subMonths(now, 1), end: subDays(now, 7) })) {
            // 8-30 days ago
            result.lastMonth.push(c);
        } else {
            result.earlier.push(c);
        }
    }

    return result;
};

export const searchConversations = (conversations: Conversation[], searchInput: string) => {
    const normalizedSearchInput = searchInput.trim().toLowerCase(); // todo unidecode accents
    const matchesSearch = (c: Conversation) => !searchInput || c.title.toLowerCase().includes(normalizedSearchInput);
    return conversations.filter(matchesSearch);
};

/**
 * Filter conversations to only those within the last 7 days.
 * Used to enforce the 7-day retention policy for free users.
 */
export const filterConversationsWithin7Days = (conversations: Conversation[]): Conversation[] => {
    const now = startOfDay(new Date());
    const sevenDaysAgo = subDays(now, 7);

    return conversations.filter((conversation) => {
        const createdAt = startOfDay(new Date(conversation.createdAt));
        return createdAt >= sevenDaysAgo;
    });
};

/**
 * Apply retention policy based on subscription status.
 * Free users can only access conversations from the last 7 days.
 * Lumo Plus users have access to all conversations.
 */
export const applyRetentionPolicy = (
    conversations: Conversation[],
    hasLumoPlus: boolean
): Conversation[] => {
    if (hasLumoPlus) {
        return conversations;
    }
    return filterConversationsWithin7Days(conversations);
};
