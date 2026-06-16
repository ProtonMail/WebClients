import type { Author, NodeEntity, Revision } from '@proton/drive';
import { MemberRole, NodeType, RevisionState } from '@proton/drive';

import { getNodeDisplaySize } from './getNodeDisplaySize';

describe('getNodeDisplaySize', () => {
    const mockAuthor: Author = {
        ok: true,
        value: 'test-author@proton.me',
    };

    const mockRevision: Revision = {
        uid: 'revision-uid-1',
        state: RevisionState.Active,
        creationTime: new Date('2023-01-01'),
        contentAuthor: mockAuthor,
        storageSize: 2048,
        claimedSize: 1500,
        claimedModificationTime: new Date('2023-01-01'),
        claimedDigests: { sha1: 'abc123', sha1Verified: false },
        claimedAdditionalMetadata: {},
    };

    const mockNodeEntity: NodeEntity = {
        uid: 'node-uid-1',
        parentUid: 'parent-uid-1',
        name: { ok: true, value: 'test-file.txt' },
        keyAuthor: mockAuthor,
        nameAuthor: mockAuthor,
        directRole: MemberRole.Admin,
        type: NodeType.File,
        mediaType: 'text/plain',
        isShared: false,
        isSharedPublicly: false,
        creationTime: new Date('2023-01-01'),
        modificationTime: new Date('2023-01-01'),
        trashTime: undefined,
        totalStorageSize: 3000,
        activeRevision: { ok: true, value: mockRevision },
        folder: undefined,
        treeEventScopeId: 'tree-event-scope-id',
        ownedBy: {},
    };

    it('should return claimedSize when available', () => {
        const result = getNodeDisplaySize(mockNodeEntity);

        expect(result).toBe(1500);
    });

    it('should return storageSize when claimedSize is not available', () => {
        const node: NodeEntity = {
            ...mockNodeEntity,
            activeRevision: { ok: true, value: { ...mockRevision, claimedSize: undefined } },
        };

        const result = getNodeDisplaySize(node);

        expect(result).toBe(2048);
    });

    it('should return totalStorageSize when activeRevision is undefined', () => {
        const node: NodeEntity = {
            ...mockNodeEntity,
            activeRevision: undefined,
        };

        const result = getNodeDisplaySize(node);

        expect(result).toBe(3000);
    });

    it('should handle error nodes with activeRevision', () => {
        const node: NodeEntity = {
            ...mockNodeEntity,
            activeRevision: {
                ok: true,
                value: mockRevision,
            },
        };

        const result = getNodeDisplaySize(node);

        expect(result).toBe(1500);
    });

    it('should return totalStorageSize when activeRevision has error', () => {
        const node: NodeEntity = {
            ...mockNodeEntity,
            activeRevision: {
                ok: false,
                error: new Error('Revision error'),
            },
        };

        const result = getNodeDisplaySize(node);

        expect(result).toBe(3000);
    });
});
