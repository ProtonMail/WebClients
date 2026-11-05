import type { NodeEntity } from '@protontech/drive-sdk';
import { MemberRole, NodeType } from '@protontech/drive-sdk';

import {
    NodeLocation,
    formatNodeLocation,
    getFormattedNodeLocation,
    getFormattedNodeLocationFromHierarchy,
    getFormattedNodeLocationUsingHierarchy,
    getNodeLocation,
} from './getNodeLocation';

const createMockNode = (
    uid: string,
    parentUid?: string,
    role: MemberRole = MemberRole.Admin,
    includeMembership: boolean = false
): NodeEntity => ({
    uid,
    parentUid,
    directRole: role,
    name: { ok: true, value: `node-${uid}` },
    keyAuthor: { ok: true, value: 'test@proton.me' },
    nameAuthor: { ok: true, value: 'test@proton.me' },
    type: NodeType.Folder,
    mediaType: 'text/plain',
    isShared: false,
    isSharedByUrl: false,
    creationTime: new Date(),
    modificationTime: new Date(),
    trashTime: undefined,
    totalStorageSize: 0,
    activeRevision: undefined,
    folder: undefined,
    treeEventScopeId: 'treeEventScopeId',
    ownedBy: {},
    ...(includeMembership && {
        membership: {
            role,
            inviteTime: new Date(),
            sharedBy: { ok: true, value: 'sharer@proton.me' },
        },
    }),
});

const NO_PARENT_UID = undefined;

const createDriveStub = (isPrivateDefaultClient: boolean, rootNode: NodeEntity) => {
    const baseStub = {
        getNode: jest.fn(),
    };

    const extraMethods =
        isPrivateDefaultClient && rootNode
            ? {
                  getMyFilesRootFolder: () => {
                      return Promise.resolve(rootNode);
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
        const result = await getNodeLocation(drive, [rootNode, childNode1, lastNode]);

        expect(result).toBe(NodeLocation.MY_FILES);
    });

    it('should return SHARED_WITH_ME when root node has membership', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID, MemberRole.Viewer, true);
        const childNode1 = createMockNode('uid2', 'uid1', MemberRole.Viewer, true);
        const lastNode = createMockNode('uid3', 'uid2', MemberRole.Viewer, true);

        const drive = createDriveStub(true /* isPrivateDefaultClient */, rootNode);
        const result = await getNodeLocation(drive, [rootNode, childNode1, lastNode]);

        expect(result).toBe(NodeLocation.SHARED_WITH_ME);
    });

    it('should not return SHARED_WITH_ME when root node has no membership', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID, MemberRole.Viewer, false);
        const childNode1 = createMockNode('uid2', 'uid1', MemberRole.Viewer, false);
        const lastNode = createMockNode('uid3', 'uid2', MemberRole.Viewer, false);

        const drive = createDriveStub(true /* isPrivateDefaultClient */, rootNode);
        const result = await getNodeLocation(drive, [rootNode, childNode1, lastNode]);

        expect(result).not.toBe(NodeLocation.SHARED_WITH_ME);
    });

    it('should return SHARED_WITH_ME based on root node membership, not child node membership', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID, MemberRole.Viewer, true);
        const childNode1 = createMockNode('uid2', 'uid1', MemberRole.Viewer, false);
        const lastNode = createMockNode('uid3', 'uid2', MemberRole.Viewer, false);

        const drive = createDriveStub(true /* isPrivateDefaultClient */, rootNode);
        const result = await getNodeLocation(drive, [rootNode, childNode1, lastNode]);

        expect(result).toBe(NodeLocation.SHARED_WITH_ME);
    });

    it('should return PHOTOS for an album', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID);
        rootNode.type = NodeType.Album;

        const drive = createDriveStub(false /* isPrivateDefaultClient */, rootNode);
        const result = await getNodeLocation(drive, [rootNode]);

        expect(result).toBe(NodeLocation.PHOTOS);
    });

    it('should return PHOTOS for a photo', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID);
        rootNode.type = NodeType.Album;
        const photoNode = createMockNode('photo-node-uid', 'uid1');
        photoNode.type = NodeType.Photo;

        const drive = createDriveStub(false /* isPrivateDefaultClient */, rootNode);
        const result = await getNodeLocation(drive, [rootNode, photoNode]);

        expect(result).toBe(NodeLocation.PHOTOS);
    });

    it('should return DEVICES', async () => {
        const deviceRootNode = createMockNode('deviceId', NO_PARENT_UID);
        const childNode1 = createMockNode('uid2', 'uid1');

        const myFilesRootNode = createMockNode('uid1', NO_PARENT_UID);
        const drive = createDriveStub(true /* isPrivateDefaultClient */, myFilesRootNode);
        const result = await getNodeLocation(drive, [deviceRootNode, childNode1]);

        expect(result).toBe(NodeLocation.DEVICES);
    });

    it('should return PUBLIC_PAGE', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID);
        const childNode1 = createMockNode('uid2', 'uid1');
        const lastNode = createMockNode('uid3', 'uid2');

        const drive = createDriveStub(false /* isPrivateDefaultClient */, rootNode);
        const result = await getNodeLocation(drive, [rootNode, childNode1, lastNode]);

        expect(result).toBe(NodeLocation.PUBLIC_PAGE);
    });

    it('should return PUBLIC_PAGE even when root node has membership on a public client', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID, MemberRole.Viewer, true);
        const childNode1 = createMockNode('uid2', 'uid1', MemberRole.Viewer, true);
        const lastNode = createMockNode('uid3', 'uid2', MemberRole.Viewer, true);

        const drive = createDriveStub(false /* isPrivateDefaultClient */, rootNode);
        const result = await getNodeLocation(drive, [rootNode, childNode1, lastNode]);

        expect(result).toBe(NodeLocation.PUBLIC_PAGE);
    });
});

