import type { Author, MaybeNode, NodeEntity, Revision } from '@proton/drive';
import { MemberRole, NodeType, RevisionState } from '@proton/drive';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import type { ShareWithKey } from '../../../store';
import { mapNodeToLegacyItem } from './mapNodeToLegacyItem';

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
        state: 1,
        memberships: [],
        type: 1,
        possibleKeyPackets: [],
        isLocked: false,
        isDefault: true,
        linkType: LinkType.FILE,
    };

    describe('mapNodeToLegacyItem', () => {
        it('should map a successful node to legacy item', async () => {
            const maybeNode: MaybeNode = {
                ok: true,
                value: mockNodeEntity,
            };

            const result = await mapNodeToLegacyItem(maybeNode, mockShare);

            expect(result).toEqual({
                uid: nodeUid,
                name: 'test-file.txt',
                id: linkId,
                mimeType: 'text/plain',
                isFile: true,
                shareId: shareId,
                rootShareId: 'share-id-1',
                hasThumbnail: true,
                fileModifyTime: modifyTime / 1000,
                size: 1000,
                trashed: null,
                parentLinkId: parentId,
                linkId: linkId,
                volumeId: volumeId,
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

            const result = await mapNodeToLegacyItem(maybeNode, mockShare);

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

            const result = await mapNodeToLegacyItem(maybeNode, mockShare);

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

            const result = await mapNodeToLegacyItem(maybeNode, mockShare);

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

            const result = await mapNodeToLegacyItem(maybeNode, mockShare);

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

            const result = await mapNodeToLegacyItem(maybeNode, mockShare);

            expect(result.activeRevision?.state).toBe(0);
        });
    });
});
