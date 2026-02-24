import type { MaybeNode, NodeEntity, Result } from '@proton/drive/index';
import { MemberRole, NodeType } from '@proton/drive/index';

import { NodeLocation, formatNodeLocation, getFormattedNodeLocation, getNodeLocation } from './getNodeLocation';

const createMockNode = (
    uid: string,
    parentUid?: string,
    role: MemberRole = MemberRole.Admin,
    includeMembership: boolean = false
): NodeEntity => ({
    uid,
    parentUid,
    directRole: role,
    name: `node-${uid}`,
    keyAuthor: { ok: true, value: 'test@proton.me' },
    nameAuthor: { ok: true, value: 'test@proton.me' },
    type: NodeType.Folder,
    mediaType: 'text/plain',
    isShared: false,
    isSharedPublicly: false,
    creationTime: new Date(),
    modificationTime: new Date(),
    trashTime: undefined,
    totalStorageSize: 0,
    activeRevision: undefined,
    folder: undefined,
    treeEventScopeId: 'treeEventScopeId',
    ...(includeMembership && {
        membership: {
            role,
            inviteTime: new Date(),
            sharedBy: { ok: true, value: 'sharer@proton.me' },
        },
    }),
});

const NO_PARENT_UID = undefined;

const createMaybeNode = (node: NodeEntity): MaybeNode => {
    return {
        ok: true,
        value: node,
    };
};

const createDriveStub = (isPrivateDefaultClient: boolean, rootNode: NodeEntity) => {
    const baseStub = {
        getNode: jest.fn(),
    };

    const extraMethods =
        isPrivateDefaultClient && rootNode
            ? {
                  getMyFilesRootFolder: () => {
                      return Promise.resolve({ ok: true, value: rootNode } satisfies MaybeNode);
                  },
                  iterateDevices: jest.fn(),
              }
            : {};
    return {
        ...baseStub,
        ...extraMethods,
    };
};

