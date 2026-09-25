import type { MessageMap } from '../../../redux/slices/core/messages';
import type { Conversation, Message } from '../../../types';
import { Role } from '../../../types';

export const testBaseConversation: Conversation = Object.freeze({
    id: 'conv-1',
    spaceId: 'space-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:10:00.000Z',
    title: 'Test Conversation',
});

export const makeMessage = (overrides: Partial<Message>): Message => ({
    content: 'Hello',
    conversationId: 'conv-1',
    createdAt: new Date().toISOString(),
    id: '',
    role: Role.User,
    ...overrides,
});

export const toMessageMap = (messages: Message[]): MessageMap =>
    Object.fromEntries(messages.map((message) => [message.id, message]));
