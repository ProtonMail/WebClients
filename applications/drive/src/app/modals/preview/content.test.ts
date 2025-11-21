import type { MaybeNode } from '@proton/drive';
import { MemberRole, NodeType, RevisionState } from '@proton/drive';

import { ContentPreviewMethod, getContentPreviewMethod } from './content';

describe('getContentPreviewMethod', () => {
    const baseDate = new Date();
    const baseNodeProps = {
        uid: 'test-uid',
        parentUid: 'parent-uid',
        directRole: MemberRole.Viewer,
        type: NodeType.File,
        isShared: false,
        isSharedPublicly: false,
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
        claimedSize: 100,
        claimedModificationTime: baseDate,
        claimedDigests: {
            sha1: 'abc123',
        },
        claimedAdditionalMetadata: {},
        contentAuthor: { ok: true as const, value: 'content@proton.me' },
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

    describe('when mimeType is undefined', () => {
        it('should return Thumbnail for node with undefined mediaType (ok)', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    mediaType: undefined,
                    activeRevision: {
                        ...baseRevision,
                    },
                },
            };

            const result = getContentPreviewMethod(node);

            expect(result).toBe(ContentPreviewMethod.Thumbnail);
        });

        it('should return Thumbnail for node with undefined mediaType (error)', () => {
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorNodeProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
                    nameAuthor: { ok: true, value: 'test@proton.me' },
                    mediaType: undefined,
                    activeRevision: {
                        ok: true,
                        value: {
                            ...baseRevision,
                        },
                    },
                },
            };

            const result = getContentPreviewMethod(node);

            expect(result).toBe(ContentPreviewMethod.Thumbnail);
        });
    });

    describe('when mimeType is video', () => {
        it('should return Streaming for big video/mp4', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    mediaType: 'video/mp4',
                    activeRevision: {
                        ...baseRevision,
                        storageSize: 1000000000,
                    },
                },
            };

            const result = getContentPreviewMethod(node);

            expect(result).toBe(ContentPreviewMethod.Streaming);
        });

        it('should return Buffer for small video/mp4', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    mediaType: 'video/mp4',
                    activeRevision: {
                        ...baseRevision,
                        storageSize: 100,
                    },
                },
            };

            const result = getContentPreviewMethod(node);

            expect(result).toBe(ContentPreviewMethod.Buffer);
        });

        it('should return Streaming for video from error node', () => {
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorNodeProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
                    nameAuthor: { ok: true, value: 'test@proton.me' },
                    mediaType: 'video/mp4',
                    activeRevision: {
                        ok: true,
                        value: {
                            ...baseRevision,
                            storageSize: 1000000000,
                        },
                    },
                },
            };

            const result = getContentPreviewMethod(node);

            expect(result).toBe(ContentPreviewMethod.Streaming);
        });
    });

    describe('when mimeType is preview available', () => {
        it('should return Buffer for image/jpeg', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    mediaType: 'image/jpeg',
                    activeRevision: {
                        ...baseRevision,
                    },
                },
            };

            const result = getContentPreviewMethod(node);

            expect(result).toBe(ContentPreviewMethod.Buffer);
        });

        it('should return Buffer for image/png', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    mediaType: 'image/png',
                    activeRevision: {
                        ...baseRevision,
                    },
                },
            };

            const result = getContentPreviewMethod(node);

            expect(result).toBe(ContentPreviewMethod.Buffer);
        });

        it('should return Buffer for text/plain', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    mediaType: 'text/plain',
                    activeRevision: {
                        ...baseRevision,
                    },
                },
            };

            const result = getContentPreviewMethod(node);

            expect(result).toBe(ContentPreviewMethod.Buffer);
        });

        it('should return Buffer for preview available mimeType from error node', () => {
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorNodeProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
                    nameAuthor: { ok: true, value: 'test@proton.me' },
                    mediaType: 'image/jpeg',
                    activeRevision: {
                        ok: true,
                        value: {
                            ...baseRevision,
                        },
                    },
                },
            };

            const result = getContentPreviewMethod(node);

            expect(result).toBe(ContentPreviewMethod.Buffer);
        });
    });

    describe('when mimeType is IWAD', () => {
        it('should return Buffer for application/x-doom', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    mediaType: 'application/x-doom',
                    activeRevision: {
                        ...baseRevision,
                    },
                },
            };

            const result = getContentPreviewMethod(node);

            expect(result).toBe(ContentPreviewMethod.Buffer);
        });

        it('should return Buffer for IWAD mimeType from error node', () => {
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorNodeProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
                    nameAuthor: { ok: true, value: 'test@proton.me' },
                    mediaType: 'application/x-doom',
                    activeRevision: {
                        ok: true,
                        value: {
                            ...baseRevision,
                        },
                    },
                },
            };

            const result = getContentPreviewMethod(node);

            expect(result).toBe(ContentPreviewMethod.Buffer);
        });
    });

    describe('when mimeType is not preview available and not video', () => {
        it('should return Thumbnail for application/octet-stream', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    mediaType: 'application/octet-stream',
                    activeRevision: {
                        ...baseRevision,
                    },
                },
            };

            const result = getContentPreviewMethod(node);

            expect(result).toBe(ContentPreviewMethod.Thumbnail);
        });

        it('should return Thumbnail for unsupported mimeType', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    mediaType: 'application/x-unknown',
                    activeRevision: {
                        ...baseRevision,
                    },
                },
            };

            const result = getContentPreviewMethod(node);

            expect(result).toBe(ContentPreviewMethod.Thumbnail);
        });

        it('should return Thumbnail for unsupported mimeType from error node', () => {
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorNodeProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
                    nameAuthor: { ok: true, value: 'test@proton.me' },
                    mediaType: 'application/octet-stream',
                    activeRevision: {
                        ok: true,
                        value: {
                            ...baseRevision,
                        },
                    },
                },
            };

            const result = getContentPreviewMethod(node);

            expect(result).toBe(ContentPreviewMethod.Thumbnail);
        });
    });

    describe('when node has display size considerations', () => {
        it('should return Buffer for preview available mimeType with valid size', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    mediaType: 'image/jpeg',
                    activeRevision: {
                        ...baseRevision,
                        claimedSize: 50000, // Small enough for preview
                    },
                },
            };

            const result = getContentPreviewMethod(node);

            expect(result).toBe(ContentPreviewMethod.Buffer);
        });

        it('should handle node with totalStorageSize fallback', () => {
            const node: MaybeNode = {
                ok: true,
                value: {
                    ...baseValidNodeProps,
                    mediaType: 'image/png',
                    totalStorageSize: 50000,
                    activeRevision: undefined,
                },
            };

            const result = getContentPreviewMethod(node);

            expect(result).toBe(ContentPreviewMethod.Buffer);
        });

        it('should handle error node with totalStorageSize fallback', () => {
            const node: MaybeNode = {
                ok: false,
                error: {
                    ...baseErrorNodeProps,
                    keyAuthor: { ok: true, value: 'test@proton.me' },
                    nameAuthor: { ok: true, value: 'test@proton.me' },
                    mediaType: 'text/plain',
                    totalStorageSize: 50000,
                    activeRevision: undefined,
                },
            };

            const result = getContentPreviewMethod(node);

            expect(result).toBe(ContentPreviewMethod.Buffer);
        });
    });
});
