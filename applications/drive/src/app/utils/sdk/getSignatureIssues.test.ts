import type { MaybeNode } from '@proton/drive';
import { MemberRole, NodeType, RevisionState } from '@proton/drive';

import { getSignatureIssues } from './getSignatureIssues';

describe('getSignatureIssues', () => {
    const baseDate = new Date();
    const baseNodeProps = {
        uid: 'test-uid',
        parentUid: 'parent-uid',
        directRole: MemberRole.Viewer,
        type: NodeType.File,
        mediaType: 'text/plain',
        isShared: false,
        creationTime: baseDate,
        trashTime: undefined,
        totalStorageSize: 100,
        folder: undefined,
        treeEventScopeId: 'test-scope',
    };

    const baseRevision = {
        uid: 'revision-uid',
        state: RevisionState.Active,
        creationTime: baseDate,
        storageSize: 100,
    };

    const baseErrorNodeProps = {
        ...baseNodeProps,
        name: { ok: true as const, value: 'test-name' },
        errors: [],
    };

    const baseValidNodeProps = {
        ...baseNodeProps,
        name: 'test-name',
    };

    describe('anonymous user scenarios', () => {
        it('should return no signature issues for anonymous user', () => {
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorNodeProps,
                    keyAuthor: { ok: false, error: { claimedAuthor: undefined, error: 'Key verification failed' } },
                    nameAuthor: { ok: true, value: 'test@proton.me' },
                    activeRevision: undefined,
                },
            };

            const result = getSignatureIssues(node);

            expect(result).toEqual({
                ok: true,
                isAnonymousUser: true,
            });
        });
    });

    describe('non-anonymous user scenarios', () => {
        it('should return no signature issues when all signatures are valid', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
                    nameAuthor: { ok: true, value: 'test@proton.me' },
                    activeRevision: {
                        ...baseRevision,
                        contentAuthor: { ok: true, value: 'content@proton.me' },
                    },
                },
            };

            const result = getSignatureIssues(node);

            expect(result).toEqual({
                ok: true,
                isAnonymousUser: false,
            });
        });

        it('should return no signature issues when no active revision', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
                    nameAuthor: { ok: true, value: 'test@proton.me' },
                    activeRevision: undefined,
                },
            };

            const result = getSignatureIssues(node);

            expect(result).toEqual({
                ok: true,
                isAnonymousUser: false,
            });
        });

        it('should detect keyAuthor signature issues', () => {
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorNodeProps,
                    keyAuthor: {
                        ok: false,
                        error: { claimedAuthor: 'claimed@proton.me', error: 'Key verification failed' },
                    },
                    nameAuthor: { ok: true, value: 'test@proton.me' },
                    activeRevision: {
                        ok: true,
                        value: {
                            ...baseRevision,
                            contentAuthor: { ok: true, value: 'content@proton.me' },
                        },
                    },
                },
            };

            const result = getSignatureIssues(node);

            expect(result).toEqual({
                ok: false,
                isAnonymousUser: false,
                issues: {
                    keyAuthor: true,
                    nameAuthor: false,
                    contentAuthor: false,
                },
            });
        });

        it('should detect nameAuthor signature issues', () => {
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorNodeProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
                    nameAuthor: {
                        ok: false,
                        error: { claimedAuthor: 'name@proton.me', error: 'Name verification failed' },
                    },
                    activeRevision: {
                        ok: true,
                        value: {
                            ...baseRevision,
                            contentAuthor: { ok: true, value: 'content@proton.me' },
                        },
                    },
                },
            };

            const result = getSignatureIssues(node);

            expect(result).toEqual({
                ok: false,
                isAnonymousUser: false,
                issues: {
                    keyAuthor: false,
                    nameAuthor: true,
                    contentAuthor: false,
                },
            });
        });

        it('should detect contentAuthor signature issues', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
                    nameAuthor: { ok: true, value: 'test@proton.me' },
                    activeRevision: {
                        ...baseRevision,
                        contentAuthor: {
                            ok: false,
                            error: { claimedAuthor: 'content@proton.me', error: 'Content verification failed' },
                        },
                    },
                },
            };

            const result = getSignatureIssues(node);

            expect(result).toEqual({
                ok: false,
                isAnonymousUser: false,
                issues: {
                    keyAuthor: false,
                    nameAuthor: false,
                    contentAuthor: true,
                },
            });
        });

        it('should detect contentAuthor signature issues for anonymous content author', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
                    nameAuthor: { ok: true, value: 'test@proton.me' },
                    activeRevision: {
                        ...baseRevision,
                        contentAuthor: {
                            ok: false,
                            error: { claimedAuthor: undefined, error: 'Content verification failed' },
                        },
                    },
                },
            };

            const result = getSignatureIssues(node);

            expect(result).toEqual({
                ok: false,
                isAnonymousUser: false,
                issues: {
                    keyAuthor: false,
                    nameAuthor: false,
                    contentAuthor: true,
                },
            });
        });

        it('should detect multiple signature issues', () => {
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorNodeProps,
                    keyAuthor: {
                        ok: false,
                        error: { claimedAuthor: 'key@proton.me', error: 'Key verification failed' },
                    },
                    nameAuthor: {
                        ok: false,
                        error: { claimedAuthor: 'name@proton.me', error: 'Name verification failed' },
                    },
                    activeRevision: {
                        ok: true,
                        value: {
                            ...baseRevision,
                            contentAuthor: {
                                ok: false,
                                error: { claimedAuthor: 'content@proton.me', error: 'Content verification failed' },
                            },
                        },
                    },
                },
            };

            const result = getSignatureIssues(node);

            expect(result).toEqual({
                ok: false,
                isAnonymousUser: false,
                issues: {
                    keyAuthor: true,
                    nameAuthor: true,
                    contentAuthor: true,
                },
            });
        });
    });

    describe('edge cases', () => {
        it('should handle node error with activeRevision error', () => {
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorNodeProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
                    nameAuthor: { ok: true, value: 'test@proton.me' },
                    activeRevision: { ok: false, error: new Error('Active revision error') },
                },
            };

            const result = getSignatureIssues(node);

            expect(result).toEqual({
                ok: true,
                isAnonymousUser: false,
            });
        });
    });
});
