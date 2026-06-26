import { addDays, differenceInCalendarDays, startOfDay, subDays } from 'date-fns';
import { c } from 'ttag';

import { FREE_USER_CHAT_RETENTION_DAYS } from '../../constants/limits';
import type { ChatHistoryDateField } from '../../redux/slices/lumoUserSettings';
import type { Conversation } from '../../types';
import {LUMO_SHORT_APP_NAME} from "@proton/shared/lib/constants";

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

export type ConversationExpirationUrgency = 'warning' | 'urgent';

/**
 * Calendar days until a free-user conversation falls outside the retention window.
 * Returns 0 on the last day the chat is still accessible.
 */
export const getConversationRetentionDaysRemaining = (
    conversation: Conversation,
    retentionDays: number = FREE_USER_CHAT_RETENTION_DAYS,
    now: Date = new Date()
): number => {
    const createdAt = startOfDay(new Date(conversation.createdAt));
    const expirationDay = addDays(createdAt, retentionDays);

    return differenceInCalendarDays(expirationDay, startOfDay(now));
};

/**
 * Returns an urgency level when a conversation is within 2 days of expiring for free users.
 */
export const getConversationExpirationUrgency = (
    conversation: Conversation,
    retentionDays: number = FREE_USER_CHAT_RETENTION_DAYS,
    now: Date = new Date()
): ConversationExpirationUrgency | null => {
    const daysRemaining = getConversationRetentionDaysRemaining(conversation, retentionDays, now);

    if (daysRemaining > 2) {
        return null;
    }

    if (daysRemaining <= 1) {
        return 'urgent';
    }

    return 'warning';
};

export const getConversationExpirationTooltip = (daysRemaining: number): string => {
    if (daysRemaining === 0) {
        return c('collider_2025: Info')
            .t`This chat will be removed today unless you upgrade to ${LUMO_SHORT_APP_NAME} Plus.`;
    }

    if (daysRemaining === 1) {
        return c('collider_2025: Info')
            .t`This chat will be removed tomorrow unless you upgrade to ${LUMO_SHORT_APP_NAME} Plus.`;
    }

    return c('collider_2025: Info')
        .t`This chat will be removed in 2 days. Upgrade to ${LUMO_SHORT_APP_NAME} Plus to keep it.`;
};

export const getConversationExpirationBannerTitle = (daysRemaining: number): string => {
    if (daysRemaining === 0) {
        return c('collider_2025: Warning').t`This chat expires today`;
    }

    if (daysRemaining === 1) {
        return c('collider_2025: Warning').t`This chat expires tomorrow`;
    }

    return c('collider_2025: Warning').t`This chat expires in 2 days`;
};

export interface ConversationExpirationCounts {
    expiringInTwoDays: number;
    expiringInOneDay: number;
    expiringToday: number;
}

export const countConversationsByExpirationUrgency = (
    conversations: Conversation[],
    retentionDays: number = FREE_USER_CHAT_RETENTION_DAYS,
    now: Date = new Date()
): ConversationExpirationCounts => {
    let expiringInTwoDays = 0;
    let expiringInOneDay = 0;
    let expiringToday = 0;

    for (const conversation of conversations) {
        const urgency = getConversationExpirationUrgency(conversation, retentionDays, now);

        if (urgency === 'warning') {
            expiringInTwoDays++;
            continue;
        }

        if (urgency !== 'urgent') {
            continue;
        }

        const daysRemaining = getConversationRetentionDaysRemaining(conversation, retentionDays, now);

        if (daysRemaining === 0) {
            expiringToday++;
        } else {
            expiringInOneDay++;
        }
    }

    return { expiringInTwoDays, expiringInOneDay, expiringToday };
};
