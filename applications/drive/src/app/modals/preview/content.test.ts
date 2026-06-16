import type { NodeEntity } from '@proton/drive';
import { MemberRole, NodeType, RevisionState } from '@proton/drive';
import { canHtmlVideoPlay } from '@proton/drive/modules/thumbnails';
import { isHEICSupported } from '@proton/shared/lib/helpers/mimetype';

import { ContentPreviewMethod, getContentPreviewMethod } from './content';

jest.mock('@proton/shared/lib/helpers/mimetype', () => ({
    ...jest.requireActual('@proton/shared/lib/helpers/mimetype'),
    isHEICSupported: jest.fn(),
}));

jest.mock('@proton/drive/modules/thumbnails', () => ({
    canHtmlVideoPlay: jest.fn(),
}));

const mockedIsHEICSupported = jest.mocked(isHEICSupported);
const mockedCanHtmlVideoPlay = jest.mocked(canHtmlVideoPlay);

beforeEach(() => {
    mockedCanHtmlVideoPlay.mockReturnValue(true);
});

describe('getContentPreviewMethod', () => {
    const baseDate = new Date();
    const baseNodeProps: NodeEntity = {
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
            ok: true,
            value: {
                uid: 'revision-uid',
                state: RevisionState.Active,
                creationTime: baseDate,
                storageSize: 100,
                claimedSize: 100,
                claimedModificationTime: baseDate,
                claimedDigests: {
                    sha1: 'abc123',
                    sha1Verified: false,
                },
                claimedAdditionalMetadata: {},
                contentAuthor: { ok: true as const, value: 'content@proton.me' },
            },
        },
        name: { ok: true, value: 'test-name' },
        keyAuthor: { ok: true as const, value: 'test@proton.me' },
        nameAuthor: { ok: true as const, value: 'test@proton.me' },
        ownedBy: {},
        mediaType: 'text/plain',
    };

    it('should return Streaming for video', () => {
        const node: NodeEntity = {
            ...baseNodeProps,
            mediaType: 'video/mp4',
        };

        const result = getContentPreviewMethod(node);

        expect(result).toBe(ContentPreviewMethod.Streaming);
    });

    it('should return Thumbnail for video the browser cannot decode (e.g. AVI)', () => {
        mockedCanHtmlVideoPlay.mockReturnValue(false);

        const node: NodeEntity = {
            ...baseNodeProps,
            mediaType: 'video/x-msvideo',
        };

        const result = getContentPreviewMethod(node);

        expect(result).toBe(ContentPreviewMethod.Thumbnail);
    });

    it('should return Buffer for image/jpeg', () => {
        const node: NodeEntity = {
            ...baseNodeProps,
            mediaType: 'image/jpeg',
        };

        const result = getContentPreviewMethod(node);

        expect(result).toBe(ContentPreviewMethod.Buffer);
    });

    it('should return Buffer for text/plain', () => {
        const node: NodeEntity = {
            ...baseNodeProps,
            mediaType: 'text/plain',
        };

        const result = getContentPreviewMethod(node);

        expect(result).toBe(ContentPreviewMethod.Buffer);
    });

    it('should return Buffer for IWAD', () => {
        const node: NodeEntity = {
            ...baseNodeProps,
            mediaType: 'application/x-doom',
        };

        const result = getContentPreviewMethod(node);

        expect(result).toBe(ContentPreviewMethod.Buffer);
    });

    it('should return Thumbnail for application/octet-stream', () => {
        const node: NodeEntity = {
            ...baseNodeProps,
            mediaType: 'application/octet-stream',
        };

        const result = getContentPreviewMethod(node);

        expect(result).toBe(ContentPreviewMethod.Thumbnail);
    });

    it('should return Thumbnail for unsupported mimeType', () => {
        const node: NodeEntity = {
            ...baseNodeProps,
            mediaType: 'application/x-unknown',
        };

        const result = getContentPreviewMethod(node);

        expect(result).toBe(ContentPreviewMethod.Thumbnail);
    });

    it('should return Buffer for image/heic on Safari 17+', () => {
        mockedIsHEICSupported.mockReturnValue(true);

        const node: NodeEntity = {
            ...baseNodeProps,
            mediaType: 'image/heic',
        };

        const result = getContentPreviewMethod(node);

        expect(result).toBe(ContentPreviewMethod.Buffer);
    });

    it('should return Thumbnail for image/heic on non-Safari browsers', () => {
        mockedIsHEICSupported.mockReturnValue(false);

        const node: NodeEntity = {
            ...baseNodeProps,
            mediaType: 'image/heic',
        };

        const result = getContentPreviewMethod(node);

        expect(result).toBe(ContentPreviewMethod.Thumbnail);
    });
});
