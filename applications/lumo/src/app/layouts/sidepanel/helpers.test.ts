import { subDays } from 'date-fns';

import { FREE_USER_CHAT_RETENTION_DAYS } from '../../constants/limits';
import type { Conversation } from '../../types';
import { ConversationStatus } from '../../types';
import {
    applyRetentionPolicy,
    formatConversationDateGroupLabel,
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
