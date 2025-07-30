import type { Author, MaybeNode, NodeEntity, Revision } from '@proton/drive';
import { MemberRole, NodeType, RevisionState } from '@proton/drive';

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
        },
        claimedAdditionalMetadata: {},
    };

    const mockNodeEntity: NodeEntity = {
        uid: 'node-uid-1',
        parentUid: 'parent-uid-1',
        name: 'test-file.txt',
        keyAuthor: mockAuthor,
        nameAuthor: mockAuthor,
        directMemberRole: MemberRole.Admin,
        type: NodeType.File,
        mediaType: 'text/plain',
        isShared: false,
        creationTime: new Date('2023-01-01'),
        trashTime: undefined,
        totalStorageSize: 1024,
        activeRevision: mockRevision,
        folder: undefined,
        treeEventScopeId: '',
    };

    describe('when maybeNode is successful', () => {
        it('should return the node entity with no errors', () => {
            const maybeNode: MaybeNode = {
                ok: true,
                value: mockNodeEntity,
            };

            const result = getNodeEntity(maybeNode);

            expect(result.node).toEqual(mockNodeEntity);
            expect(result.errors.size).toBe(0);
        });
    });

    describe('when maybeNode has errors', () => {
        it('should handle name error only', () => {
            const nameError = new Error('Name validation failed');
            const maybeNode: MaybeNode = {
                ok: false,
                error: {
                    ...mockNodeEntity,
                    name: {
                        ok: false,
                        error: nameError,
                    },
                    activeRevision: {
                        ok: true,
                        value: mockRevision,
                    },
                },
            };

            const result = getNodeEntity(maybeNode);

            expect(result.errors.has('name')).toBe(true);
            expect(result.errors.get('name')).toBe(nameError);
            expect(result.errors.has('activeRevision')).toBe(false);
            expect(result.node.name).toBe(nameError.name);
            expect(result.node.activeRevision).toBe(mockNodeEntity.activeRevision);
        });

        it('should handle activeRevision error only', () => {
            const revisionError = new Error('Revision validation failed');
            const maybeNode: MaybeNode = {
                ok: false,
                error: {
                    ...mockNodeEntity,
                    name: {
                        ok: true,
                        value: 'valid-name.txt',
                    },
                    activeRevision: {
                        ok: false,
                        error: revisionError,
                    },
                },
            };

            const result = getNodeEntity(maybeNode);

            expect(result.errors.has('activeRevision')).toBe(true);
            expect(result.errors.get('activeRevision')).toBe(revisionError);
            expect(result.errors.has('name')).toBe(false);
            expect(result.node.name).toBe('valid-name.txt');
            expect(result.node.activeRevision).toBeUndefined();
        });

        it('should handle both name and activeRevision errors', () => {
            const nameError = new Error('Name validation failed');
            const revisionError = new Error('Revision validation failed');
            const maybeNode: MaybeNode = {
                ok: false,
                error: {
                    ...mockNodeEntity,
                    name: {
                        ok: false,
                        error: nameError,
                    },
                    activeRevision: {
                        ok: false,
                        error: revisionError,
                    },
                },
            };

            const result = getNodeEntity(maybeNode);

            expect(result.errors.has('name')).toBe(true);
            expect(result.errors.get('name')).toBe(nameError);
            expect(result.errors.has('activeRevision')).toBe(true);
            expect(result.errors.get('activeRevision')).toBe(revisionError);
            expect(result.node.name).toBe(nameError.name);
            expect(result.node.activeRevision).toBeUndefined();
        });

        it('should handle string errors', () => {
            const stringError = 'String error message';
            const maybeNode: MaybeNode = {
                ok: false,
                error: {
                    ...mockNodeEntity,
                    name: {
                        ok: false,
                        error: {
                            error: stringError,
                            name: 'invalid',
                        },
                    },
                    activeRevision: {
                        ok: true,
                        value: mockRevision,
                    },
                },
            };

            const result = getNodeEntity(maybeNode);

            expect(result.errors.has('name')).toBe(true);
            expect(result.errors.get('name')).toStrictEqual({
                error: stringError,
                name: 'invalid',
            });
            expect(result.node.name).toBe('invalid');
        });

        it('should handle missing activeRevision field', () => {
            const nameError = new Error('Name validation failed');
            const maybeNode: MaybeNode = {
                ok: false,
                error: {
                    ...mockNodeEntity,
                    name: {
                        ok: false,
                        error: nameError,
                    },
                    activeRevision: undefined,
                },
            };

            const result = getNodeEntity(maybeNode);

            expect(result.errors.has('name')).toBe(true);
            expect(result.errors.get('name')).toBe(nameError);
            expect(result.errors.has('activeRevision')).toBe(false);
            expect(result.node.activeRevision).toBeUndefined();
        });

        it('should preserve other node properties when handling errors', () => {
            const nameError = new Error('Name validation failed');
            const maybeNode: MaybeNode = {
                ok: false,
                error: {
                    ...mockNodeEntity,
                    uid: 'error-node-id',
                    name: {
                        ok: false,
                        error: nameError,
                    },
                    activeRevision: {
                        ok: true,
                        value: mockRevision,
                    },
                },
            };

            const result = getNodeEntity(maybeNode);

            expect(result.node.uid).toBe('error-node-id');
            expect(result.node.name).toBe(nameError.name);
            expect(result.node.activeRevision).toBe(mockNodeEntity.activeRevision);
        });
    });

    describe('return type structure', () => {
        it('should always return an object with node and errors properties', () => {
            const maybeNode: MaybeNode = {
                ok: true,
                value: mockNodeEntity,
            };

            const result = getNodeEntity(maybeNode);

            expect(result).toHaveProperty('node');
            expect(result).toHaveProperty('errors');
            expect(result.errors).toBeInstanceOf(Map);
        });

        it('should return errors as a Map with correct key types', () => {
            const nameError = new Error('Name error');
            const revisionError = new Error('Revision error');
            const maybeNode: MaybeNode = {
                ok: false,
                error: {
                    ...mockNodeEntity,
                    name: {
                        ok: false,
                        error: nameError,
                    },
                    activeRevision: {
                        ok: false,
                        error: revisionError,
                    },
                },
            };

            const result = getNodeEntity(maybeNode);

            expect(result.errors).toBeInstanceOf(Map);
            expect(Array.from(result.errors.keys())).toEqual(expect.arrayContaining(['name', 'activeRevision']));
        });
    });
});
