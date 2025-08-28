import type { MaybeNode } from '@proton/drive';
import { MemberRole, NodeType } from '@proton/drive';

import { getIsAnonymousUser } from './getIsAnonymousUser';

describe('getIsAnonymousUser', () => {
    const baseDate = new Date();
    const baseNodeProps = {
        uid: 'test-uid',
        parentUid: 'parent-uid',
        directRole: MemberRole.Viewer,
        name: 'test-name',
        nameAuthor: { ok: true as const, value: 'test@proton.me' },
        type: NodeType.File,
        mediaType: 'text/plain',
        isShared: false,
        creationTime: baseDate,
        trashTime: undefined,
        totalStorageSize: 100,
        activeRevision: undefined,
        folder: undefined,
        treeEventScopeId: 'test-scope',
    };

    describe('when node is ok', () => {
        it('should return false when keyAuthor is valid', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseNodeProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
                },
            };

            const result = getIsAnonymousUser(node);

            expect(result).toBe(false);
        });

        it('should return true when keyAuthor is invalid and no claimedAuthor', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseNodeProps,
                    keyAuthor: {
                        ok: false,
                        error: { claimedAuthor: undefined, error: 'Signature verification failed' },
                    },
                },
            };

            const result = getIsAnonymousUser(node);

            expect(result).toBe(true);
        });
    });

    describe('when node has error', () => {
        const baseErrorProps = {
            ...baseNodeProps,
            name: { ok: true as const, value: 'test-name' },
            errors: [],
        };

        it('should return true when keyAuthor is not ok and no claimedAuthor', () => {
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorProps,
                    keyAuthor: {
                        ok: false,
                        error: { claimedAuthor: undefined, error: 'Signature verification failed' },
                    },
                },
            };

            const result = getIsAnonymousUser(node);

            expect(result).toBe(true);
        });

        it('should return false when keyAuthor is not ok but has claimedAuthor', () => {
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorProps,
                    keyAuthor: {
                        ok: false,
                        error: { claimedAuthor: 'claimed@proton.me', error: 'Signature verification failed' },
                    },
                },
            };

            const result = getIsAnonymousUser(node);

            expect(result).toBe(false);
        });

        it('should return false when keyAuthor is ok', () => {
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
                },
            };

            const result = getIsAnonymousUser(node);

            expect(result).toBe(false);
        });
    });
});
