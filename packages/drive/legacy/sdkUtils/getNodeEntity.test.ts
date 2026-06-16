import type { Author, NodeEntity, Revision } from '@protontech/drive-sdk';
import { MemberRole, NodeType, RevisionState } from '@protontech/drive-sdk';

import { getNodeEntity } from './getNodeEntity';

describe('getNodeEntity', () => {
    const mockAuthor: Author = {
        ok: true,
        value: 'test-author@proton.me',
    };

    const mockRevision: Revision = {
        uid: 'revision-uid-1',
        state: RevisionState.Active,
        creationTime: new Date('2023-01-01'),
        contentAuthor: mockAuthor,
        storageSize: 1024,
        claimedSize: 1000,
        claimedModificationTime: new Date('2023-01-01'),
        claimedDigests: {
            sha1: 'abc123',
            sha1Verified: false,
        },
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
        totalStorageSize: 1024,
        activeRevision: { ok: true, value: mockRevision },
        folder: undefined,
        treeEventScopeId: 'tree-event-scope-id',
        ownedBy: {},
    };

    describe('when node has no errors', () => {
        it('should return normalized node with string name and no errors', () => {
            const result = getNodeEntity(mockNodeEntity);

            expect(result.node.name).toBe('test-file.txt');
            expect(result.node.activeRevision).toBe(mockRevision);
            expect(result.errors.size).toBe(0);
        });
    });

    describe('when node has errors', () => {
        it('should handle name error only', () => {
            const nameError = new Error('Name validation failed');
            const nodeWithNameError: NodeEntity = {
                ...mockNodeEntity,
                name: { ok: false, error: nameError },
                activeRevision: { ok: true, value: mockRevision },
            };

            const result = getNodeEntity(nodeWithNameError);

            expect(result.errors.has('name')).toBe(true);
            expect(result.errors.get('name')).toBe(nameError);
            expect(result.errors.has('activeRevision')).toBe(false);
            expect(result.node.name).toBe('⚠️ Undecryptable name');
            expect(result.node.activeRevision).toBe(mockRevision);
        });

        it('should handle activeRevision error only', () => {
            const revisionError = new Error('Revision validation failed');
            const nodeWithRevisionError: NodeEntity = {
                ...mockNodeEntity,
                name: { ok: true, value: 'valid-name.txt' },
                activeRevision: { ok: false, error: revisionError },
            };

            const result = getNodeEntity(nodeWithRevisionError);

            expect(result.errors.has('activeRevision')).toBe(true);
            expect(result.errors.get('activeRevision')).toBe(revisionError);
            expect(result.errors.has('name')).toBe(false);
            expect(result.node.name).toBe('valid-name.txt');
            expect(result.node.activeRevision).toBeUndefined();
        });

        it('should handle both name and activeRevision errors', () => {
            const nameError = new Error('Name validation failed');
            const revisionError = new Error('Revision validation failed');
            const nodeWithBothErrors: NodeEntity = {
                ...mockNodeEntity,
                name: { ok: false, error: nameError },
                activeRevision: { ok: false, error: revisionError },
            };

            const result = getNodeEntity(nodeWithBothErrors);

            expect(result.errors.has('name')).toBe(true);
            expect(result.errors.get('name')).toBe(nameError);
            expect(result.errors.has('activeRevision')).toBe(true);
            expect(result.errors.get('activeRevision')).toBe(revisionError);
            expect(result.node.name).toBe('⚠️ Undecryptable name');
            expect(result.node.activeRevision).toBeUndefined();
        });

        it('should handle invalid name error (with placeholder)', () => {
            const stringError = 'String error message';
            const nodeWithInvalidName: NodeEntity = {
                ...mockNodeEntity,
                name: { ok: false, error: { error: stringError, name: 'invalid' } },
                activeRevision: { ok: true, value: mockRevision },
            };

            const result = getNodeEntity(nodeWithInvalidName);

            expect(result.errors.has('name')).toBe(true);
            expect(result.errors.get('name')).toStrictEqual({
                error: stringError,
                name: 'invalid',
            });
            expect(result.node.name).toBe('invalid');
        });

        it('should handle missing activeRevision field', () => {
            const nameError = new Error('Name validation failed');
            const nodeWithoutRevision: NodeEntity = {
                ...mockNodeEntity,
                name: { ok: false, error: nameError },
                activeRevision: undefined,
            };

            const result = getNodeEntity(nodeWithoutRevision);

            expect(result.errors.has('name')).toBe(true);
            expect(result.errors.get('name')).toBe(nameError);
            expect(result.errors.has('activeRevision')).toBe(false);
            expect(result.node.activeRevision).toBeUndefined();
        });

        it('should preserve other node properties when handling errors', () => {
            const nameError = new Error('Name validation failed');
            const nodeWithError: NodeEntity = {
                ...mockNodeEntity,
                uid: 'error-node-id',
                name: { ok: false, error: nameError },
                activeRevision: { ok: true, value: mockRevision },
            };

            const result = getNodeEntity(nodeWithError);

            expect(result.node.uid).toBe('error-node-id');
            expect(result.node.name).toBe('⚠️ Undecryptable name');
            expect(result.node.activeRevision).toBe(mockRevision);
        });
    });

    describe('photoAttributes and albumAttributes', () => {
        it('should return photoAttributes and albumAttributes for Photo nodes', () => {
            const photoNode: NodeEntity = {
                ...mockNodeEntity,
                type: NodeType.Photo,
                photo: { captureTime: new Date('2023-06-15'), mainPhotoHash: 'hash1' },
                album: { nodeHashKey: 'album-hash' },
            } as NodeEntity;

            const result = getNodeEntity(photoNode);

            expect(result.photoAttributes).toEqual({ captureTime: new Date('2023-06-15'), mainPhotoHash: 'hash1' });
            expect(result.albumAttributes).toEqual({ nodeHashKey: 'album-hash' });
        });

        it('should return undefined photoAttributes and albumAttributes for non-photo nodes', () => {
            const result = getNodeEntity(mockNodeEntity);

            expect(result.photoAttributes).toBeUndefined();
            expect(result.albumAttributes).toBeUndefined();
        });
    });

    describe('return type structure', () => {
        it('should always return an object with node and errors properties', () => {
            const result = getNodeEntity(mockNodeEntity);

            expect(result).toHaveProperty('node');
            expect(result).toHaveProperty('errors');
            expect(result.errors).toBeInstanceOf(Map);
        });

        it('should return errors as a Map with correct key types', () => {
            const nameError = new Error('Name error');
            const revisionError = new Error('Revision error');
            const nodeWithErrors: NodeEntity = {
                ...mockNodeEntity,
                name: { ok: false, error: nameError },
                activeRevision: { ok: false, error: revisionError },
            };

            const result = getNodeEntity(nodeWithErrors);

            expect(result.errors).toBeInstanceOf(Map);
            expect(Array.from(result.errors.keys())).toEqual(expect.arrayContaining(['name', 'activeRevision']));
        });
    });
});