describe('formatNodeLocation', () => {
    it('should format My Files location with a long path', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID);
        const childNode1 = createMockNode('uid2', 'uid1');
        const lastNode = createMockNode('uid3', 'uid2');

        rootNode.name = { ok: true, value: 'volume1Root' };
        childNode1.name = { ok: true, value: 'folder1' };
        lastNode.name = { ok: true, value: 'folder2' };

        expect(formatNodeLocation(NodeLocation.MY_FILES, [rootNode, childNode1, lastNode])).toBe(
            '/My files/folder1/folder2'
        );
    });

    describe('It should render leading slash for one folder deep path', () => {
        it('should render leading slash for "/My files"', async () => {
            const rootNode = createMockNode('uid1', NO_PARENT_UID);
            rootNode.name = { ok: true, value: 'volume1Root' };
            expect(formatNodeLocation(NodeLocation.MY_FILES, [rootNode])).toBe('/My files');
        });

        it('should render leading slash for "/Shared with me"', async () => {
            expect(formatNodeLocation(NodeLocation.SHARED_WITH_ME, [])).toBe('/Shared with me');
        });

        it('should render leading slash for "/Photos"', async () => {
            expect(formatNodeLocation(NodeLocation.PHOTOS, [])).toBe('/Photos');
        });
    });

    it('should format Shared With Me location', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID);
        const childNode1 = createMockNode('uid2', 'uid1');
        const lastNode = createMockNode('uid3', 'uid2');

        rootNode.name = { ok: true, value: 'folder1' };
        childNode1.name = { ok: true, value: 'folder2' };
        lastNode.name = { ok: true, value: 'folder3' };

        expect(formatNodeLocation(NodeLocation.SHARED_WITH_ME, [rootNode, childNode1, lastNode])).toBe(
            '/Shared with me/folder1/folder2/folder3'
        );
    });

    it('should format public page location', async () => {
        const childNode1 = createMockNode('uid2', NO_PARENT_UID);
        const lastNode = createMockNode('uid3', 'uid2');

        childNode1.name = { ok: true, value: 'folder1' };
        lastNode.name = { ok: true, value: 'folder2' };

        expect(formatNodeLocation(NodeLocation.PUBLIC_PAGE, [childNode1, lastNode])).toBe('/folder1/folder2');
    });

    it('should format photos location', async () => {
        const albumNode = createMockNode('uid1', NO_PARENT_UID);
        const photoNode = createMockNode('uid2', 'uid1');

        albumNode.name = { ok: true, value: 'album' };
        albumNode.type = NodeType.Album;
        photoNode.name = { ok: true, value: 'photo' };
        photoNode.type = NodeType.Photo;

        // We never show the sub path for Photos assets only /Photos
        expect(formatNodeLocation(NodeLocation.PHOTOS, [albumNode, photoNode])).toBe('/Photos');
    });

    it('should format devices location', async () => {
        const rootDevice = createMockNode('rootDevice', NO_PARENT_UID);
        const childNode1 = createMockNode('uid1', 'rootDevice');
        const lastNode = createMockNode('uid2', 'uid1');

        rootDevice.name = { ok: true, value: 'Computer #1' };
        childNode1.name = { ok: true, value: 'folder1' };
        lastNode.name = { ok: true, value: 'folder2' };

        expect(formatNodeLocation(NodeLocation.DEVICES, [rootDevice, childNode1, lastNode])).toBe(
            '/Devices/Computer #1/folder1/folder2'
        );
    });
});

