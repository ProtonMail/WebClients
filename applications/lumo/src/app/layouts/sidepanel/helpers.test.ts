import { subDays } from 'date-fns';

import { FREE_USER_CHAT_DELETION_GRACE_DAYS, FREE_USER_CHAT_RETENTION_DAYS } from '../../constants/limits';
import type { Conversation } from '../../types';
import { ConversationStatus } from '../../types';
import {
    applyRetentionPolicy,
    countConversationsByExpirationUrgency,
    getConversationDateGroupTitle,
    getConversationDeletionBannerTitle,
    getConversationDeletionDaysRemaining,
    getConversationExpirationBannerTitle,
    getConversationExpirationTooltip,
    getConversationExpirationUrgency,
    getConversationRetentionDaysRemaining,
    getConversationsEligibleForDeletion,
    groupConversationsByDate,
    isConversationEligibleForDeletion,
    isConversationInDeletionGracePeriod,
} from './helpers';

const createTestConversation = (
    daysAgo: number,
    id: string = `conv-${daysAgo}`,
    updatedAtOffsetHours: number = 0
): Conversation => {
    const now = new Date();
    const createdAt = subDays(now, daysAgo).toISOString();
    const updatedAt = new Date(subDays(now, daysAgo).getTime() + updatedAtOffsetHours * 60 * 60 * 1000).toISOString();
    return {
        id,
        spaceId: 'test-space',
        title: `Conversation ${daysAgo} days ago`,
        createdAt,
        updatedAt,
        starred: false,
        status: ConversationStatus.COMPLETED,
    };
};

