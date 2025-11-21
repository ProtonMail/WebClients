import type { MaybeNode } from '@protontech/drive-sdk';

import { getNodeNameFromMaybeNode } from './getNodeNameFromMaybeNode';

describe('getNodeNameFromMaybeNode', () => {
    it('should return node name when node is ok', () => {
        const maybeNode: MaybeNode = {
            ok: true,
            value: {
                name: 'MyFile.txt',
                uid: 'node123',
            } as any,
        };

        const name = getNodeNameFromMaybeNode(maybeNode);

        expect(name).toBe('MyFile.txt');
    });

    it('should return name when node has error but name is ok', () => {
        const maybeNode: MaybeNode = {
            ok: false,
            error: {
                name: {
                    ok: true,
                    value: 'DecryptedName.pdf',
                },
            } as any,
        };

        const name = getNodeNameFromMaybeNode(maybeNode);

        expect(name).toBe('DecryptedName.pdf');
    });

    it('should return undecryptable message when name is Error', () => {
        const maybeNode: MaybeNode = {
            ok: false,
            error: {
                name: {
                    ok: false,
                    error: new Error('Decryption failed'),
                },
            } as any,
        };

        const name = getNodeNameFromMaybeNode(maybeNode);

        expect(name).toBe('⚠️ Undecryptable name');
    });

    it('should return invalid name when error has name property', () => {
        const maybeNode: MaybeNode = {
            ok: false,
            error: {
                name: {
                    ok: false,
                    error: {
                        name: 'InvalidName.txt',
                    } as any,
                },
            } as any,
        };

        const name = getNodeNameFromMaybeNode(maybeNode);

        expect(name).toBe('InvalidName.txt');
    });
});
