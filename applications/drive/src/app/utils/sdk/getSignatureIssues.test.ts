import type { NodeEntity } from '@proton/drive';
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
        isSharedPublicly: false,
        creationTime: baseDate,
        modificationTime: baseDate,
        trashTime: undefined,
        totalStorageSize: 100,
        folder: undefined,
        treeEventScopeId: 'test-scope',
        ownedBy: {},
        name: { ok: true as const, value: 'test-name' },
    };

    const baseRevision = {
        uid: 'revision-uid',
        state: RevisionState.Active,
        creationTime: baseDate,
        storageSize: 100,
    };

    it('should return no signature issues when all signatures are valid', () => {
        const node: NodeEntity = {
            ...baseNodeProps,
            keyAuthor: { ok: true, value: 'test@proton.me' },
            nameAuthor: { ok: true, value: 'test@proton.me' },
            activeRevision: {
                ok: true,
                value: {
                    ...baseRevision,
                    contentAuthor: { ok: true, value: 'content@proton.me' },
                },
            },
        };

        const result = getSignatureIssues(node);

        expect(result).toEqual({
            ok: true,
        });
    });

    it('should return no signature issues when no active revision', () => {
        const node: NodeEntity = {
            ...baseNodeProps,
            keyAuthor: { ok: true, value: 'test@proton.me' },
            nameAuthor: { ok: true, value: 'test@proton.me' },
            activeRevision: undefined,
        };

        const result = getSignatureIssues(node);

        expect(result).toEqual({
            ok: true,
        });
    });

    it('should detect keyAuthor signature issues', () => {
        const node: NodeEntity = {
            ...baseNodeProps,
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
        };

        const result = getSignatureIssues(node);

        expect(result).toEqual({
            ok: false,
            issues: {
                keyAuthor: true,
                nameAuthor: false,
                contentAuthor: false,
            },
        });
    });

    it('should detect nameAuthor signature issues', () => {
        const node: NodeEntity = {
            ...baseNodeProps,
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
        };

        const result = getSignatureIssues(node);

        expect(result).toEqual({
            ok: false,
            issues: {
                keyAuthor: false,
                nameAuthor: true,
                contentAuthor: false,
            },
        });
    });

    it('should detect contentAuthor signature issues', () => {
        const node: NodeEntity = {
            ...baseNodeProps,
            keyAuthor: { ok: true, value: 'test@proton.me' },
            nameAuthor: { ok: true, value: 'test@proton.me' },
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
        };

        const result = getSignatureIssues(node);

        expect(result).toEqual({
            ok: false,
            issues: {
                keyAuthor: false,
                nameAuthor: false,
                contentAuthor: true,
            },
        });
    });

    it('should detect contentAuthor signature issues for anonymous content author', () => {
        const node: NodeEntity = {
            ...baseNodeProps,
            keyAuthor: { ok: true, value: 'test@proton.me' },
            nameAuthor: { ok: true, value: 'test@proton.me' },
            activeRevision: {
                ok: true,
                value: {
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
            issues: {
                keyAuthor: false,
                nameAuthor: false,
                contentAuthor: true,
            },
        });
    });

    it('should detect multiple signature issues', () => {
        const node: NodeEntity = {
            ...baseNodeProps,
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
        };

        const result = getSignatureIssues(node);

        expect(result).toEqual({
            ok: false,
            issues: {
                keyAuthor: true,
                nameAuthor: true,
                contentAuthor: true,
            },
        });
    });

    it('should handle node error with activeRevision error', () => {
        const node: NodeEntity = {
            ...baseNodeProps,
            keyAuthor: { ok: true, value: 'test@proton.me' },
            nameAuthor: { ok: true, value: 'test@proton.me' },
            activeRevision: { ok: false, error: new Error('Active revision error') },
        };

        const result = getSignatureIssues(node);

        expect(result).toEqual({
            ok: true,
        });
    });
});