describe('getNodeLocation', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
    });

    it('should return MY_FILES with Proton Drive client', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID);
        const childNode1 = createMockNode('uid2', 'uid1');
        const lastNode = createMockNode('uid3', 'uid2');

        const drive = createDriveStub(true /* isPrivateDefaultClient */, rootNode);
        drive.getNode
            .mockResolvedValueOnce({ ok: true, value: lastNode })
            .mockResolvedValueOnce({ ok: true, value: childNode1 })
            .mockResolvedValueOnce({ ok: true, value: rootNode });

        const result = await getNodeLocation(drive, { ok: true, value: lastNode });

        expect(result.ok).toBe(true);
        assertOk(result); // Narrow TS type for rest of the test.

        expect(result.value).toBe(NodeLocation.MY_FILES);
    });

    it('should return SHARED_WITH_ME when root node has membership', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID, MemberRole.Viewer, true);
        const childNode1 = createMockNode('uid2', 'uid1', MemberRole.Viewer, true);
        const lastNode = createMockNode('uid3', 'uid2', MemberRole.Viewer, true);

        const drive = createDriveStub(true /* isPrivateDefaultClient */, rootNode);
        drive.getNode
            .mockResolvedValueOnce({ ok: true, value: lastNode })
            .mockResolvedValueOnce({ ok: true, value: childNode1 })
            .mockResolvedValueOnce({ ok: true, value: rootNode });

        const result = await getNodeLocation(drive, { ok: true, value: lastNode });

        expect(result.ok).toBe(true);
        assertOk(result); // Narrow TS type for rest of the test.

        expect(result.value).toBe(NodeLocation.SHARED_WITH_ME);
    });

    it('should not return SHARED_WITH_ME when root node has no membership', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID, MemberRole.Viewer, false);
        const childNode1 = createMockNode('uid2', 'uid1', MemberRole.Viewer, false);
        const lastNode = createMockNode('uid3', 'uid2', MemberRole.Viewer, false);

        const drive = createDriveStub(true /* isPrivateDefaultClient */, rootNode);
        drive.getNode
            .mockResolvedValueOnce({ ok: true, value: lastNode })
            .mockResolvedValueOnce({ ok: true, value: childNode1 })
            .mockResolvedValueOnce({ ok: true, value: rootNode });

        const result = await getNodeLocation(drive, { ok: true, value: lastNode });

        expect(result.ok).toBe(true);
        assertOk(result); // Narrow TS type for rest of the test.

        expect(result.value).not.toBe(NodeLocation.SHARED_WITH_ME);
    });

    it('should return SHARED_WITH_ME based on root node membership, not child node membership', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID, MemberRole.Viewer, true);
        const childNode1 = createMockNode('uid2', 'uid1', MemberRole.Viewer, false);
        const lastNode = createMockNode('uid3', 'uid2', MemberRole.Viewer, false);

        const drive = createDriveStub(true /* isPrivateDefaultClient */, rootNode);
        drive.getNode
            .mockResolvedValueOnce({ ok: true, value: lastNode })
            .mockResolvedValueOnce({ ok: true, value: childNode1 })
            .mockResolvedValueOnce({ ok: true, value: rootNode });

        const result = await getNodeLocation(drive, { ok: true, value: lastNode });

        expect(result.ok).toBe(true);
        assertOk(result); // Narrow TS type for rest of the test.

        expect(result.value).toBe(NodeLocation.SHARED_WITH_ME);
    });

    it('should not return SHARED_WITH_ME when node is owned by user even if root has membership', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID, MemberRole.Admin, true);
        const childNode1 = createMockNode('uid2', 'uid1', MemberRole.Admin, true);
        const lastNode = createMockNode('uid3', 'uid2', MemberRole.Admin, true);

        const drive = createDriveStub(true /* isPrivateDefaultClient */, rootNode);
        drive.getNode
            .mockResolvedValueOnce({ ok: true, value: lastNode })
            .mockResolvedValueOnce({ ok: true, value: childNode1 })
            .mockResolvedValueOnce({ ok: true, value: rootNode });

        const result = await getNodeLocation(drive, { ok: true, value: lastNode });

        expect(result.ok).toBe(true);
        assertOk(result); // Narrow TS type for rest of the test.

        expect(result.value).toBe(NodeLocation.MY_FILES);
    });

    it('should return PHOTOS for an album', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID);
        rootNode.type = NodeType.Album;

        const drive = createDriveStub(false /* isPrivateDefaultClient */, rootNode);
        drive.getNode.mockResolvedValueOnce({ ok: true, value: rootNode });

        const result = await getNodeLocation(drive, { ok: true, value: rootNode });

        expect(result.ok).toBe(true);
        assertOk(result); // Narrow TS type for rest of the test.

        expect(result.value).toBe(NodeLocation.PHOTOS);
    });

    it('should return PHOTOS for a photo', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID);
        rootNode.type = NodeType.Album;
        const photoNode = createMockNode('photo-node-uid', 'uid1');
        photoNode.type = NodeType.Photo;

        const drive = createDriveStub(false /* isPrivateDefaultClient */, rootNode);
        drive.getNode
            .mockResolvedValueOnce({ ok: true, value: photoNode })
            .mockResolvedValueOnce({ ok: true, value: rootNode });

        const result = await getNodeLocation(drive, { ok: true, value: photoNode });

        expect(result.ok).toBe(true);
        assertOk(result); // Narrow TS type for rest of the test.

        expect(result.value).toBe(NodeLocation.PHOTOS);
    });

    it('should return DEVICES', async () => {
        const deviceRootNode = createMockNode('deviceId', NO_PARENT_UID);
        const childNode1 = createMockNode('uid2', 'uid1');

        const myFilesRootNode = createMockNode('uid1', NO_PARENT_UID);
        const drive = createDriveStub(true /* isPrivateDefaultClient */, myFilesRootNode);
        drive.getNode
            .mockResolvedValueOnce({ ok: true, value: childNode1 })
            .mockResolvedValueOnce({ ok: true, value: deviceRootNode });

        const result = await getNodeLocation(drive, { ok: true, value: childNode1 });

        expect(result.ok).toBe(true);
        assertOk(result); // Narrow TS type for rest of the test.

        expect(result.value).toBe(NodeLocation.DEVICES);
    });

    it('should return PUBLIC_PAGE', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID);
        const childNode1 = createMockNode('uid2', 'uid1');
        const lastNode = createMockNode('uid3', 'uid2');

        const drive = createDriveStub(false /* isPrivateDefaultClient */, rootNode);
        drive.getNode
            .mockResolvedValueOnce({ ok: true, value: lastNode })
            .mockResolvedValueOnce({ ok: true, value: childNode1 })
            .mockResolvedValueOnce({ ok: true, value: rootNode });

        const result = await getNodeLocation(drive, { ok: true, value: lastNode });

        expect(result.ok).toBe(true);
        assertOk(result); // Narrow TS type for rest of the test.

        expect(result.value).toBe(NodeLocation.PUBLIC_PAGE);
    });
});

