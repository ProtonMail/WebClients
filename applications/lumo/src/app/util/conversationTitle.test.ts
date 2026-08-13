import { type Conversation, ConversationStatus } from '../types';
import {
    getDefaultNewConversationTitle,
    isPlaceholderConversationTitle,
    mergeConversationFromRemote,
    shouldPreserveLocalConversationTitle,
} from './conversationTitle';

const createConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
    id: 'conv-1',
    spaceId: 'space-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    title: getDefaultNewConversationTitle(),
    status: ConversationStatus.COMPLETED,
    ...overrides,
});

describe('conversationTitle', () => {
    it('treats default and English new-chat titles as placeholders', () => {
        expect(isPlaceholderConversationTitle(getDefaultNewConversationTitle())).toBe(true);
        expect(isPlaceholderConversationTitle('New chat')).toBe(true);
        expect(isPlaceholderConversationTitle('  New chat  ')).toBe(true);
        expect(isPlaceholderConversationTitle('')).toBe(true);
    });

    it('does not treat generated titles as placeholders', () => {
        expect(isPlaceholderConversationTitle('Budget planning tips')).toBe(false);
    });

    it('preserves a generated local title over a stale placeholder remote title', () => {
        const local = createConversation({ title: 'Budget planning tips' });
        const remote = createConversation({ title: getDefaultNewConversationTitle() });

        expect(shouldPreserveLocalConversationTitle(local, remote)).toBe(true);
    });

    it('preserves a streamed title while the conversation is generating', () => {
        const local = createConversation({
            title: 'Streaming title',
            status: ConversationStatus.GENERATING,
        });
        const remote = createConversation({ title: getDefaultNewConversationTitle() });

        expect(shouldPreserveLocalConversationTitle(local, remote)).toBe(true);
    });

    it('does not preserve when remote already has the same title', () => {
        const local = createConversation({ title: 'Shared title' });
        const remote = createConversation({ title: 'Shared title' });

        expect(shouldPreserveLocalConversationTitle(local, remote)).toBe(false);
    });

    it('merges remote metadata without overwriting a preserved local title', () => {
        const local = createConversation({
            title: 'Budget planning tips',
            starred: false,
            status: ConversationStatus.GENERATING,
        });
        const remote = createConversation({
            title: getDefaultNewConversationTitle(),
            starred: true,
            status: ConversationStatus.COMPLETED,
        });

        const { conversation, preserveLocalTitle } = mergeConversationFromRemote(local, remote);

        expect(preserveLocalTitle).toBe(true);
        expect(conversation.title).toBe('Budget planning tips');
        expect(conversation.starred).toBe(true);
        expect(conversation.status).toBe(ConversationStatus.GENERATING);
    });
});
