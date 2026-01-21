import type { NodeEntity, ProtonDriveClient, Result } from '@proton/drive/index';
import { MemberRole, NodeType } from '@proton/drive/index';

import { getNodeAncestry } from './getNodeAncestry';
import { getNodeEntity } from './getNodeEntity';

describe('getNodeAncestry', () => {
    let mockDrive: jest.Mocked<ProtonDriveClient>;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDrive = {
            getNode: jest.fn(),
        } as any;
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
    });

    const createMockNode = (uid: string, parentUid?: string): NodeEntity => ({
        uid,
        parentUid,
        directRole: MemberRole.Viewer,
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
    });

    const NO_PARENT_UID = undefined;

    it('should return the just the current node when no parent', async () => {
        const node1 = createMockNode('uid1', NO_PARENT_UID);
        mockDrive.getNode.mockResolvedValue({ ok: true, value: node1 });

        const result = await getNodeAncestry(node1.uid, mockDrive);
        expect(result.ok).toBe(true);
        assertOk(result); // Narrow TS type for rest of the test.

        const nodes = result.value.map((maybeNode) => getNodeEntity(maybeNode).node);
        expect(nodes).toEqual([node1]);
        expect(mockDrive.getNode).toHaveBeenCalledWith('uid1');
        expect(mockDrive.getNode).toHaveBeenCalledTimes(1);
    });

    it('should get the ancestrors and the current node', async () => {
        const node1 = createMockNode('uid1', NO_PARENT_UID);
        const node2 = createMockNode('uid2', 'uid1');
        const node3 = createMockNode('uid3', 'uid2');
        const lastNode = createMockNode('uid4', 'uid3');

        mockDrive.getNode
            .mockResolvedValueOnce({ ok: true, value: lastNode })
            .mockResolvedValueOnce({ ok: true, value: node3 })
            .mockResolvedValueOnce({ ok: true, value: node2 })
            .mockResolvedValueOnce({ ok: true, value: node1 });

        const result = await getNodeAncestry(lastNode.uid, mockDrive);
        expect(result.ok).toEqual(true);
        assertOk(result); // Narrow TS type for rest of the test.

        const nodes = result.value.map((maybeNode) => getNodeEntity(maybeNode).node);
        expect(nodes).toEqual([node1, node2, node3, lastNode]);
        expect(mockDrive.getNode).toHaveBeenCalledTimes(4);
    });

    it('should handle exceptions gracefully', async () => {
        const node1 = createMockNode('uid1', NO_PARENT_UID);
        const expectedError = new Error('Drive fetch error');
        mockDrive.getNode.mockImplementation(() => {
            throw expectedError;
        });

        const result = await getNodeAncestry(node1.uid, mockDrive);
        expect(result.ok).toBe(false);

        assertResultNotOk(result); // Narrow TS type for rest of the test.
        expect(result.error).toEqual(expectedError);
    });
});

function assertOk<T, E>(result: Result<T, E>): asserts result is { ok: true; value: T } {
    if (!result.ok) {
        throw new Error('Expected ok result');
    }
}

function assertResultNotOk<T, E>(result: Result<T, E>): asserts result is { ok: false; error: E } {
    if (result.ok) {
        throw new Error('Expected not ok result');
    }
}
