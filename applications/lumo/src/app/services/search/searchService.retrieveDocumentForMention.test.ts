import type { DriveDocument } from '../../types/documents';
import { SearchService } from './searchService';

const SPACE_ID = 'space-mention-test';

function makeDoc(overrides: Partial<DriveDocument>): DriveDocument {
    return {
        id: 'doc-1',
        name: 'file.txt',
        content: 'default content for search indexing',
        mimeType: 'text/plain',
        size: 100,
        modifiedTime: Date.now(),
        folderId: SPACE_ID,
        folderPath: 'Uploaded Files',
        spaceId: SPACE_ID,
        ...overrides,
    };
}

describe('SearchService.retrieveDocumentForMention', () => {
    let searchService: SearchService;

    beforeEach(async () => {
        // No userId → in-memory only, no IndexedDB persistence side effects
        searchService = SearchService.get();
        await searchService.indexDocuments([
            makeDoc({
                id: 'small-doc',
                name: 'notes.txt',
                content: 'Meeting notes from the planning session',
            }),
            makeDoc({
                id: 'local-att-1',
                name: 'upload.txt',
                content: 'Uploaded project file content',
            }),
            makeDoc({
                id: 'drive-node-1',
                name: 'drive.txt',
                content: 'Drive file indexed content',
                folderPath: 'Drive/Projects',
            }),
            makeDoc({
                id: 'parent-1__chunk_0',
                name: 'report.pdf',
                content:
                    'Introduction overview summary background information about the company history and founding story',
                isChunk: true,
                parentDocumentId: 'parent-1',
                chunkIndex: 0,
                chunkTitle: 'Introduction',
            }),
            makeDoc({
                id: 'parent-1__chunk_1',
                name: 'report.pdf',
                content:
                    'Financial results quarterly revenue earnings profit margins fiscal performance metrics annual report',
                isChunk: true,
                parentDocumentId: 'parent-1',
                chunkIndex: 1,
                chunkTitle: 'Financial Summary',
            }),
        ]);
    });

    it('returns the full document when it is not chunked', () => {
        const result = searchService.retrieveDocumentForMention('notes.txt', SPACE_ID, 'planning meeting');

        expect(result).not.toBeNull();
        expect(result?.content).toContain('Meeting notes');
        expect(result?.isChunk).toBeUndefined();
        expect(result?.isDriveDocument).toBe(false);
    });

    it('returns the best matching chunk rather than the first chunk', () => {
        const result = searchService.retrieveDocumentForMention(
            'report.pdf',
            SPACE_ID,
            'what were the financial results and quarterly revenue'
        );

        expect(result).not.toBeNull();
        expect(result?.isChunk).toBe(true);
        expect(result?.chunkTitle).toBe('Financial Summary');
        expect(result?.content).toContain('Financial results');
        expect(result?.content).not.toContain('company history');
    });

    it('does not stitch all chunks together for chunked documents', () => {
        const result = searchService.retrieveDocumentForMention('report.pdf', SPACE_ID, 'financial quarterly revenue');

        expect(result).not.toBeNull();
        expect(result?.content).not.toContain('company history');
        expect(result?.content).not.toContain('founding story');
    });

    it('resolves a local upload by attachment id', () => {
        const result = searchService.retrieveDocumentForMention(
            'upload.txt',
            SPACE_ID,
            'uploaded content',
            'local-att-1'
        );

        expect(result?.id).toBe('local-att-1');
        expect(result?.content).toBe('Uploaded project file content');
        expect(result?.isDriveDocument).toBe(false);
    });

    it('resolves a Drive file by node id', () => {
        const result = searchService.retrieveDocumentForMention(
            'drive.txt',
            SPACE_ID,
            'drive content',
            'drive-node-1'
        );

        expect(result?.id).toBe('drive-node-1');
        expect(result?.isDriveDocument).toBe(true);
    });

    it('returns null when the document is not in the index', () => {
        const result = searchService.retrieveDocumentForMention('missing.pdf', SPACE_ID, 'anything');

        expect(result).toBeNull();
    });

    it('returns null for name lookup when spaceId is omitted', () => {
        const result = searchService.retrieveDocumentForMention('notes.txt', undefined, 'planning');

        expect(result).toBeNull();
    });

    it('can resolve by document id without spaceId', () => {
        const result = searchService.retrieveDocumentForMention('ignored.txt', undefined, 'drive', 'drive-node-1');

        expect(result?.id).toBe('drive-node-1');
        expect(result?.content).toBe('Drive file indexed content');
    });
});
