import { SearchService } from '../services/search/searchService';
import type { Attachment } from '../types';
import {
    dedupeAttachmentsByDocumentKey,
    fillAttachmentFromSearchIndex,
    referencedFileNamesWithContent,
    refreshAttachmentFromSearchIndex,
    resolveReferencedFilesForSend,
} from './resolveProjectFiles';

jest.mock('../services/search/searchService');

describe('resolveProjectFiles', () => {
    const mockEnsureManifestReady = jest.fn().mockResolvedValue(undefined);
    const mockRetrieveDocumentForMention = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (SearchService.get as jest.Mock).mockReturnValue({
            ensureManifestReady: mockEnsureManifestReady,
            retrieveDocumentForMention: mockRetrieveDocumentForMention,
        });
    });

    describe('fillAttachmentFromSearchIndex', () => {
        it('fills markdown from the search index by filename', () => {
            mockRetrieveDocumentForMention.mockReturnValue({
                id: 'drive-node-1',
                name: 'Lines.txt',
                content: 'Line one\nLine six',
                size: 20,
                isDriveDocument: true,
            });

            const attachment: Attachment = {
                id: 'att-1',
                filename: 'Lines.txt',
                uploadedAt: new Date().toISOString(),
                conversationContext: true,
            };

            const filled = fillAttachmentFromSearchIndex(
                attachment,
                SearchService.get('user-1'),
                'space-1',
                'summarize the lines'
            );
            expect(filled.markdown).toBe('Line one\nLine six');
            expect(filled.driveNodeId).toBe('drive-node-1');
            expect(mockRetrieveDocumentForMention).toHaveBeenCalledWith(
                'Lines.txt',
                'space-1',
                'summarize the lines',
                undefined
            );
        });

        it('returns best matching chunk for large indexed files', () => {
            mockRetrieveDocumentForMention.mockReturnValue({
                id: 'local-file-1',
                name: 'report.pdf',
                content: 'Relevant section only',
                size: 5000,
                isDriveDocument: false,
                isChunk: true,
                chunkTitle: 'Financial Summary',
            });

            const attachment: Attachment = {
                id: 'att-2',
                filename: 'report.pdf',
                uploadedAt: new Date().toISOString(),
            };

            const filled = fillAttachmentFromSearchIndex(
                attachment,
                SearchService.get('user-1'),
                'space-1',
                'what are the financial results?'
            );

            expect(filled.markdown).toBe('Relevant section only');
            expect(filled.isChunk).toBe(true);
            expect(filled.chunkTitle).toBe('Financial Summary');
            expect(filled.driveNodeId).toBeUndefined();
        });

        it('fills processing Drive attachments from the index', () => {
            mockRetrieveDocumentForMention.mockReturnValue({
                id: 'drive-node-2',
                name: 'pending.txt',
                content: 'Indexed while downloading',
                isDriveDocument: true,
            });

            const attachment: Attachment = {
                id: 'att-3',
                filename: 'pending.txt',
                uploadedAt: new Date().toISOString(),
                processing: true,
                driveNodeId: 'drive-node-2',
                conversationContext: true,
            };

            const filled = fillAttachmentFromSearchIndex(
                attachment,
                SearchService.get('user-1'),
                'space-1',
                'read pending file'
            );

            expect(filled.markdown).toBe('Indexed while downloading');
            expect(filled.processing).toBe(false);
        });

        it('returns unchanged attachment when index has no match', () => {
            mockRetrieveDocumentForMention.mockReturnValue(null);

            const attachment: Attachment = {
                id: 'att-4',
                filename: 'missing.txt',
                uploadedAt: new Date().toISOString(),
            };

            const filled = fillAttachmentFromSearchIndex(
                attachment,
                SearchService.get('user-1'),
                'space-1',
                'find missing'
            );

            expect(filled.markdown).toBeUndefined();
        });
    });

    describe('refreshAttachmentFromSearchIndex', () => {
        it('overwrites stale markdown from the search index', () => {
            mockRetrieveDocumentForMention.mockReturnValue({
                id: 'drive-node-1',
                name: 'colours.txt',
                content: 'Orange\nRed\nBlue',
                size: 20,
                isDriveDocument: true,
            });

            const attachment: Attachment = {
                id: 'att-1',
                filename: 'colours.txt',
                uploadedAt: new Date().toISOString(),
                markdown: 'stale',
                driveNodeId: 'drive-node-1',
                conversationContext: true,
            };

            const refreshed = refreshAttachmentFromSearchIndex(
                attachment,
                SearchService.get('user-1'),
                'space-1',
                'list the colours'
            );
            expect(refreshed.markdown).toBe('Orange\nRed\nBlue');
        });

        it('does not replace markdown on direct user uploads', () => {
            const attachment: Attachment = {
                id: 'att-1',
                filename: 'notes.txt',
                uploadedAt: new Date().toISOString(),
                markdown: 'full uploaded content',
                spaceId: 'space-1',
            };

            const refreshed = refreshAttachmentFromSearchIndex(
                attachment,
                SearchService.get('user-1'),
                'space-1',
                'summarize notes'
            );

            expect(refreshed.markdown).toBe('full uploaded content');
            expect(mockRetrieveDocumentForMention).not.toHaveBeenCalled();
        });
    });

    describe('resolveReferencedFilesForSend', () => {
        it('creates a fresh attachment for a text-only @mention', async () => {
            mockRetrieveDocumentForMention.mockReturnValue({
                id: 'drive-node-1',
                name: 'colours.txt',
                content: 'Orange\nRed',
                size: 15,
                isDriveDocument: true,
            });

            const resolved = await resolveReferencedFilesForSend(
                'what is in @colours.txt ?',
                [],
                'user-1',
                'space-1'
            );

            expect(mockEnsureManifestReady).toHaveBeenCalled();
            expect(resolved).toHaveLength(1);
            expect(resolved[0]?.markdown).toBe('Orange\nRed');
            expect(resolved[0]?.conversationContext).toBe(true);
            expect(mockRetrieveDocumentForMention).toHaveBeenCalledWith(
                'colours.txt',
                'space-1',
                'what is in @colours.txt ?',
                undefined
            );
        });

        it('refreshes an existing attachment from the search index', async () => {
            mockRetrieveDocumentForMention.mockReturnValue({
                id: 'drive-node-1',
                name: 'Lines.txt',
                content: 'fresh content',
                size: 13,
                isDriveDocument: true,
            });

            const existing: Attachment[] = [
                {
                    id: 'att-1',
                    filename: 'Lines.txt',
                    uploadedAt: new Date().toISOString(),
                    markdown: 'stale content',
                    driveNodeId: 'drive-node-1',
                    conversationContext: true,
                },
            ];

            const resolved = await resolveReferencedFilesForSend(
                'Please read @Lines.txt again',
                existing,
                'user-1',
                'space-1'
            );

            expect(resolved).toHaveLength(0);
            expect(existing[0]?.markdown).toBe('fresh content');
        });

        it('skips creating a duplicate when the file was already auto-retrieved', async () => {
            mockRetrieveDocumentForMention.mockReturnValue({
                id: 'drive-node-1',
                name: 'Corporate API Documentation_.pdf',
                content: 'API docs',
                size: 100,
                isDriveDocument: true,
            });

            const conversationAttachments: Attachment[] = [
                {
                    id: 'att-auto',
                    filename: 'Corporate API Documentation_.pdf',
                    uploadedAt: new Date().toISOString(),
                    markdown: 'Already retrieved content',
                    driveNodeId: 'drive-node-1',
                    autoRetrieved: true,
                },
            ];

            const resolved = await resolveReferencedFilesForSend(
                'using @Corporate API Documentation_.pdf can you create a plan?',
                [],
                'user-1',
                'space-1',
                conversationAttachments
            );

            expect(resolved).toHaveLength(0);
        });
    });

    describe('referencedFileNamesWithContent', () => {
        it('only excludes @mentions that have content on the message', () => {
            const names = referencedFileNamesWithContent('read @colours.txt', [
                { id: '1', filename: 'colours.txt', uploadedAt: '', markdown: 'Orange' },
            ]);
            expect(names.has('colours.txt')).toBe(true);

            const empty = referencedFileNamesWithContent('read @colours.txt', [
                { id: '1', filename: 'colours.txt', uploadedAt: '' },
            ]);
            expect(empty.has('colours.txt')).toBe(false);
        });

        it('includes auto-retrieved files from earlier messages', () => {
            const names = referencedFileNamesWithContent(
                'using @Corporate API Documentation_.pdf create a plan',
                [],
                [
                    {
                        id: 'att-auto',
                        filename: 'Corporate API Documentation_.pdf',
                        uploadedAt: '',
                        markdown: 'API docs',
                        autoRetrieved: true,
                        driveNodeId: 'drive-node-1',
                    },
                ]
            );

            expect(names.has('corporate api documentation_.pdf')).toBe(true);
        });
    });

    describe('dedupeAttachmentsByDocumentKey', () => {
        it('prefers auto-retrieved copies when the same document appears twice', () => {
            const deduped = dedupeAttachmentsByDocumentKey([
                {
                    id: 'manual',
                    filename: 'Corporate API Documentation_.pdf',
                    uploadedAt: '',
                    driveNodeId: 'drive-node-1',
                },
                {
                    id: 'auto',
                    filename: 'Corporate API Documentation_.pdf',
                    uploadedAt: '',
                    driveNodeId: 'drive-node-1',
                    autoRetrieved: true,
                },
            ]);

            expect(deduped).toHaveLength(1);
            expect(deduped[0]?.id).toBe('auto');
        });
    });
});
