import type { MaybeNode } from '@proton/drive';
import { MemberRole, NodeType, RevisionState } from '@proton/drive';

import { getContentSignatureIssueLabel } from './signatures';

describe('getContentSignatureIssueLabel', () => {
    const baseDate = new Date();
    const baseNodeProps = {
        uid: 'test-uid',
        parentUid: 'parent-uid',
        directRole: MemberRole.Viewer,
        type: NodeType.File,
        mediaType: 'text/plain',
        isShared: false,
        isSharedPublicly: false,
        creationTime: baseDate,
        modificationTime: baseDate,
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
        claimedSize: 100,
        claimedModificationTime: baseDate,
        claimedDigests: {
            sha1: 'abc123',
        },
        claimedAdditionalMetadata: {},
    };

    const baseValidNodeProps = {
        ...baseNodeProps,
        name: 'test-name',
        keyAuthor: { ok: true as const, value: 'test@proton.me' },
        nameAuthor: { ok: true as const, value: 'test@proton.me' },
    };

    const baseErrorNodeProps = {
        ...baseNodeProps,
        name: { ok: true as const, value: 'test-name' },
    };

    describe('when verifyMetadataSignatures is false', () => {
        it('should return undefined even if there are signature issues', () => {
            const errorMessage = 'Content signature verification failed';
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    activeRevision: {
                        ...baseRevision,
                        contentAuthor: {
                            ok: false,
                            error: {
                                error: errorMessage,
                                claimedAuthor: 'claimed@proton.me',
                            },
                        },
                    },
                },
            };

            const result = getContentSignatureIssueLabel(false, node, true);

            expect(result).toBeUndefined();
        });
    });

    describe('when node is undefined', () => {
        it('should return undefined', () => {
            const result = getContentSignatureIssueLabel(true, undefined);

            expect(result).toBeUndefined();
        });
    });

    describe('when node is ok but activeRevision is undefined', () => {
        it('should return undefined', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    activeRevision: undefined,
                },
            };

            const result = getContentSignatureIssueLabel(true, node);

            expect(result).toBeUndefined();
        });
    });

    describe('when node is ok, activeRevision is ok, and contentAuthor is ok', () => {
        it('should return undefined', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    activeRevision: {
                        ...baseRevision,
                        contentAuthor: { ok: true, value: 'content@proton.me' },
                    },
                },
            };

            const result = getContentSignatureIssueLabel(true, node);

            expect(result).toBeUndefined();
        });
    });

    describe('when node is ok, activeRevision is ok, but contentAuthor has error', () => {
        it('should return the contentAuthor error message', () => {
            const errorMessage = 'Content signature verification failed';
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    activeRevision: {
                        ...baseRevision,
                        contentAuthor: {
                            ok: false,
                            error: {
                                error: errorMessage,
                                claimedAuthor: 'claimed@proton.me',
                            },
                        },
                    },
                },
            };

            const result = getContentSignatureIssueLabel(true, node);

            expect(result).toBe(errorMessage);
        });
    });

    describe('when node is not ok but activeRevision is ok and contentAuthor is ok', () => {
        it('should return undefined', () => {
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorNodeProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
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

            const result = getContentSignatureIssueLabel(true, node);

            expect(result).toBeUndefined();
        });
    });

    describe('when node is not ok, activeRevision is ok, but contentAuthor has error', () => {
        it('should return the contentAuthor error message', () => {
            const errorMessage = 'Content signature verification failed';
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorNodeProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
                    nameAuthor: { ok: true, value: 'test@proton.me' },
                    activeRevision: {
                        ok: true,
                        value: {
                            ...baseRevision,
                            contentAuthor: {
                                ok: false,
                                error: {
                                    error: errorMessage,
                                    claimedAuthor: 'claimed@proton.me',
                                },
                            },
                        },
                    },
                },
            };

            const result = getContentSignatureIssueLabel(true, node);

            expect(result).toBe(errorMessage);
        });
    });

    describe('when node is not ok and activeRevision is not ok', () => {
        it('should return undefined', () => {
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorNodeProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
                    nameAuthor: { ok: true, value: 'test@proton.me' },
                    activeRevision: {
                        ok: false,
                        error: new Error('Revision error'),
                    },
                },
            };

            const result = getContentSignatureIssueLabel(true, node);

            expect(result).toBeUndefined();
        });
    });

    describe('when node is not ok and activeRevision is undefined', () => {
        it('should return undefined', () => {
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorNodeProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
                    nameAuthor: { ok: true, value: 'test@proton.me' },
                    activeRevision: undefined,
                },
            };

            const result = getContentSignatureIssueLabel(true, node);

            expect(result).toBeUndefined();
        });
    });

    describe('when hasContentSignatureIssues is true', () => {
        it('should return the data integrity check failed message', () => {
            const node: MaybeNode = {
                ok: true,
                value: baseValidNodeProps,
            };

            const result = getContentSignatureIssueLabel(true, node, true);

            expect(result).toBe('Data integrity check failed');
        });
    });
});
