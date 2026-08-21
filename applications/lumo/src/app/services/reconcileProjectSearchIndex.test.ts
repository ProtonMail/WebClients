import type { Attachment } from '../types';
import type { DriveDocument } from '../types/documents';
import {
    buildProjectKnowledgeSnapshot,
    findStaleProjectDocumentIds,
    type Project,
    type ProjectKnowledgeSnapshot,
} from './reconcileProjectSearchIndex';

const createDriveDoc = (overrides: Partial<DriveDocument> & Pick<DriveDocument, 'id' | 'spaceId'>): DriveDocument => ({
    name: 'doc.pdf',
    content: 'content',
    mimeType: 'application/pdf',
    size: 100,
    modifiedTime: 1,
    folderId: 'folder-1',
    folderPath: 'My Files / Project',
    ...overrides,
});

describe('findStaleProjectDocumentIds', () => {
    const projectWithoutDrive: ProjectKnowledgeSnapshot = {
        spaceId: 'project-1',
        hasLinkedDriveFolder: false,
        uploadedAttachmentIds: new Set(['upload-1']),
    };

    const projectWithDrive: ProjectKnowledgeSnapshot = {
        spaceId: 'project-2',
        hasLinkedDriveFolder: true,
        uploadedAttachmentIds: new Set(),
    };

    it('flags Drive docs when the project no longer has a linked folder', () => {
        const documents = [
            createDriveDoc({ id: 'drive-1', spaceId: 'project-1', folderPath: 'My Files / House Transfer' }),
            createDriveDoc({ id: 'upload-1', spaceId: 'project-1', folderPath: 'Uploaded Files' }),
        ];

        expect(findStaleProjectDocumentIds(documents, [projectWithoutDrive])).toEqual(['drive-1']);
    });

    it('flags uploaded docs when the attachment no longer exists', () => {
        const documents = [
            createDriveDoc({ id: 'upload-1', spaceId: 'project-1', folderPath: 'Uploaded Files' }),
            createDriveDoc({ id: 'upload-2', spaceId: 'project-1', folderPath: 'Uploaded Files' }),
        ];

        expect(findStaleProjectDocumentIds(documents, [projectWithoutDrive])).toEqual(['upload-2']);
    });

    it('flags uploaded chunks when the parent attachment no longer exists', () => {
        const documents = [
            createDriveDoc({
                id: 'upload-1-chunk-0',
                spaceId: 'project-1',
                folderPath: 'Uploaded Files',
                parentDocumentId: 'upload-1',
                isChunk: true,
            }),
            createDriveDoc({
                id: 'upload-2-chunk-0',
                spaceId: 'project-1',
                folderPath: 'Uploaded Files',
                parentDocumentId: 'upload-2',
                isChunk: true,
            }),
        ];

        expect(findStaleProjectDocumentIds(documents, [projectWithoutDrive])).toEqual(['upload-2-chunk-0']);
    });

    it('keeps Drive docs when the project still has a linked folder', () => {
        const documents = [createDriveDoc({ id: 'drive-1', spaceId: 'project-2' })];

        expect(findStaleProjectDocumentIds(documents, [projectWithDrive])).toEqual([]);
    });
});

describe('buildProjectKnowledgeSnapshot', () => {
    it('includes only uploaded project attachments', () => {
        const project = {
            id: 'project-1',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            spaceKey: 'space-key',
            isProject: true,
            projectName: 'EU RFI',
        } satisfies Project;

        const snapshot = buildProjectKnowledgeSnapshot(project, {
            'upload-1': {
                id: 'upload-1',
                spaceId: 'project-1',
                filename: 'notes.txt',
                uploadedAt: '2026-01-01T00:00:00.000Z',
                markdown: 'hello',
            },
            'auto-1': {
                id: 'auto-1',
                spaceId: 'project-1',
                filename: 'Summary.pdf',
                uploadedAt: '2026-01-01T00:00:00.000Z',
                markdown: 'summary',
                autoRetrieved: true,
                driveNodeId: 'drive-node-1',
            },
            'drive-1': {
                id: 'drive-1',
                spaceId: 'project-1',
                filename: 'Summary.pdf',
                uploadedAt: '2026-01-01T00:00:00.000Z',
                markdown: 'summary',
                driveNodeId: 'drive-node-1',
            },
        } satisfies Record<string, Attachment>);

        expect(snapshot.hasLinkedDriveFolder).toBe(false);
        expect(Array.from(snapshot.uploadedAttachmentIds)).toEqual(['upload-1']);
    });
});
