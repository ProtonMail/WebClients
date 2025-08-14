import { isToday, isWithinInterval, subDays, subMonths } from 'date-fns';

import type { ConversationMap } from '../../redux/slices/core/conversations';
import type { Conversation } from '../../types';

export const mostRecentConversations = (conversations: ConversationMap) => {
    return Object.values(conversations)
        .map((conv) => [new Date(conv.createdAt).getTime(), conv] as [number, Conversation])
        .sort((a, b) => b[0] - a[0]) // desc
        .map(([, item]) => item);
};

export type DateBucketedConversations = {
    today: Conversation[];
    lastWeek: Conversation[];
    lastMonth: Conversation[];
    earlier: Conversation[];
};

export const categorizeConversations = (conversations: Conversation[]): DateBucketedConversations => {
    const now = new Date();

    const result: DateBucketedConversations = {
        today: [],
        lastWeek: [],
        lastMonth: [],
        earlier: [],
    };

    for (const c of conversations) {
        const createdAt = new Date(c.createdAt);

        if (isToday(createdAt)) {
            result.today.push(c);
        } else if (isWithinInterval(createdAt, { start: subDays(now, 7), end: now })) {
            result.lastWeek.push(c);
        } else if (isWithinInterval(createdAt, { start: subMonths(now, 1), end: now })) {
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
