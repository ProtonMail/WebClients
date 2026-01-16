import type { Author, MaybeNode, NodeEntity, Revision } from '@proton/drive';
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
        claimedDigests: { sha1: 'abc123' },
        claimedAdditionalMetadata: {},
    };

    const mockNodeEntity: NodeEntity = {
        uid: 'node-uid-1',
        parentUid: 'parent-uid-1',
        name: 'test-file.txt',
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
        activeRevision: mockRevision,
        folder: undefined,
        treeEventScopeId: 'tree-event-scope-id',
    };

    it('should return claimedSize when available', () => {
        const maybeNode: MaybeNode = {
            ok: true,
            value: mockNodeEntity,
        };

        const result = getNodeDisplaySize(maybeNode);

        expect(result).toBe(1500);
    });

    it('should return storageSize when claimedSize is not available', () => {
        const maybeNode: MaybeNode = {
            ok: true,
            value: {
                ...mockNodeEntity,
                activeRevision: { ...mockRevision, claimedSize: undefined },
            },
        };

        const result = getNodeDisplaySize(maybeNode);

        expect(result).toBe(2048);
    });

    it('should return totalStorageSize when activeRevision is undefined', () => {
        const maybeNode: MaybeNode = {
            ok: true,
            value: {
                ...mockNodeEntity,
                activeRevision: undefined,
            },
        };

        const result = getNodeDisplaySize(maybeNode);

        expect(result).toBe(3000);
    });

    it('should handle error nodes with activeRevision', () => {
        const maybeNode: MaybeNode = {
            ok: false,
            error: {
                ...mockNodeEntity,
                name: {
                    ok: true,
                    value: mockNodeEntity.name,
                },
                activeRevision: {
                    ok: true,
                    value: mockRevision,
                },
            },
        };

        const result = getNodeDisplaySize(maybeNode);

        expect(result).toBe(1500);
    });

    it('should return totalStorageSize when activeRevision has error', () => {
        const maybeNode: MaybeNode = {
            ok: false,
            error: {
                ...mockNodeEntity,
                name: {
                    ok: true,
                    value: mockNodeEntity.name,
                },
                activeRevision: {
                    ok: false,
                    error: new Error('Revision error'),
                },
            },
        };

        const result = getNodeDisplaySize(maybeNode);

        expect(result).toBe(3000);
    });
});