describe('groupConversationsByDate', () => {
    it('groups conversations into Today, Yesterday, Last week, and Older', () => {
        const conversations = [
            createTestConversation(0, 'today'),
            createTestConversation(1, 'yesterday'),
            createTestConversation(3, 'last-week'),
            createTestConversation(10, 'older'),
        ];

        const groups = groupConversationsByDate(conversations);

        expect(groups).toHaveLength(4);
        expect(groups.map((group) => group.key)).toEqual(['today', 'yesterday', 'last-week', 'older']);
        expect(groups[0].title).toBe(getConversationDateGroupTitle('today'));
        expect(groups[0].conversations.map((conversation) => conversation.id)).toEqual(['today']);
        expect(groups[1].title).toBe(getConversationDateGroupTitle('yesterday'));
        expect(groups[1].conversations.map((conversation) => conversation.id)).toEqual(['yesterday']);
        expect(groups[2].conversations.map((conversation) => conversation.id)).toEqual(['last-week']);
        expect(groups[3].conversations.map((conversation) => conversation.id)).toEqual(['older']);
    });

    it('combines chats from multiple days into the Last week bucket', () => {
        const conversations = [createTestConversation(2, 'two-days'), createTestConversation(5, 'five-days')];

        const groups = groupConversationsByDate(conversations);

        expect(groups).toHaveLength(1);
        expect(groups[0].key).toBe('last-week');
        expect(groups[0].conversations.map((conversation) => conversation.id)).toEqual(['two-days', 'five-days']);
    });

    it('places chats older than 7 days in Older', () => {
        const groups = groupConversationsByDate([createTestConversation(8, 'eight-days')]);

        expect(groups).toHaveLength(1);
        expect(groups[0].key).toBe('older');
    });

    it('sorts conversations within each group by updatedAt descending', () => {
        const conversations = [
            createTestConversation(0, 'older-in-group', 1),
            createTestConversation(0, 'newer-in-group', 5),
        ];

        const groups = groupConversationsByDate(conversations);

        expect(groups[0].conversations.map((conversation) => conversation.id)).toEqual([
            'newer-in-group',
            'older-in-group',
        ]);
    });

    it('uses updatedAt by default for grouping', () => {
        const conversation: Conversation = {
            ...createTestConversation(10, 'recent-activity'),
            createdAt: subDays(new Date(), 40).toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const groups = groupConversationsByDate([conversation]);

        expect(groups[0].key).toBe('today');
    });
});

describe('applyRetentionPolicy', () => {
    it('returns all conversations for Lumo Plus users', () => {
        const conversations = Array.from({ length: 10 }, (_, i) => createTestConversation(i, `conv-${i}`));

        expect(applyRetentionPolicy(conversations, true)).toHaveLength(10);
    });

    it('limits free users to conversations within the retention window', () => {
        const recent = createTestConversation(3, 'recent');
        const expired = createTestConversation(FREE_USER_CHAT_RETENTION_DAYS + 1, 'expired');

        expect(applyRetentionPolicy([recent, expired], false).map((conversation) => conversation.id)).toEqual([
            'recent',
        ]);
    });

    it('applies the same retention window to lighter row shapes, e.g. sidebar history rows', () => {
        // Regression guard: the sidebar's "Recent" list used to reimplement this cutoff
        // calculation inline instead of calling this shared helper, so it could silently
        // drift from Favorites/All Chats. This locks in that it works on any object with
        // just a createdAt, not only full Conversation objects.
        const recentRow = { id: 'recent-row', createdAt: subDays(new Date(), 3).toISOString() };
        const expiredRow = {
            id: 'expired-row',
            createdAt: subDays(new Date(), FREE_USER_CHAT_RETENTION_DAYS + 1).toISOString(),
        };

        expect(applyRetentionPolicy([recentRow, expiredRow], false).map((row) => row.id)).toEqual(['recent-row']);
        expect(applyRetentionPolicy([recentRow, expiredRow], true).map((row) => row.id)).toEqual([
            'recent-row',
            'expired-row',
        ]);
    });
});

describe('getConversationRetentionDaysRemaining', () => {
    it('returns days until the retention window ends based on createdAt', () => {
        const conversation = createTestConversation(5, 'expiring-soon');

        expect(getConversationRetentionDaysRemaining(conversation)).toBe(2);
    });

    it('returns 0 on the last accessible day', () => {
        const conversation = createTestConversation(FREE_USER_CHAT_RETENTION_DAYS, 'last-day');

        expect(getConversationRetentionDaysRemaining(conversation)).toBe(0);
    });
});

describe('getConversationExpirationUrgency', () => {
    it('returns null when more than 2 days remain', () => {
        const conversation = createTestConversation(3, 'safe');

        expect(getConversationExpirationUrgency(conversation)).toBeNull();
    });

    it('returns warning when 2 days remain', () => {
        const conversation = createTestConversation(5, 'warning');

        expect(getConversationExpirationUrgency(conversation)).toBe('warning');
    });

    it('returns urgent when 1 day or less remains', () => {
        const tomorrow = createTestConversation(6, 'urgent-tomorrow');
        const today = createTestConversation(FREE_USER_CHAT_RETENTION_DAYS, 'urgent-today');

        expect(getConversationExpirationUrgency(tomorrow)).toBe('urgent');
        expect(getConversationExpirationUrgency(today)).toBe('urgent');
    });
});

describe('getConversationExpirationTooltip', () => {
    it('returns the expected message for each urgency window', () => {
        expect(getConversationExpirationTooltip(2)).toContain('2 days');
        expect(getConversationExpirationTooltip(1)).toContain('tomorrow');
        expect(getConversationExpirationTooltip(0)).toContain('today');
    });
});

describe('getConversationExpirationBannerTitle', () => {
    it('returns the expected title for each urgency window', () => {
        expect(getConversationExpirationBannerTitle(2)).toContain('2 days');
        expect(getConversationExpirationBannerTitle(1)).toContain('tomorrow');
        expect(getConversationExpirationBannerTitle(0)).toContain('today');
    });
});

describe('countConversationsByExpirationUrgency', () => {
    it('counts conversations by expiration urgency', () => {
        const conversations = [
            createTestConversation(3, 'safe'),
            createTestConversation(5, 'two-days'),
            createTestConversation(6, 'one-day'),
            createTestConversation(FREE_USER_CHAT_RETENTION_DAYS, 'today'),
        ];

        expect(countConversationsByExpirationUrgency(conversations)).toEqual({
            expiringInTwoDays: 1,
            expiringInOneDay: 1,
            expiringToday: 1,
        });
    });
});

describe('getConversationDeletionDaysRemaining', () => {
    it('returns days until permanent deletion after the retention grace period', () => {
        const conversation = createTestConversation(
            FREE_USER_CHAT_RETENTION_DAYS + FREE_USER_CHAT_DELETION_GRACE_DAYS - 1,
            'deletion-tomorrow'
        );

        expect(getConversationDeletionDaysRemaining(conversation)).toBe(1);
    });

    it('returns 0 on the deletion day', () => {
        const conversation = createTestConversation(
            FREE_USER_CHAT_RETENTION_DAYS + FREE_USER_CHAT_DELETION_GRACE_DAYS,
            'deletion-today'
        );

        expect(getConversationDeletionDaysRemaining(conversation)).toBe(0);
    });
});

describe('isConversationEligibleForDeletion', () => {
    it('returns false before the deletion day', () => {
        const conversation = createTestConversation(
            FREE_USER_CHAT_RETENTION_DAYS + FREE_USER_CHAT_DELETION_GRACE_DAYS - 1,
            'not-yet'
        );

        expect(isConversationEligibleForDeletion(conversation)).toBe(false);
    });

    it('returns true on or after the deletion day', () => {
        const conversation = createTestConversation(
            FREE_USER_CHAT_RETENTION_DAYS + FREE_USER_CHAT_DELETION_GRACE_DAYS,
            'eligible'
        );

        expect(isConversationEligibleForDeletion(conversation)).toBe(true);
    });
});

describe('getConversationsEligibleForDeletion', () => {
    it('returns only conversations past the deletion threshold', () => {
        const recent = createTestConversation(3, 'recent');
        const eligible = createTestConversation(
            FREE_USER_CHAT_RETENTION_DAYS + FREE_USER_CHAT_DELETION_GRACE_DAYS,
            'eligible'
        );

        expect(getConversationsEligibleForDeletion([recent, eligible]).map((conversation) => conversation.id)).toEqual([
            'eligible',
        ]);
    });
});

describe('isConversationInDeletionGracePeriod', () => {
    it('returns false while the chat is still within the retention window', () => {
        const conversation = createTestConversation(3, 'recent');

        expect(isConversationInDeletionGracePeriod(conversation)).toBe(false);
    });

    it('returns false when the chat is due for deletion the same day it leaves the retention window', () => {
        const conversation = createTestConversation(
            FREE_USER_CHAT_RETENTION_DAYS + FREE_USER_CHAT_DELETION_GRACE_DAYS,
            'due-today'
        );

        expect(isConversationInDeletionGracePeriod(conversation)).toBe(false);
    });
});

describe('getConversationDeletionBannerTitle', () => {
    it('returns the expected title for each deletion window', () => {
        expect(getConversationDeletionBannerTitle(1)).toContain('tomorrow');
        expect(getConversationDeletionBannerTitle(0)).toContain('today');
    });
});

describe('free user chat retention lifecycle', () => {
    const createdAt = '2026-01-01T00:00:00.000Z';
    const conversation: Conversation = {
        id: 'lifecycle-chat',
        spaceId: 'test-space',
        title: 'Lifecycle chat',
        createdAt,
        updatedAt: createdAt,
        starred: false,
        status: ConversationStatus.COMPLETED,
    };

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('keeps the chat visible through day 8 and not yet eligible for deletion', () => {
        jest.setSystemTime(new Date('2026-01-08T12:00:00.000Z'));

        expect(applyRetentionPolicy([conversation], false)).toHaveLength(1);
        expect(isConversationEligibleForDeletion(conversation)).toBe(false);
        expect(getConversationDeletionDaysRemaining(conversation)).toBe(1);
        expect(getConversationExpirationUrgency(conversation)).toBe('urgent');
    });

    it('hides the chat from history and makes it eligible for soft deletion on day 9', () => {
        jest.setSystemTime(new Date('2026-01-09T12:00:00.000Z'));

        expect(applyRetentionPolicy([conversation], false)).toHaveLength(0);
        expect(isConversationEligibleForDeletion(conversation)).toBe(true);
        expect(getConversationDeletionDaysRemaining(conversation)).toBe(0);
    });

    it('does not hide expired chats from Lumo Plus users', () => {
        jest.setSystemTime(new Date('2026-01-09T12:00:00.000Z'));

        expect(applyRetentionPolicy([conversation], true)).toHaveLength(1);
    });
});
