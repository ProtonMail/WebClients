import type { Attachment } from '../types';
import {
    isAttachmentRemovedFromProjectKnowledge,
    isFileInProjectKnowledge,
    isProjectKnowledgeAttachment,
} from './attachmentHelpers';

describe('attachmentHelpers — project knowledge', () => {
    const projectFile: Attachment = {
        id: 'space-file-1',
        filename: 'report.docx',
        uploadedAt: '2026-01-01T00:00:00.000Z',
        spaceId: 'space-1',
        markdown: 'Project copy',
    };

    const spaceAttachments = { [projectFile.id]: projectFile };

    it('detects project knowledge attachments', () => {
        expect(isProjectKnowledgeAttachment({ ...projectFile, autoRetrieved: true })).toBe(true);
        expect(isProjectKnowledgeAttachment({ id: 'x', filename: 'a.txt', uploadedAt: '', conversationContext: true }))
            .toBe(true);
        expect(isProjectKnowledgeAttachment({ id: 'x', filename: 'a.txt', uploadedAt: '' })).toBe(false);
    });

    it('matches project files by filename', () => {
        expect(
            isFileInProjectKnowledge({ filename: 'report.docx' }, spaceAttachments)
        ).toBe(true);
        expect(
            isFileInProjectKnowledge({ filename: 'missing.docx' }, spaceAttachments)
        ).toBe(false);
    });

    it('reports removed project knowledge when the file is gone and content is unavailable', () => {
        const mentionedAttachment: Attachment = {
            id: 'mention-1',
            filename: 'report.docx',
            uploadedAt: '2026-01-01T00:00:00.000Z',
            conversationContext: true,
        };

        expect(
            isAttachmentRemovedFromProjectKnowledge(mentionedAttachment, {}, 'space-1')
        ).toBe(true);
    });

    it('does not report removed when the file is still in project knowledge', () => {
        const mentionedAttachment: Attachment = {
            id: 'mention-1',
            filename: 'report.docx',
            uploadedAt: '2026-01-01T00:00:00.000Z',
            conversationContext: true,
        };

        expect(
            isAttachmentRemovedFromProjectKnowledge(mentionedAttachment, spaceAttachments, 'space-1')
        ).toBe(false);
    });

    it('does not report removed when preview content is still available', () => {
        const mentionedAttachment: Attachment = {
            id: 'mention-1',
            filename: 'report.docx',
            uploadedAt: '2026-01-01T00:00:00.000Z',
            conversationContext: true,
            markdown: 'Cached content',
        };

        expect(
            isAttachmentRemovedFromProjectKnowledge(mentionedAttachment, {}, 'space-1')
        ).toBe(false);
    });
});
