import { subDays } from 'date-fns';

import { FREE_USER_CHAT_RETENTION_DAYS } from '../../constants/limits';
import type { Conversation } from '../../types';
import { ConversationStatus } from '../../types';
import { filterAllChatsConversations, getAllChatsEmptyVariant } from './filterAllChatsConversations';
import type { AllChatsRowDataMap } from './selectAllChatsRowData';

const createTestConversation = (daysAgo: number, id: string, overrides: Partial<Conversation> = {}): Conversation => {
    const now = new Date();
    const createdAt = subDays(now, daysAgo).toISOString();
    const updatedAt = createdAt;

    return {
        id,
        spaceId: 'test-space',
        title: `Conversation ${id}`,
        createdAt,
        updatedAt,
        starred: false,
        status: ConversationStatus.COMPLETED,
        ...overrides,
    };
};

const defaultRowData: AllChatsRowDataMap = {
    'via-preview': {
        preview: 'Budget planning tips',
        isProject: false,
    },
};

const filterConversations = (
    conversations: Conversation[],
    overrides: Partial<Parameters<typeof filterAllChatsConversations>[0]> = {}
) => {
    return filterAllChatsConversations({
        conversations,
        filter: 'all',
        searchQuery: '',
        rowDataMap: {},
        sortField: 'updatedAt',
        hasLumoPlus: true,
        ...overrides,
    });
};

describe('filterAllChatsConversations', () => {
    it('excludes ghost conversations', () => {
        const conversations = [createTestConversation(0, 'real'), createTestConversation(0, 'ghost', { ghost: true })];

        expect(filterConversations(conversations).map((conversation) => conversation.id)).toEqual(['real']);
    });

    it('shows only starred chats when filter is favorites', () => {
        const conversations = [
            createTestConversation(0, 'starred', { starred: true }),
            createTestConversation(0, 'normal'),
        ];

        const result = filterConversations(conversations, { filter: 'favorites' });

        expect(result.map((conversation) => conversation.id)).toEqual(['starred']);
    });

    it('shows only project chats when filter is projects', () => {
        const conversations = [createTestConversation(0, 'project-chat'), createTestConversation(0, 'regular-chat')];
        const rowDataMap: AllChatsRowDataMap = {
            'project-chat': {
                preview: '',
                isProject: true,
            },
            'regular-chat': {
                preview: '',
                isProject: false,
            },
        };

        const result = filterConversations(conversations, { filter: 'projects', rowDataMap });

        expect(result.map((conversation) => conversation.id)).toEqual(['project-chat']);
    });

    it('matches search against title case-insensitively and trims whitespace', () => {
        const conversations = [
            createTestConversation(0, 'match', { title: 'My Budget Chat' }),
            createTestConversation(0, 'miss', { title: 'Weather' }),
        ];

        const result = filterConversations(conversations, { searchQuery: '  BUDGET ' });

        expect(result.map((conversation) => conversation.id)).toEqual(['match']);
    });

    it('matches search against preview when title does not match', () => {
        const conversations = [
            createTestConversation(0, 'via-preview', { title: 'Untitled' }),
            createTestConversation(0, 'no-match', { title: 'Other' }),
        ];

        const result = filterConversations(conversations, {
            searchQuery: 'budget',
            rowDataMap: defaultRowData,
        });

        expect(result.map((conversation) => conversation.id)).toEqual(['via-preview']);
    });

    it('sorts by updatedAt descending by default', () => {
        const conversations = [
            createTestConversation(0, 'older', { updatedAt: '2026-07-10T10:00:00.000Z' }),
            createTestConversation(0, 'newer', { updatedAt: '2026-07-13T10:00:00.000Z' }),
        ];

        const result = filterConversations(conversations);

        expect(result.map((conversation) => conversation.id)).toEqual(['newer', 'older']);
    });

    it('sorts by createdAt when that sort field is selected', () => {
        const conversations = [
            createTestConversation(0, 'old-update', {
                createdAt: '2026-07-01T10:00:00.000Z',
                updatedAt: '2026-07-13T10:00:00.000Z',
            }),
            createTestConversation(0, 'new-create', {
                createdAt: '2026-07-12T10:00:00.000Z',
                updatedAt: '2026-07-02T10:00:00.000Z',
            }),
        ];

        const result = filterConversations(conversations, { sortField: 'createdAt' });

        expect(result.map((conversation) => conversation.id)).toEqual(['new-create', 'old-update']);
    });

    describe('retention policy', () => {
        it('hides expired non-starred chats for free users', () => {
            const conversations = [
                createTestConversation(3, 'recent'),
                createTestConversation(FREE_USER_CHAT_RETENTION_DAYS + 1, 'expired'),
            ];

            const result = filterConversations(conversations, { hasLumoPlus: false });

            expect(result.map((conversation) => conversation.id)).toEqual(['recent']);
        });

        it('hides expired starred chats for free users', () => {
            const conversations = [
                createTestConversation(FREE_USER_CHAT_RETENTION_DAYS + 1, 'starred-expired', {
                    starred: true,
                }),
                createTestConversation(3, 'recent-starred', { starred: true }),
            ];

            const result = filterConversations(conversations, { hasLumoPlus: false });

            expect(result.map((conversation) => conversation.id)).toEqual(['recent-starred']);
        });

        it('shows expired chats for Lumo Plus users', () => {
            const conversations = [
                createTestConversation(3, 'recent'),
                createTestConversation(FREE_USER_CHAT_RETENTION_DAYS + 1, 'expired'),
            ];

            const result = filterConversations(conversations, { hasLumoPlus: true });

            expect(result.map((conversation) => conversation.id)).toEqual(['recent', 'expired']);
        });

        it('applies favorites filter after retention for free users', () => {
            const conversations = [
                createTestConversation(3, 'recent-starred', { starred: true }),
                createTestConversation(FREE_USER_CHAT_RETENTION_DAYS + 1, 'starred-expired', {
                    starred: true,
                }),
                createTestConversation(3, 'recent'),
            ];

            const result = filterConversations(conversations, {
                filter: 'favorites',
                hasLumoPlus: false,
            });

            expect(result.map((conversation) => conversation.id)).toEqual(['recent-starred']);
        });
    });
});

describe('getAllChatsEmptyVariant', () => {
    it('returns no-results when search has text', () => {
        expect(getAllChatsEmptyVariant('budget', 'all')).toBe('no-results');
    });

    it('returns no-favorites when favorites filter is active and search is empty', () => {
        expect(getAllChatsEmptyVariant('', 'favorites')).toBe('no-favorites');
    });

    it('returns no-projects when projects filter is active and search is empty', () => {
        expect(getAllChatsEmptyVariant('', 'projects')).toBe('no-projects');
    });

    it('returns no-chats when there is no search and filter is all', () => {
        expect(getAllChatsEmptyVariant('', 'all')).toBe('no-chats');
    });
});
