import { MemberRole, type NodeEntity, NodeType } from '@proton/drive/index';
import { PROTON_DOCS_DOCUMENT_MIMETYPE, PROTON_DOCS_SPREADSHEET_MIMETYPE } from '@proton/shared/lib/helpers/mimetype';

import { getIgnoreExtension } from './useRenameModalState';

export const mockNode = (overrides: Partial<NodeEntity> = {}): NodeEntity => ({
    uid: 'mock-uid',
    parentUid: 'parent-uid',
    name: 'mock-file.txt',
    keyAuthor: {
        ok: true,
        value: 'key-author-1',
    },
    nameAuthor: {
        ok: true,
        value: 'name-author-1',
    },
    directMemberRole: MemberRole.Admin,
    type: NodeType.File,
    mediaType: 'application/octet-stream',
    isShared: false,
    creationTime: new Date('2024-01-01T00:00:00Z'),
    trashTime: undefined,
    totalStorageSize: 12345,
    activeRevision: undefined,
    folder: {
        claimedModificationTime: new Date('2024-01-01T00:00:00Z'),
    },
    treeEventScopeId: 'tree-event-scope-id',
    ...overrides,
});

describe('getIgnoreExtension', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns true if node is null', () => {
        expect(getIgnoreExtension(null, 'file.docx')).toBe(true);
    });

    it('returns true if node is a folder', () => {
        expect(getIgnoreExtension(mockNode({ type: NodeType.Folder, mediaType: undefined }), 'folder')).toBe(true);
    });

    it('returns true if mediaType is Proton Docs', () => {
        expect(getIgnoreExtension(mockNode({ mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE }), 'file.docx')).toBe(true);
    });

    it('returns true if mediaType is Proton Sheets', () => {
        expect(getIgnoreExtension(mockNode({ mediaType: PROTON_DOCS_SPREADSHEET_MIMETYPE }), 'file.docx')).toBe(true);
    });

    it('returns true if name doesnt include an extension', () => {
        expect(getIgnoreExtension(mockNode({ mediaType: 'text/plain' }), '.txt')).toBe(true);
    });

    it('returns false in case of file with extention', () => {
        expect(getIgnoreExtension(mockNode({ mediaType: 'text/plain' }), 'file.txt')).toBe(false);
    });
});
