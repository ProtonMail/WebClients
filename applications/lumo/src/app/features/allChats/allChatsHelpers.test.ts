import type { AttachmentMap } from '../../redux/slices/core/attachments';
import type { Message } from '../../types';
import { Role } from '../../types';
import { getConversationPreview } from './allChatsHelpers';

const createTestMessage = (id: string, createdAt: string, overrides: Partial<Message> = {}): Message => ({
    id,
    conversationId: 'conv-1',
    createdAt,
    role: Role.User,
    ...overrides,
});

describe('getConversationPreview', () => {
    it('returns the stripped, truncated content of the first message with text', () => {
        const messages = [createTestMessage('m1', '2026-07-22T00:00:00.000Z', { content: '**Budget** planning tips' })];

        expect(getConversationPreview(messages, {})).toBe('Budget planning tips');
    });

    it('takes messages in the order given (caller is responsible for newest-first ordering)', () => {
        const messages = [
            createTestMessage('newest', '2026-07-22T00:00:00.000Z', { content: 'Newest message' }),
            createTestMessage('oldest', '2026-07-01T00:00:00.000Z', { content: 'Oldest message' }),
        ];

        expect(getConversationPreview(messages, {})).toBe('Newest message');
    });

    it('falls back to an image label when the message has no text but has an image attachment', () => {
        const messages = [
            createTestMessage('m1', '2026-07-22T00:00:00.000Z', {
                attachments: [{ id: 'att-1', mimeType: 'image/png' } as AttachmentMap[string]],
            }),
        ];

        expect(getConversationPreview(messages, {})).toBe('Image');
    });

    it('falls back to a file-attached label when the message has a non-image attachment', () => {
        const messages = [
            createTestMessage('m1', '2026-07-22T00:00:00.000Z', {
                attachments: [{ id: 'att-1', mimeType: 'application/pdf' } as AttachmentMap[string]],
            }),
        ];

        expect(getConversationPreview(messages, {})).toBe('File attached');
    });

    it('returns an empty string when there are no messages', () => {
        expect(getConversationPreview([], {})).toBe('');
    });
});
