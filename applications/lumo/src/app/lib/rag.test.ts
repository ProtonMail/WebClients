import { SearchService } from '../services/search/searchService';
import type { Attachment, Message } from '../types';
import { Role } from '../types';
import {
    collectContextAttachmentIds,
    planRagAttachmentStorage,
    retrieveDocumentContextForProject,
} from './rag';

jest.mock('../services/search/searchService');

const testMessage = (overrides: Partial<Message> & Pick<Message, 'id' | 'role'>): Message => ({
    createdAt: new Date().toISOString(),
    conversationId: 'conv-1',
    content: '',
    ...overrides,
});

describe('planRagAttachmentStorage', () => {
    const baseAttachment = (overrides: Partial<Attachment>): Attachment => ({
        id: 'att-1',
        filename: 'file.txt',
        uploadedAt: new Date().toISOString(),
        ...overrides,
    });

    it('skips upsert when the attachment id already exists in Redux', () => {
        const attachment = baseAttachment({ id: 'existing-1', autoRetrieved: true });
        const result = planRagAttachmentStorage([attachment], {
            'existing-1': baseAttachment({ id: 'existing-1' }),
        });

        expect(result.toUpsert).toHaveLength(0);
        expect(result.toPushIds).toHaveLength(0);
    });

    it('plans upsert without push for auto-retrieved Drive attachments', () => {
        const attachment = baseAttachment({ id: 'drive-1', autoRetrieved: true, driveNodeId: 'node-1' });
        const result = planRagAttachmentStorage([attachment], {});

        expect(result.toUpsert).toEqual([attachment]);
        expect(result.toPushIds).toHaveLength(0);
    });

    it('plans upsert and push for non-auto-retrieved attachments', () => {
        const attachment = baseAttachment({ id: 'upload-1', autoRetrieved: false });
        const result = planRagAttachmentStorage([attachment], {});

        expect(result.toUpsert).toEqual([attachment]);
        expect(result.toPushIds).toEqual(['upload-1']);
    });
});

describe('collectContextAttachmentIds', () => {
    it('collects unique attachment ids from the message chain', () => {
        const chain: Message[] = [
            testMessage({
                id: 'msg-1',
                role: Role.User,
                content: 'hello',
                attachments: [{ id: 'att-1', filename: 'a.txt', uploadedAt: '' }],
            }),
            testMessage({
                id: 'msg-2',
                role: Role.Assistant,
                content: 'hi',
                attachments: [{ id: 'att-1', filename: 'a.txt', uploadedAt: '' }],
            }),
        ];

        expect(collectContextAttachmentIds(chain)).toEqual(['att-1']);
    });

    it('respects context filters that exclude files', () => {
        const chain: Message[] = [
            testMessage({
                id: 'msg-1',
                role: Role.User,
                content: 'hello',
                attachments: [
                    { id: 'att-1', filename: 'keep.txt', uploadedAt: '' },
                    { id: 'att-2', filename: 'skip.txt', uploadedAt: '' },
                ],
            }),
        ];

        const ids = collectContextAttachmentIds(chain, [
            { messageId: 'msg-1', excludedFiles: ['skip.txt'] },
        ]);

        expect(ids).toEqual(['att-1']);
    });
});

