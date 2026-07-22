import type { Message } from '../types';
import { Role } from '../types';
import { groupMessagesByConversationId } from './selectors';
import type { MessageMap } from './slices/core/messages';

const createTestMessage = (
    id: string,
    conversationId: string,
    createdAt: string,
    overrides: Partial<Message> = {}
): Message => ({
    id,
    conversationId,
    createdAt,
    role: Role.User,
    ...overrides,
});

const toMessageMap = (messages: Message[]): MessageMap =>
    Object.fromEntries(messages.map((message) => [message.id, message]));

describe('groupMessagesByConversationId', () => {
    it('groups messages by conversationId', () => {
        const messages = toMessageMap([
            createTestMessage('m1', 'conv-a', '2026-07-20T00:00:00.000Z'),
            createTestMessage('m2', 'conv-b', '2026-07-20T00:00:00.000Z'),
            createTestMessage('m3', 'conv-a', '2026-07-21T00:00:00.000Z'),
        ]);

        const grouped = groupMessagesByConversationId(messages);

        expect(Object.keys(grouped).sort()).toEqual(['conv-a', 'conv-b']);
        expect(grouped['conv-a'].map((m) => m.id)).toEqual(['m3', 'm1']);
        expect(grouped['conv-b'].map((m) => m.id)).toEqual(['m2']);
    });

    it('sorts each conversation group by createdAt, newest first', () => {
        const messages = toMessageMap([
            createTestMessage('oldest', 'conv-a', '2026-07-01T00:00:00.000Z'),
            createTestMessage('newest', 'conv-a', '2026-07-22T00:00:00.000Z'),
            createTestMessage('middle', 'conv-a', '2026-07-10T00:00:00.000Z'),
        ]);

        const grouped = groupMessagesByConversationId(messages);

        expect(grouped['conv-a'].map((m) => m.id)).toEqual(['newest', 'middle', 'oldest']);
    });

    it('excludes placeholder messages', () => {
        const messages = toMessageMap([
            createTestMessage('real', 'conv-a', '2026-07-20T00:00:00.000Z'),
            createTestMessage('ghost', 'conv-a', '2026-07-21T00:00:00.000Z', { placeholder: true }),
        ]);

        const grouped = groupMessagesByConversationId(messages);

        expect(grouped['conv-a'].map((m) => m.id)).toEqual(['real']);
    });

    it('returns an empty object for an empty message map', () => {
        expect(groupMessagesByConversationId({})).toEqual({});
    });
});
