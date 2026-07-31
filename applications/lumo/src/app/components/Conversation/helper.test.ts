import type { Attachment } from '../../types';
import { mergeConversationAttachmentsForTurns } from './helper';

describe('mergeConversationAttachmentsForTurns', () => {
    it('replaces stale provisionals with send-time resolved attachments that share the same id', () => {
        const stale: Attachment = {
            id: 'mention-1',
            filename: 'report.docx',
            uploadedAt: '2026-01-01T00:00:00.000Z',
            rawBytes: 0,
        };
        const resolved: Attachment = {
            ...stale,
            markdown: 'Converted docx content',
            tokenCount: 10,
        };

        const merged = mergeConversationAttachmentsForTurns([stale], [resolved]);

        expect(merged).toHaveLength(1);
        expect(merged[0]?.markdown).toBe('Converted docx content');
    });

    it('appends newly resolved attachments that were not in the existing context', () => {
        const existing: Attachment = {
            id: 'upload-1',
            filename: 'notes.txt',
            uploadedAt: '2026-01-01T00:00:00.000Z',
            markdown: 'notes',
        };
        const resolvedFromMention: Attachment = {
            id: 'mention-2',
            filename: 'report.docx',
            uploadedAt: '2026-01-01T00:00:00.000Z',
            markdown: 'Converted docx content',
            conversationContext: true,
        };

        const merged = mergeConversationAttachmentsForTurns([existing], [existing, resolvedFromMention]);

        expect(merged).toHaveLength(2);
        expect(merged[1]?.id).toBe('mention-2');
        expect(merged[1]?.markdown).toBe('Converted docx content');
    });
});
