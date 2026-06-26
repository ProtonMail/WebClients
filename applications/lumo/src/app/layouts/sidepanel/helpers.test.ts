import { subDays } from 'date-fns';

import { FREE_USER_CHAT_RETENTION_DAYS } from '../../constants/limits';
import type { Conversation } from '../../types';
import { ConversationStatus } from '../../types';
import {
    applyRetentionPolicy,
    countConversationsByExpirationUrgency,
    formatConversationDateGroupLabel,
    getConversationExpirationBannerTitle,
    getConversationExpirationTooltip,
    getConversationExpirationUrgency,
    getConversationRetentionDaysRemaining,
    groupConversationsByDate,
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
    it('groups conversations into Today, Yesterday, individual dates, and Older', () => {
        const conversations = [
            createTestConversation(0, 'today'),
            createTestConversation(1, 'yesterday'),
            createTestConversation(3, 'three-days'),
            createTestConversation(40, 'older'),
        ];

        const groups = groupConversationsByDate(conversations);

        expect(groups).toHaveLength(4);
        expect(groups[0].title).toBe(formatConversationDateGroupLabel(subDays(new Date(), 0)));
        expect(groups[0].conversations.map((conversation) => conversation.id)).toEqual(['today']);
        expect(groups[1].title).toBe(formatConversationDateGroupLabel(subDays(new Date(), 1)));
        expect(groups[1].conversations.map((conversation) => conversation.id)).toEqual(['yesterday']);
        expect(groups[2].conversations.map((conversation) => conversation.id)).toEqual(['three-days']);
        expect(groups[3].key).toBe('older');
        expect(groups[3].conversations.map((conversation) => conversation.id)).toEqual(['older']);
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

        expect(groups[0].title).toBe(formatConversationDateGroupLabel(new Date()));
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
