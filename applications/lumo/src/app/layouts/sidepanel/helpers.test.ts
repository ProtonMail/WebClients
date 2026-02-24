import { subDays } from 'date-fns';

import type { Conversation } from '../../types';
import { ConversationStatus } from '../../types';
import { categorizeConversations } from './helpers';

const createTestConversation = (daysAgo: number, id: string = `conv-${daysAgo}`): Conversation => {
    const now = new Date();
    const createdAt = subDays(now, daysAgo).toISOString();
    return {
        id,
        spaceId: 'test-space',
        title: `Conversation ${daysAgo} days ago`,
        createdAt,
        updatedAt: createdAt,
        starred: false,
        status: ConversationStatus.COMPLETED,
    };
};

describe.skip('categorizeConversations', () => {
    it('should categorize conversations correctly for free users', () => {
        const conversations = [
            createTestConversation(0), // Today
            createTestConversation(0.5), // Today
            createTestConversation(2), // Last 7 days (1-5)
            createTestConversation(4), // Last 7 days (1-5)
            createTestConversation(5), // Last 7 days (1-5)
            createTestConversation(6), // Expiring soon (6-7)
            createTestConversation(6.9), // Expiring soon (6-7)
            createTestConversation(10), // Last 30 days (8-31)
            createTestConversation(35), // Earlier (32+)
        ];

        const result = categorizeConversations(conversations, false);

        expect(result.today).toHaveLength(2);
        expect(result.lastWeek).toHaveLength(3); // Days 2, 4, 5
        expect(result.expiringSoon).toHaveLength(2); // Days 6, 6.9
        expect(result.lastMonth).toHaveLength(1); // Day 10
        expect(result.earlier).toHaveLength(1); // Day 35
    });

    it('should merge expiringSoon into lastWeek for Lumo Plus users', () => {
        const conversations = [
            createTestConversation(0), // Today
            createTestConversation(2), // Last 7 days
            createTestConversation(5), // Would be expiring soon for free users
            createTestConversation(6), // Would be expiring soon for free users
            createTestConversation(10), // Last 30 days
        ];

        const result = categorizeConversations(conversations, true);

        expect(result.today).toHaveLength(1);
        expect(result.lastWeek).toHaveLength(3); // Includes the 5-6 day old chats
        expect(result.expiringSoon).toHaveLength(0); // Empty for Plus users
        expect(result.lastMonth).toHaveLength(1);
    });

    it('should handle empty conversation list', () => {
        const result = categorizeConversations([], false);

        expect(result.today).toHaveLength(0);
        expect(result.lastWeek).toHaveLength(0);
        expect(result.expiringSoon).toHaveLength(0);
        expect(result.lastMonth).toHaveLength(0);
        expect(result.earlier).toHaveLength(0);
    });

    it('should handle conversations at bucket boundaries for free users', () => {
        const conversations = [
            createTestConversation(0.99), // Should be today
            createTestConversation(1), // Should be last week (1-5 days)
            createTestConversation(4), // Should be last week (1-5 days)
            createTestConversation(4.99), // Should be last week (1-5 days)
            createTestConversation(5), // Should be last week (1-5 days)
            createTestConversation(5.5), // Should be last week (1-5 days)
            createTestConversation(6), // Should be expiring soon (6-7 days)
            createTestConversation(7), // Should be expiring soon (6-7 days)
            createTestConversation(8), // Should be last month (8-31 days)
            createTestConversation(30), // Should be last month (8-31 days)
            createTestConversation(31), // Should be last month (8-31 days)
            createTestConversation(32), // Should be earlier (32+ days)
        ];

        const result = categorizeConversations(conversations, false);
        expect(result.today).toHaveLength(1);
        expect(result.lastWeek).toHaveLength(5); // Days 1, 4, 4.99, 5, 5.5
        expect(result.expiringSoon).toHaveLength(2); // Days 6, 7
        expect(result.lastMonth).toHaveLength(3); // Days 8, 30, 31
        expect(result.earlier).toHaveLength(1); // Day 32
    });

    it('should handle conversations at bucket boundaries for Plus users', () => {
        const conversations = [
            createTestConversation(0.99), // Should be today
            createTestConversation(1), // Should be last week (1-7 days)
            createTestConversation(4.99), // Should be last week (1-7 days)
            createTestConversation(5), // Should be last week (1-7 days)
            createTestConversation(6.5), // Should be last week (1-7 days)
            createTestConversation(7), // Should be last week (1-7 days, boundary included)
            createTestConversation(8), // Should be last month (8-31 days)
            createTestConversation(30), // Should be last month (8-31 days)
            createTestConversation(31), // Should be last month (8-31 days, boundary included)
            createTestConversation(32), // Should be earlier (32+ days)
        ];

        const result = categorizeConversations(conversations, true);
        expect(result.today).toHaveLength(1);
        expect(result.lastWeek).toHaveLength(5); // Days 1, 4.99, 5, 6.5, 7
        expect(result.expiringSoon).toHaveLength(0); // Never populated for Plus users
        expect(result.lastMonth).toHaveLength(3); // Days 8, 30, 31
        expect(result.earlier).toHaveLength(1); // Day 32
    });

    it('should ensure no conversations are lost between buckets', () => {
        // Test that all conversations are accounted for
        const conversations = Array.from({ length: 100 }, (_, i) => createTestConversation(i));

        const resultFree = categorizeConversations(conversations, false);
        const totalFree =
            resultFree.today.length +
            resultFree.lastWeek.length +
            resultFree.expiringSoon.length +
            resultFree.lastMonth.length +
            resultFree.earlier.length;
        expect(totalFree).toBe(100);

        const resultPlus = categorizeConversations(conversations, true);
        const totalPlus =
            resultPlus.today.length +
            resultPlus.lastWeek.length +
            resultPlus.expiringSoon.length +
            resultPlus.lastMonth.length +
            resultPlus.earlier.length;
        expect(totalPlus).toBe(100);
    });
});
