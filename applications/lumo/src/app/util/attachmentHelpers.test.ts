import type { Attachment } from '../types';
import {
    findReusableSpaceAttachments,
    isAttachmentRemovedFromProjectKnowledge,
    isFileInProjectKnowledge,
    isProjectKnowledgeAttachment,
} from './attachmentHelpers';

describe('findReusableSpaceAttachments', () => {
    const stored: Attachment = {
        id: 'stored-1',
        filename: 'GeneralForm.razor',
        uploadedAt: '2026-01-01T00:00:00.000Z',
        spaceId: 'space-1',
        markdown: '<h1>Form</h1>',
    };
    const upload = (overrides: Partial<Attachment> = {}): Attachment => ({
        id: 'upload-1',
        filename: 'GeneralForm.razor',
        uploadedAt: '2026-01-02T00:00:00.000Z',
        markdown: '<h1>Form</h1>',
        ...overrides,
    });
    const onServer = () => true;

    it('reuses a stored file with the same filename and content', () => {
        const result = findReusableSpaceAttachments([upload()], { [stored.id]: stored }, 'space-1', onServer);
        expect(result.get('upload-1')).toBe(stored);
    });

    it('does not reuse when the content differs', () => {
        const result = findReusableSpaceAttachments(
            [upload({ markdown: '<h1>Edited</h1>' })],
            { [stored.id]: stored },
            'space-1',
            onServer
        );
        expect(result.size).toBe(0);
    });

    it('does not reuse when the filename differs', () => {
        const result = findReusableSpaceAttachments(
            [upload({ filename: 'Other.razor' })],
            { [stored.id]: stored },
            'space-1',
            onServer
        );
        expect(result.size).toBe(0);
    });

    it('does not reuse files from another space', () => {
        const result = findReusableSpaceAttachments([upload()], { [stored.id]: stored }, 'space-2', onServer);
        expect(result.size).toBe(0);
    });

    it('does not reuse files that are not on the server yet', () => {
        const result = findReusableSpaceAttachments([upload()], { [stored.id]: stored }, 'space-1', () => false);
        expect(result.size).toBe(0);
    });

    it('does not reuse auto-retrieved copies', () => {
        const result = findReusableSpaceAttachments(
            [upload()],
            { [stored.id]: { ...stored, autoRetrieved: true } },
            'space-1',
            onServer
        );
        expect(result.size).toBe(0);
    });

    it('ignores images and attachments already assigned to a space', () => {
        const result = findReusableSpaceAttachments(
            [upload({ id: 'image-1', mimeType: 'image/png' }), upload({ id: 'assigned-1', spaceId: 'space-1' })],
            { [stored.id]: stored },
            'space-1',
            onServer
        );
        expect(result.size).toBe(0);
    });
});

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