describe('getFormattedNodeLocation', () => {
    it('should format a node in My files', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID);
        const childNode1 = createMockNode('uid2', 'uid1');
        const lastNode = createMockNode('uid3', 'uid2');

        const drive = createDriveStub(true /* isPrivateDefaultClient */, rootNode);
        drive.getNode.mockResolvedValueOnce(lastNode).mockResolvedValueOnce(childNode1).mockResolvedValueOnce(rootNode);

        const formattedLocation = await getFormattedNodeLocation(drive, lastNode);

        expect(formattedLocation).toBe('/My files/node-uid2');
        // The parents are walked only once.
        expect(drive.getNode).toHaveBeenCalledTimes(3);
    });
});

describe('getFormattedNodeLocationFromHierarchy', () => {
    it('should format a deeply nested node in My files without loading any node', async () => {
        const rootNode = createMockNode('uid0', NO_PARENT_UID);
        const folders = Array.from({ length: 6 }, (_, i) => createMockNode(`uid${i + 1}`, `uid${i}`));
        const drive = createDriveStub(true /* isPrivateDefaultClient */, rootNode);

        const formattedLocation = await getFormattedNodeLocationFromHierarchy(drive, [rootNode, ...folders]);

        expect(formattedLocation).toBe('/My files/node-uid1/node-uid2/node-uid3/node-uid4/node-uid5');
        expect(drive.getNode).not.toHaveBeenCalled();
    });

    it('should format a photo as Photos only', async () => {
        const albumNode = createMockNode('album', NO_PARENT_UID);
        albumNode.type = NodeType.Album;
        const photoNode = createMockNode('photo', 'album');
        photoNode.type = NodeType.Photo;
        const drive = createDriveStub(true /* isPrivateDefaultClient */, createMockNode('my-files-root'));

        expect(await getFormattedNodeLocationFromHierarchy(drive, [albumNode, photoNode])).toBe('/Photos');
    });
});

describe('getFormattedNodeLocationUsingHierarchy', () => {
    it('should format the location from a single hierarchy load', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID);
        const childNode = createMockNode('uid2', 'uid1');
        const lastNode = createMockNode('uid3', 'uid2');
        const drive = {
            ...createDriveStub(true /* isPrivateDefaultClient */, rootNode),
            getNodeHierarchy: jest.fn().mockResolvedValue([rootNode, childNode, lastNode]),
        };

        expect(await getFormattedNodeLocationUsingHierarchy(drive, lastNode)).toBe('/My files/node-uid2');
        expect(drive.getNodeHierarchy).toHaveBeenCalledTimes(1);
        expect(drive.getNode).not.toHaveBeenCalled();
    });

    it('should return an unknown location when the hierarchy cannot be loaded', async () => {
        const rootNode = createMockNode('uid1', NO_PARENT_UID);
        const drive = {
            ...createDriveStub(true /* isPrivateDefaultClient */, rootNode),
            getNodeHierarchy: jest.fn().mockRejectedValue(new Error('Permission denied')),
        };

        expect(await getFormattedNodeLocationUsingHierarchy(drive, createMockNode('uid2', 'uid1'))).toBe(
            'Unknown location'
        );
    });
});