describe('retrieveDocumentContextForProject', () => {
    const mockRetrieveForRAG = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (SearchService.get as jest.Mock).mockReturnValue({
            retrieveForRAG: mockRetrieveForRAG,
            formatRAGContext: SearchService.formatRAGContext,
        });
    });

    it('returns undefined when not a project', async () => {
        const result = await retrieveDocumentContextForProject('query', 'space-1', 'user-1', false);
        expect(result).toBeUndefined();
        expect(mockRetrieveForRAG).not.toHaveBeenCalled();
    });

    it('reuses an existing uploaded project attachment when RAG retrieves it', async () => {
        mockRetrieveForRAG.mockResolvedValue([
            {
                id: 'upload-1',
                name: 'project.txt',
                content: 'Relevant chunk content',
                score: 8,
            },
        ]);

        const result = await retrieveDocumentContextForProject(
            'summarize project',
            'space-1',
            'user-1',
            true,
            [],
            {
                'upload-1': {
                    id: 'upload-1',
                    filename: 'project.txt',
                    uploadedAt: new Date().toISOString(),
                    spaceId: 'space-1',
                    markdown: 'full original content',
                },
            }
        );

        expect(result?.attachments).toHaveLength(1);
        expect(result?.attachments[0]?.id).toBe('upload-1');
        expect(result?.attachments[0]?.markdown).toBe('Relevant chunk content');
        expect(result?.attachments[0]?.autoRetrieved).toBe(true);
    });

    it('creates a new auto-retrieved attachment for Drive documents', async () => {
        mockRetrieveForRAG.mockResolvedValue([
            {
                id: 'drive-node-1',
                name: 'drive.txt',
                content: 'Drive chunk',
                score: 6,
            },
        ]);

        const result = await retrieveDocumentContextForProject('query', 'space-1', 'user-1', true);

        expect(result?.attachments).toHaveLength(1);
        const attachment = result!.attachments[0]!;
        expect(attachment.id).not.toBe('drive-node-1');
        expect(attachment.driveNodeId).toBe('drive-node-1');
        expect(attachment.autoRetrieved).toBe(true);
        expect(attachment.markdown).toBe('Drive chunk');
    });

    it('excludes @mentioned files from RAG retrieval', async () => {
        mockRetrieveForRAG.mockResolvedValue([
            {
                id: 'drive-node-1',
                name: 'mentioned.txt',
                content: 'Should be excluded',
                score: 10,
            },
        ]);

        const result = await retrieveDocumentContextForProject(
            'query',
            'space-1',
            'user-1',
            true,
            [],
            {},
            new Set(['mentioned.txt'])
        );

        expect(result).toBeUndefined();
    });

    it('filters out low-scoring documents using relevance thresholds', async () => {
        mockRetrieveForRAG.mockResolvedValue([
            { id: 'doc-1', name: 'high.txt', content: 'top', score: 10 },
            { id: 'doc-2', name: 'mid.txt', content: 'middle', score: 9 },
            { id: 'doc-3', name: 'low.txt', content: 'weak', score: 0.1 },
        ]);

        const result = await retrieveDocumentContextForProject('query', 'space-1', 'user-1', true);

        expect(result?.attachments.map((a) => a.filename)).toEqual(['high.txt']);
    });

    it('includes multiple documents when they share the top relevance tier', async () => {
        mockRetrieveForRAG.mockResolvedValue([
            { id: 'doc-1', name: 'high-a.txt', content: 'top a', score: 10 },
            { id: 'doc-2', name: 'high-b.txt', content: 'top b', score: 10 },
            { id: 'doc-3', name: 'low.txt', content: 'weak', score: 0.1 },
        ]);

        const result = await retrieveDocumentContextForProject('query', 'space-1', 'user-1', true);

        expect(result?.attachments.map((a) => a.filename).sort()).toEqual(['high-a.txt', 'high-b.txt']);
    });

    it('skips documents already retrieved in the conversation', async () => {
        mockRetrieveForRAG.mockResolvedValue([
            { id: 'drive-node-1', name: 'seen.txt', content: 'already used', score: 10 },
        ]);

        const messageChain: Message[] = [
            testMessage({
                id: 'msg-1',
                role: Role.User,
                content: 'first',
                attachments: [{ id: 'att-prev', filename: 'seen.txt', uploadedAt: '' }],
            }),
        ];

        const result = await retrieveDocumentContextForProject('query', 'space-1', 'user-1', true, messageChain, {
            'att-prev': {
                id: 'att-prev',
                filename: 'seen.txt',
                uploadedAt: new Date().toISOString(),
                autoRetrieved: true,
                driveNodeId: 'drive-node-1',
            },
        });

        expect(result).toBeUndefined();
    });
});
