import type { Author, MaybeNode, NodeEntity, Revision } from '@proton/drive';
import { MemberRole, NodeType, RevisionState } from '@proton/drive';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { ShareState, ShareType, type ShareWithKey } from '../../store';
import { getNodeEntity } from './getNodeEntity';
import { mapNodeToLegacyItem } from './mapNodeToLegacyItem';

jest.mock('./getNodeEntity');

const mockGetNodeEntity = jest.mocked(getNodeEntity);

const mockDrive = {
    getNode: jest.fn(),
} as any;

const linkId = 'nodeLinkId';
const volumeId = 'nodeVolumeId';
const revId = 'nodeRevId';
const parentId = 'parentId';
const shareId = 'shareId';

const nodeUid = `${volumeId}~${linkId}`;
const revUid = `${volumeId}~${linkId}~${revId}`;
const parentUid = `${volumeId}~${parentId}`;

const shareCreateTime = 11000;
const fileCreateTime = 12000;
const modifyTime = 13000;
const revisionTime = 14000;
const trashedTime = 15000;

describe('mapNodeToLegacyItem', () => {
    const mockAuthor: Author = {
        ok: true,
        value: 'test-author@proton.me',
    };

    const mockRevision: Revision = {
        uid: revUid,
        state: RevisionState.Active,
        creationTime: new Date(revisionTime),
        contentAuthor: mockAuthor,
        storageSize: 1024,
        claimedSize: 1000,
        claimedModificationTime: new Date(modifyTime),
        claimedDigests: {
            sha1: 'abc123',
        },
        claimedAdditionalMetadata: {},
    };

    const mockNodeEntity: NodeEntity = {
        uid: nodeUid,
        parentUid: parentUid,
        deprecatedShareId: shareId,
        name: 'test-file.txt',
        keyAuthor: mockAuthor,
        nameAuthor: mockAuthor,
        directMemberRole: MemberRole.Admin,
        type: NodeType.File,
        mediaType: 'text/plain',
        isShared: false,
        creationTime: new Date(fileCreateTime),
        trashTime: undefined,
        totalStorageSize: 1024,
        activeRevision: mockRevision,
        folder: undefined,
    };

    const mockShare: ShareWithKey = {
        shareId: 'share-id-1',
        volumeId: 'vol-uid-1',
        rootLinkId: 'root-link-id-1',
        creator: 'creator@proton.me',
        addressId: 'address-id-1',
        key: 'key-1',
        passphrase: 'passphrase-1',
        passphraseSignature: 'signature-1',
        createTime: shareCreateTime,
        state: ShareState.active,
        memberships: [],
        type: ShareType.standard,
        possibleKeyPackets: [],
        isLocked: false,
        isDefault: true,
        linkType: LinkType.FILE,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetNodeEntity.mockImplementation(jest.requireActual('./getNodeEntity').getNodeEntity);
        mockDrive.getNode.mockResolvedValue({
            ok: true,
            value: {
                uid: 'root-uid',
                deprecatedShareId: 'share-id-1',
                parentUid: undefined,
            },
        });
    });

    it('should map a successful node to legacy item', async () => {
        const maybeNode: MaybeNode = {
            ok: true,
            value: mockNodeEntity,
        };

        const result = await mapNodeToLegacyItem(maybeNode, mockShare, mockDrive);

        expect(result).toEqual({
            uid: nodeUid,
            name: 'test-file.txt',
            id: nodeUid,
            mimeType: 'text/plain',
            isFile: true,
            shareId: shareId,
            rootShareId: 'share-id-1',
            hasThumbnail: true,
            fileModifyTime: modifyTime / 1000,
            size: 1000,
            trashed: null,
            parentLinkId: parentId,
            parentUid: parentUid,
            deprecatedShareId: shareId,
            isLocked: false,
            metaDataModifyTime: modifyTime / 1000,
            linkId: linkId,
            volumeId: volumeId,
            isAnonymous: false,
            thumbnailId: 'nodeRevId',
            activeRevision: {
                id: revId,
                createTime: revisionTime / 1000,
                size: 1024,
                state: 1,
                manifestSignature: '',
                blocs: [],
                thumbnails: [],
            },
        });
    });

    it('should handle folder node', async () => {
        const folderNode: NodeEntity = {
            ...mockNodeEntity,
            type: NodeType.Folder,
            folder: {
                claimedModificationTime: new Date(modifyTime),
            },
            activeRevision: undefined,
        };

        const maybeNode: MaybeNode = {
            ok: true,
            value: folderNode,
        };

        const result = await mapNodeToLegacyItem(maybeNode, mockShare, mockDrive);

        expect(result.isFile).toBe(false);
        expect(result.activeRevision).toBeUndefined();
    });

    it('should handle node without activeRevision', async () => {
        const nodeWithoutRevision: NodeEntity = {
            ...mockNodeEntity,
            activeRevision: undefined,
        };

        const maybeNode: MaybeNode = {
            ok: true,
            value: nodeWithoutRevision,
        };

        const result = await mapNodeToLegacyItem(maybeNode, mockShare, mockDrive);

        expect(result.activeRevision).toBeUndefined();
        expect(result.size).toBe(1024); // Should use totalStorageSize
    });

    it('should handle node without mediaType', async () => {
        const nodeWithoutMediaType: NodeEntity = {
            ...mockNodeEntity,
            mediaType: undefined,
        };

        const maybeNode: MaybeNode = {
            ok: true,
            value: nodeWithoutMediaType,
        };

        const result = await mapNodeToLegacyItem(maybeNode, mockShare, mockDrive);

        expect(result.mimeType).toBe('');
    });

    it('should handle node with trashTime', async () => {
        const trashedNode: NodeEntity = {
            ...mockNodeEntity,
            trashTime: new Date(trashedTime),
        };

        const maybeNode: MaybeNode = {
            ok: true,
            value: trashedNode,
        };

        const result = await mapNodeToLegacyItem(maybeNode, mockShare, mockDrive);

        expect(result.trashed).toBe(trashedTime / 1000);
    });

    it('should handle inactive revision', async () => {
        const inactiveRevision: Revision = {
            ...mockRevision,
            state: RevisionState.Superseded,
        };

        const nodeWithInactiveRevision: NodeEntity = {
            ...mockNodeEntity,
            activeRevision: inactiveRevision,
        };

        const maybeNode: MaybeNode = {
            ok: true,
            value: nodeWithInactiveRevision,
        };

        const result = await mapNodeToLegacyItem(maybeNode, mockShare, mockDrive);

        expect(result.activeRevision?.state).toBe(0);
    });

    it('should handle node with different revision sizes', async () => {
        const revisionWithDifferentSizes: Revision = {
            ...mockRevision,
            storageSize: 2048,
            claimedSize: 1500,
        };

        const nodeWithDifferentSizes: NodeEntity = {
            ...mockNodeEntity,
            activeRevision: revisionWithDifferentSizes,
            totalStorageSize: 3000,
        };

        const maybeNode: MaybeNode = {
            ok: true,
            value: nodeWithDifferentSizes,
        };

        const result = await mapNodeToLegacyItem(maybeNode, mockShare, mockDrive);

        expect(result.size).toBe(1500);
        expect(result.activeRevision?.size).toBe(2048);
    });

    it('should handle node with only storageSize', async () => {
        const revisionWithOnlyStorageSize: Revision = {
            ...mockRevision,
            storageSize: 2048,
            claimedSize: 0,
        };

        const nodeWithOnlyStorageSize: NodeEntity = {
            ...mockNodeEntity,
            activeRevision: revisionWithOnlyStorageSize,
            totalStorageSize: 3000,
        };

        const maybeNode: MaybeNode = {
            ok: true,
            value: nodeWithOnlyStorageSize,
        };

        const result = await mapNodeToLegacyItem(maybeNode, mockShare, mockDrive);

        expect(result.size).toBe(2048);
    });

    it('should handle node with only totalStorageSize', async () => {
        const nodeWithOnlyTotalStorageSize: NodeEntity = {
            ...mockNodeEntity,
            activeRevision: undefined,
            totalStorageSize: 3000,
        };

        const maybeNode: MaybeNode = {
            ok: true,
            value: nodeWithOnlyTotalStorageSize,
        };

        const result = await mapNodeToLegacyItem(maybeNode, mockShare, mockDrive);

        expect(result.size).toBe(3000);
    });

    it('should handle node with zero sizes', async () => {
        const nodeWithZeroSizes: NodeEntity = {
            ...mockNodeEntity,
            activeRevision: undefined,
            totalStorageSize: 0,
        };

        const maybeNode: MaybeNode = {
            ok: true,
            value: nodeWithZeroSizes,
        };

        const result = await mapNodeToLegacyItem(maybeNode, mockShare, mockDrive);

        expect(result.size).toBe(0);
    });

    it('should handle node without deprecatedShareId', async () => {
        const nodeWithoutDeprecatedShareId: NodeEntity = {
            ...mockNodeEntity,
            deprecatedShareId: undefined,
        };

        const maybeNode: MaybeNode = {
            ok: true,
            value: nodeWithoutDeprecatedShareId,
        };

        const result = await mapNodeToLegacyItem(maybeNode, mockShare, mockDrive);

        expect(result.shareId).toBe('share-id-1');
    });

    it('should handle folder node with folder metadata', async () => {
        const folderNode: NodeEntity = {
            ...mockNodeEntity,
            type: NodeType.Folder,
            folder: {
                claimedModificationTime: new Date(modifyTime),
            },
            activeRevision: undefined,
            mediaType: undefined,
        };

        const maybeNode: MaybeNode = {
            ok: true,
            value: folderNode,
        };

        const result = await mapNodeToLegacyItem(maybeNode, mockShare, mockDrive);

        expect(result.isFile).toBe(false);
        expect(result.mimeType).toBe('');
        expect(result.fileModifyTime).toBe(fileCreateTime / 1000);
    });

    it('should handle anonymous node (null author)', async () => {
        const anonymousFileNode: NodeEntity = {
            ...mockNodeEntity,
            activeRevision: {
                ...mockRevision,
                contentAuthor: {
                    ok: true,
                    value: null,
                },
            },
        };

        const maybeNode: MaybeNode = {
            ok: true,
            value: anonymousFileNode,
        };

        const result = await mapNodeToLegacyItem(maybeNode, mockShare, mockDrive);

        expect(result.isAnonymous).toBe(true);
    });

    it('should handle anonymous folder node (null author)', async () => {
        const anonymousFolderNode: NodeEntity = {
            ...mockNodeEntity,
            type: NodeType.Folder,
            keyAuthor: {
                ok: true,
                value: null,
            },
            activeRevision: undefined,
            folder: {
                claimedModificationTime: new Date(modifyTime),
            },
        };

        const maybeNode: MaybeNode = {
            ok: true,
            value: anonymousFolderNode,
        };

        const result = await mapNodeToLegacyItem(maybeNode, mockShare, mockDrive);

        expect(result.isAnonymous).toBe(true);
        expect(result.isFile).toBe(false);
    });

    it('should handle failed node entity', async () => {
        const failedNodeEntity = {
            ...mockNodeEntity,
            name: 'fallback name',
        };

        const failedNode: MaybeNode = {
            ok: false,
            error: {
                ...mockNodeEntity,
                name: {
                    ok: false,
                    error: {
                        name: 'fallback name',
                        error: 'Node retrieval failed',
                    },
                },
                activeRevision: undefined,
            },
        };

        mockGetNodeEntity.mockReturnValueOnce({
            node: failedNodeEntity,
            errors: new Map([['name', { name: 'fallback name', error: 'Node retrieval failed' }]]),
        });

        const result = await mapNodeToLegacyItem(failedNode, mockShare, mockDrive);
        expect(result.name).toBe('fallback name');
    });

    it('should handle node with author error', async () => {
        const nodeWithAuthorError: NodeEntity = {
            ...mockNodeEntity,
            keyAuthor: {
                ok: false,
                error: {
                    claimedAuthor: 'claimedAuthor@test.com',
                    error: 'KeyAuthor error',
                },
            },
        };

        const maybeNode: MaybeNode = {
            ok: true,
            value: nodeWithAuthorError,
        };

        const result = await mapNodeToLegacyItem(maybeNode, mockShare, mockDrive);

        expect(result.isAnonymous).toBe(false);
    });

    it('should handle complex revision states', async () => {
        const draftRevision: Revision = {
            ...mockRevision,
            state: RevisionState.Superseded,
        };

        const nodeWithDraftRevision: NodeEntity = {
            ...mockNodeEntity,
            activeRevision: draftRevision,
        };

        const maybeNode: MaybeNode = {
            ok: true,
            value: nodeWithDraftRevision,
        };

        const result = await mapNodeToLegacyItem(maybeNode, mockShare, mockDrive);

        expect(result.activeRevision?.state).toBe(0);
    });
});