describe('formatNodeLocation', () => {
    it('should format My Files location with a long path', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID);
        const childNode1 = createMockNode('uid2', 'uid1');
        const lastNode = createMockNode('uid3', 'uid2');

        rootNode.name = 'volume1Root';
        childNode1.name = 'folder1';
        lastNode.name = 'folder2';

        expect(
            formatNodeLocation(NodeLocation.MY_FILES, [
                createMaybeNode(rootNode),
                createMaybeNode(childNode1),
                createMaybeNode(lastNode),
            ])
        ).toBe('/My files/folder1/folder2');
    });

    it('should render leading slash for one folder deep path e.g. "/My files"', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID);
        rootNode.name = 'volume1Root';
        expect(formatNodeLocation(NodeLocation.MY_FILES, [createMaybeNode(rootNode)])).toBe('/My files');
    });

    it('should format Shared With Me location', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID);
        const childNode1 = createMockNode('uid2', 'uid1');
        const lastNode = createMockNode('uid3', 'uid2');

        rootNode.name = 'folder1';
        childNode1.name = 'folder2';
        lastNode.name = 'folder3';

        expect(
            formatNodeLocation(NodeLocation.SHARED_WITH_ME, [
                createMaybeNode(rootNode),
                createMaybeNode(childNode1),
                createMaybeNode(lastNode),
            ])
        ).toBe('/Shared with me/folder1/folder2/folder3');
    });

    it('should format public page location', async () => {
        const childNode1 = createMockNode('uid2', NO_PARENT_UID);
        const lastNode = createMockNode('uid3', 'uid2');

        childNode1.name = 'folder1';
        lastNode.name = 'folder2';

        expect(
            formatNodeLocation(NodeLocation.PUBLIC_PAGE, [createMaybeNode(childNode1), createMaybeNode(lastNode)])
        ).toBe('/folder1/folder2');
    });

    it('should format photos location', async () => {
        const albumNode = createMockNode('uid1', NO_PARENT_UID);
        const photoNode = createMockNode('uid2', 'uid1');

        albumNode.name = 'album';
        albumNode.type = NodeType.Album;
        photoNode.name = 'photo';
        photoNode.type = NodeType.Photo;

        expect(formatNodeLocation(NodeLocation.PHOTOS, [createMaybeNode(albumNode), createMaybeNode(photoNode)])).toBe(
            'Photos'
        );
    });

    it('should format devices location', async () => {
        const rootDevice = createMockNode('rootDevice', NO_PARENT_UID);
        const childNode1 = createMockNode('uid1', 'rootDevice');
        const lastNode = createMockNode('uid2', 'uid1');

        rootDevice.name = 'Computer #1';
        childNode1.name = 'folder1';
        lastNode.name = 'folder2';

        expect(
            formatNodeLocation(NodeLocation.DEVICES, [
                createMaybeNode(rootDevice),
                createMaybeNode(childNode1),
                createMaybeNode(lastNode),
            ])
        ).toBe('/Devices/Computer #1/folder1/folder2');
    });
});

describe('getFormattedNodeLocation', () => {
    it('should format a node in My files', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID);
        const childNode1 = createMockNode('uid2', 'uid1');
        const lastNode = createMockNode('uid3', 'uid2');

        const drive = createDriveStub(true /* isPrivateDefaultClient */, rootNode);
        drive.getNode
            // First getNodeAncestry call
            .mockResolvedValueOnce({ ok: true, value: lastNode })
            .mockResolvedValueOnce({ ok: true, value: childNode1 })
            .mockResolvedValueOnce({ ok: true, value: rootNode })
            // Second getNodeAncestry call
            .mockResolvedValueOnce({ ok: true, value: lastNode })
            .mockResolvedValueOnce({ ok: true, value: childNode1 })
            .mockResolvedValueOnce({ ok: true, value: rootNode });

        const formattedLocation = await getFormattedNodeLocation(drive, { ok: true, value: lastNode });

        expect(formattedLocation).toBe('/My files/node-uid2');
    });
});

function assertOk<T, E>(result: Result<T, E>): asserts result is { ok: true; value: T } {
    if (!result.ok) {
        throw new Error('Expected ok result');
    }
}
