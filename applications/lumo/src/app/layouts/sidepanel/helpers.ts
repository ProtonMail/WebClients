import { addDays, differenceInCalendarDays, startOfDay, subDays } from 'date-fns';
import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { FREE_USER_CHAT_DELETION_GRACE_DAYS, FREE_USER_CHAT_RETENTION_DAYS } from '../../constants/limits';
import type { ChatHistoryDateField } from '../../redux/slices/lumoUserSettings';
import type { Conversation } from '../../types';

export type ConversationSortField = ChatHistoryDateField;

const CONVERSATION_DATE_GROUP_ORDER = ['today', 'yesterday', 'last-week', 'older'] as const;

export type ConversationDateGroupKey = (typeof CONVERSATION_DATE_GROUP_ORDER)[number];

export interface ConversationDateGroup {
    key: ConversationDateGroupKey;
    title: string;
    conversations: Conversation[];
}

export const sortConversationsByField = (
    conversations: Conversation[],
    sortBy: ConversationSortField = 'updatedAt'
): Conversation[] =>
    [...conversations].sort((a, b) => new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime());

export const getConversationDateGroupKey = (dayDiff: number): ConversationDateGroupKey => {
    if (dayDiff <= 0) {
        return 'today';
    }

    if (dayDiff === 1) {
        return 'yesterday';
    }

    if (dayDiff <= 7) {
        return 'last-week';
    }

    return 'older';
};

export const getConversationDateGroupTitle = (key: ConversationDateGroupKey): string => {
    switch (key) {
        case 'today':
            return c('collider_2025: Date').t`Today`;
        case 'yesterday':
            return c('collider_2025: Date').t`Yesterday`;
        case 'last-week':
            return c('collider_2025: Date').t`Last week`;
        case 'older':
            return c('collider_2025:Title').t`Older`;
    }
};

export const formatConversationDateGroupLabel = (dayStart: Date, now: Date = startOfDay(new Date())): string => {
    const dayDiff = differenceInCalendarDays(now, dayStart);

    return getConversationDateGroupTitle(getConversationDateGroupKey(dayDiff));
};

/**
 * Group conversations into Today, Yesterday, Last week, and Older.
 * Which date field is used is controlled by sortBy (updatedAt or createdAt).
 */
export const groupConversationsByDate = (
    conversations: Conversation[],
    { sortBy = 'updatedAt' }: { sortBy?: ConversationSortField } = {}
): ConversationDateGroup[] => {
    const now = startOfDay(new Date());
    const sorted = sortConversationsByField(conversations, sortBy);
    const groups = new Map<ConversationDateGroupKey, Conversation[]>();

    for (const conversation of sorted) {
        const dayStart = startOfDay(new Date(conversation[sortBy]));
        const dayDiff = differenceInCalendarDays(now, dayStart);
        const key = getConversationDateGroupKey(dayDiff);
        const existing = groups.get(key);

        if (existing) {
            existing.push(conversation);
            continue;
        }

        groups.set(key, [conversation]);
    }

    return CONVERSATION_DATE_GROUP_ORDER.filter((key) => groups.has(key)).map((key) => ({
        key,
        title: getConversationDateGroupTitle(key),
        conversations: groups.get(key)!,
    }));
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
    retentionDays: number = FREE_USER_CHAT_RETENTION_DAYS,
    now: Date = new Date()
): Conversation[] => {
    const cutoff = subDays(startOfDay(now), retentionDays);

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

/**
 * Calendar days until a free-user conversation is permanently deleted.
 * Returns 0 on the deletion day, negative values once past due.
 */
export const getConversationDeletionDaysRemaining = (
    conversation: Conversation,
    retentionDays: number = FREE_USER_CHAT_RETENTION_DAYS,
    deletionGraceDays: number = FREE_USER_CHAT_DELETION_GRACE_DAYS,
    now: Date = new Date()
): number => {
    const createdAt = startOfDay(new Date(conversation.createdAt));
    const deletionDay = addDays(createdAt, retentionDays + deletionGraceDays);

    return differenceInCalendarDays(deletionDay, startOfDay(now));
};

/** True when a free-user chat is past its deletion date and should be removed. */
export const isConversationEligibleForDeletion = (
    conversation: Conversation,
    retentionDays: number = FREE_USER_CHAT_RETENTION_DAYS,
    deletionGraceDays: number = FREE_USER_CHAT_DELETION_GRACE_DAYS,
    now: Date = new Date()
): boolean => getConversationDeletionDaysRemaining(conversation, retentionDays, deletionGraceDays, now) <= 0;

export const getConversationsEligibleForDeletion = (
    conversations: Conversation[],
    retentionDays: number = FREE_USER_CHAT_RETENTION_DAYS,
    deletionGraceDays: number = FREE_USER_CHAT_DELETION_GRACE_DAYS,
    now: Date = new Date()
): Conversation[] =>
    conversations.filter((conversation) =>
        isConversationEligibleForDeletion(conversation, retentionDays, deletionGraceDays, now)
    );

/**
 * True when a chat is in the grace period before permanent deletion
 * (past the sidebar retention window but not yet deleted).
 */
export const isConversationInDeletionGracePeriod = (
    conversation: Conversation,
    retentionDays: number = FREE_USER_CHAT_RETENTION_DAYS,
    deletionGraceDays: number = FREE_USER_CHAT_DELETION_GRACE_DAYS,
    now: Date = new Date()
): boolean => {
    const deletionDaysRemaining = getConversationDeletionDaysRemaining(
        conversation,
        retentionDays,
        deletionGraceDays,
        now
    );

    return (
        deletionDaysRemaining > 0 &&
        !filterConversationsWithinRetentionWindow([conversation], retentionDays, now).length
    );
};

export const getConversationDeletionBannerTitle = (daysUntilDeletion: number): string => {
    if (daysUntilDeletion === 0) {
        return c('collider_2025: Warning').t`This chat will be deleted today`;
    }

    if (daysUntilDeletion === 1) {
        return c('collider_2025: Warning').t`This chat will be deleted tomorrow`;
    }

    return c('collider_2025: Warning').t`This chat will be deleted soon`;
};

export const getConversationDeletionBannerDescription = (): string =>
    c('collider_2025: Info')
        .t`Free accounts keep chat history for 7 days. This chat is past that window and will be permanently deleted unless you upgrade to ${LUMO_SHORT_APP_NAME} Plus.`;

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
