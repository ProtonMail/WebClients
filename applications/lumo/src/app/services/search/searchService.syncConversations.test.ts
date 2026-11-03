import { type Conversation, ConversationStatus, type Message, Role } from '../../types';
import type { IndexableConversation } from '../../workers/search/SearchEngine';
import { SearchService } from './searchService';

jest.mock('../../config/search', () => ({ ENABLE_FOUNDATION_SEARCH: true }));

const conversation = (id: string, extra: Partial<Conversation> = {}): Conversation =>
    ({
        id,
        spaceId: 'space',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        title: `Chat ${id}`,
        ...extra,
    }) as Conversation;

const message = (id: string, conversationId: string, content: string, extra: Partial<Message> = {}): Message =>
    ({
        id,
        conversationId,
        role: Role.User,
        createdAt: `2026-01-01T00:00:0${id.length}`,
        content,
        ...extra,
    }) as Message;

type IndexRequest = { type: number; conversations?: IndexableConversation[]; removedIds?: string[] };

let userCount = 0;

const setup = (indexed: Record<string, string> = {}) => {
    userCount += 1;
    const service = SearchService.get(`sync-user-${userCount}`);
    const requests: IndexRequest[] = [];
    jest.spyOn(
        service as unknown as { postToWorker: (m: IndexRequest) => Promise<unknown> },
        'postToWorker'
    ).mockImplementation(async (request) => {
        requests.push(request);
        return request.type === 4 ? { fingerprints: indexed } : { success: true };
    });
    const writes = () => requests.filter((request) => request.type === 2);
    return { service, writes };
};

describe('SearchService.syncConversations', () => {
    afterEach(() => jest.restoreAllMocks());

    it('indexes chat text from blocks or content, leaving out ghost, scheduled and generating chats', async () => {
        const { service, writes } = setup();
        const state = {
            conversations: {
                a: conversation('a'),
                ghost: conversation('ghost', { ghost: true }),
                busy: conversation('busy', { status: ConversationStatus.GENERATING }),
            },
            messages: {
                m1: message('m1', 'a', 'budget notes'),
                m22: message('m22', 'a', '', {
                    role: Role.Assistant,
                    blocks: [{ type: 'text', content: 'Q3 totals' }],
                } as Partial<Message>),
                m333: message('m333', 'a', 'thinking', { placeholder: true }),
                g1: message('g1', 'ghost', 'secret'),
            },
        } as any;

        await service.syncConversations(() => state);

        expect(writes()).toHaveLength(1);
        expect(writes()[0].removedIds).toEqual([]);
        expect(writes()[0].conversations).toEqual([
            {
                id: 'a',
                title: 'Chat a',
                messages: [
                    { role: 'user', content: 'budget notes' },
                    { role: 'assistant', content: 'Q3 totals' },
                ],
                fingerprint: expect.any(String),
            },
        ]);
        expect(service.getIndexedConversationCount()).toBe(1);
    });

    it('re-indexes only changed chats and removes deleted ones', async () => {
        const { service, writes } = setup();
        const state = {
            conversations: { a: conversation('a'), b: conversation('b'), gone: conversation('gone') },
            messages: { m1: message('m1', 'a', 'one'), m2: message('m2', 'b', 'two') },
        } as any;
        await service.syncConversations(() => state);

        delete state.conversations.gone;
        state.messages.m3 = message('m3', 'b', 'three');
        await service.syncConversations(() => state);

        expect(writes()).toHaveLength(2);
        expect(writes()[1].conversations!.map(({ id }) => id)).toEqual(['b']);
        expect(writes()[1].removedIds).toEqual(['gone']);
        expect(service.getIndexedConversationCount()).toBe(2);
    });

    it('skips chats the worker already holds at the same fingerprint', async () => {
        const first = setup();
        const state = { conversations: { a: conversation('a') }, messages: { m1: message('m1', 'a', 'one') } } as any;
        await first.service.syncConversations(() => state);
        const fingerprint = first.writes()[0].conversations![0].fingerprint;

        const second = setup({ a: fingerprint });
        await second.service.syncConversations(() => state);

        expect(second.writes()).toHaveLength(0);
    });

    it('indexes everything again after a reset', async () => {
        const { service, writes } = setup();
        const state = { conversations: { a: conversation('a') }, messages: {} } as any;
        await service.syncConversations(() => state);
        await service.syncConversations(() => state);
        expect(writes()).toHaveLength(1);

        await service.resetConversationIndex();
        await service.syncConversations(() => state);

        expect(writes()).toHaveLength(2);
    });
});
