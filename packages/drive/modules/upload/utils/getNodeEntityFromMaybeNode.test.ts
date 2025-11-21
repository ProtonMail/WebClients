import type { InvalidNameError, MaybeNode, NodeEntity } from '@protontech/drive-sdk';

import { getNodeEntityFromMaybeNode } from './getNodeEntityFromMaybeNode';

describe('getNodeEntityFromMaybeNode', () => {
    it('should return node when maybeNode is ok', () => {
        const nodeEntity: NodeEntity = {
            uid: 'node123',
            name: 'MyFile.txt',
            type: 1,
        } as any;

        const maybeNode: MaybeNode = {
            ok: true,
            value: nodeEntity,
        };

        const result = getNodeEntityFromMaybeNode(maybeNode);

        expect(result.node).toBe(nodeEntity);
        expect(result.errors.size).toBe(0);
    });

    it('should extract errors when maybeNode has error', () => {
        const maybeNode: MaybeNode = {
            ok: false,
            error: {
                uid: 'node123',
                name: {
                    ok: false,
                    error: new Error('Name decryption failed'),
                },
                activeRevision: {
                    ok: false,
                    error: new Error('Revision decryption failed'),
                },
                errors: [new Error('Unhandled error')],
            } as any,
        };

        const result = getNodeEntityFromMaybeNode(maybeNode);

        expect(result.errors.size).toBe(3);
        expect(result.errors.get('name')).toBeInstanceOf(Error);
        expect(result.errors.get('activeRevision')).toBeInstanceOf(Error);
        expect(result.errors.get('unhandledError')).toBeInstanceOf(Error);
    });

    it('should only include name error when only name fails', () => {
        const maybeNode: MaybeNode = {
            ok: false,
            error: {
                uid: 'node123',
                name: {
                    ok: false,
                    error: { name: 'InvalidName.txt' } as InvalidNameError,
                },
            } as any,
        };

        const result = getNodeEntityFromMaybeNode(maybeNode);

        expect(result.errors.size).toBe(1);
        expect(result.errors.has('name')).toBe(true);
        expect(result.errors.has('activeRevision')).toBe(false);
    });

    it('should use decrypted name when name is ok', () => {
        const maybeNode: MaybeNode = {
            ok: false,
            error: {
                uid: 'node123',
                name: {
                    ok: true,
                    value: 'DecryptedName.pdf',
                },
            } as any,
        };

        const result = getNodeEntityFromMaybeNode(maybeNode);

        expect(result.node.name).toBe('DecryptedName.pdf');
        expect(result.errors.has('name')).toBe(false);
    });

    it('should use activeRevision when available', () => {
        const activeRevision = { id: 'rev123' };
        const maybeNode: MaybeNode = {
            ok: false,
            error: {
                uid: 'node123',
                name: {
                    ok: true,
                    name: 'File.txt',
                },
                activeRevision: {
                    ok: true,
                    value: activeRevision as any,
                },
            } as any,
        };

        const result = getNodeEntityFromMaybeNode(maybeNode);

        expect(result.node.activeRevision).toBe(activeRevision);
        expect(result.errors.has('activeRevision')).toBe(false);
    });

    it('should set activeRevision to undefined when not ok', () => {
        const maybeNode: MaybeNode = {
            ok: false,
            error: {
                uid: 'node123',
                name: {
                    ok: true,
                    name: 'File.txt',
                },
                activeRevision: {
                    ok: false,
                    error: new Error('Failed'),
                },
            } as any,
        };

        const result = getNodeEntityFromMaybeNode(maybeNode);

        expect(result.node.activeRevision).toBeUndefined();
        expect(result.errors.has('activeRevision')).toBe(true);
    });

    it('should handle multiple errors in errors array', () => {
        const maybeNode: MaybeNode = {
            ok: false,
            error: {
                uid: 'node123',
                name: {
                    ok: true,
                    name: 'File.txt',
                },
                errors: [new Error('Error 1'), new Error('Error 2'), new Error('Error 3')],
            } as any,
        };

        const result = getNodeEntityFromMaybeNode(maybeNode);

        expect(result.errors.get('unhandledError')).toBeInstanceOf(Error);
        const unhandledError = result.errors.get('unhandledError') as Error;
        expect(unhandledError.message).toBe('Error 1');
    });

    it('should not add unhandledError when errors array is empty', () => {
        const maybeNode: MaybeNode = {
            ok: false,
            error: {
                uid: 'node123',
                name: {
                    ok: true,
                    name: 'File.txt',
                },
                errors: [],
            } as any,
        };

        const result = getNodeEntityFromMaybeNode(maybeNode);

        expect(result.errors.has('unhandledError')).toBe(false);
    });

    it('should preserve all node properties', () => {
        const maybeNode: MaybeNode = {
            ok: false,
            error: {
                uid: 'node123',
                type: 1,
                mediaType: 'text/plain',
                name: {
                    ok: true,
                    value: 'File.txt',
                },
            } as any,
        };

        const result = getNodeEntityFromMaybeNode(maybeNode);

        expect(result.node.uid).toBe('node123');
        expect(result.node.type).toBe(1);
        expect(result.node.mediaType).toBe('text/plain');
        expect(result.node.name).toBe('File.txt');
    });
});
