import type { MaybeNode } from '@proton/drive';
import { MemberRole, NodeType, RevisionState } from '@proton/drive';
import { isHEICSupported } from '@proton/shared/lib/helpers/mimetype';

import { ContentPreviewMethod, getContentPreviewMethod } from './content';

jest.mock('@proton/shared/lib/helpers/mimetype', () => ({
    ...jest.requireActual('@proton/shared/lib/helpers/mimetype'),
    isHEICSupported: jest.fn(),
}));

const mockedIsHEICSupported = jest.mocked(isHEICSupported);

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
        modificationTime: baseDate,
        trashTime: undefined,
        totalStorageSize: 100,
        folder: undefined,
        treeEventScopeId: 'test-scope',
        activeRevision: {
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
        },
    };

    const baseValidNodeProps = {
        ...baseNodeProps,
        name: 'test-name',
        keyAuthor: { ok: true as const, value: 'test@proton.me' },
        nameAuthor: { ok: true as const, value: 'test@proton.me' },
        ownedBy: {},
    };

    it('should return Streaming for video', () => {
        const node: MaybeNode = {
            ok: true,
            value: {
                ...baseValidNodeProps,
                mediaType: 'video/mp4',
            },
        };

        const result = getContentPreviewMethod(node);

        expect(result).toBe(ContentPreviewMethod.Streaming);
    });

    it('should return Buffer for image/jpeg', () => {
        const node: MaybeNode = {
            ok: true,
            value: {
                ...baseValidNodeProps,
                mediaType: 'image/jpeg',
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
            },
        };

        const result = getContentPreviewMethod(node);

        expect(result).toBe(ContentPreviewMethod.Buffer);
    });

    it('should return Buffer for IWAD', () => {
        const node: MaybeNode = {
            ok: true,
            value: {
                ...baseValidNodeProps,
                mediaType: 'application/x-doom',
            },
        };

        const result = getContentPreviewMethod(node);

        expect(result).toBe(ContentPreviewMethod.Buffer);
    });

    it('should return Thumbnail for application/octet-stream', () => {
        const node: MaybeNode = {
            ok: true,
            value: {
                ...baseValidNodeProps,
                mediaType: 'application/octet-stream',
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
            },
        };

        const result = getContentPreviewMethod(node);

        expect(result).toBe(ContentPreviewMethod.Thumbnail);
    });

    it('should return Buffer for image/heic on Safari 17+', () => {
        mockedIsHEICSupported.mockReturnValue(true);

        const node: MaybeNode = {
            ok: true,
            value: {
                ...baseValidNodeProps,
                mediaType: 'image/heic',
            },
        };

        const result = getContentPreviewMethod(node);

        expect(result).toBe(ContentPreviewMethod.Buffer);
    });

    it('should return Thumbnail for image/heic on non-Safari browsers', () => {
        mockedIsHEICSupported.mockReturnValue(false);

        const node: MaybeNode = {
            ok: true,
            value: {
                ...baseValidNodeProps,
                mediaType: 'image/heic',
            },
        };

        const result = getContentPreviewMethod(node);

        expect(result).toBe(ContentPreviewMethod.Thumbnail);
    });
});
