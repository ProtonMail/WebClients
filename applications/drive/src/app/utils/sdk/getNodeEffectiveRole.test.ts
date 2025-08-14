import type { NodeEntity, ProtonDriveClient } from '@proton/drive/index';
import { MemberRole, NodeType } from '@proton/drive/index';

import { getNodeEffectiveRole } from './getNodeEffectiveRole';

describe('getNodeEffectiveRole', () => {
    let mockDrive: jest.Mocked<ProtonDriveClient>;

    beforeEach(() => {
        mockDrive = {
            getNode: jest.fn(),
        } as any;
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const createMockNode = (
        uid: string,
        directMemberRole: MemberRole = MemberRole.Viewer,
        parentUid?: string
    ): NodeEntity => ({
        uid,
        parentUid,
        directMemberRole,
        name: `node-${uid}`,
        keyAuthor: { ok: true, value: 'test@proton.me' },
        nameAuthor: { ok: true, value: 'test@proton.me' },
        type: NodeType.Folder,
        mediaType: 'text/plain',
        isShared: false,
        creationTime: new Date(),
        trashTime: undefined,
        totalStorageSize: 0,
        activeRevision: undefined,
        folder: undefined,
        treeEventScopeId: 'treeEventScopeId',
    });

    describe('when has no parent node', () => {
        it('should return the provided role', async () => {
            const node = createMockNode('root-node', MemberRole.Editor);
            const result = await getNodeEffectiveRole(node, mockDrive);

            expect(result).toBe(MemberRole.Editor);
            expect(mockDrive.getNode).not.toHaveBeenCalled();
        });

        it('should default on Viewer role when no role provided and no parent', async () => {
            const node = createMockNode('root-node');
            const result = await getNodeEffectiveRole(node, mockDrive);

            expect(result).toBe(MemberRole.Viewer);
            expect(mockDrive.getNode).not.toHaveBeenCalled();
        });

        it('should return Viewer role when node has Inherited role and no parent', async () => {
            const node = createMockNode('root-node', MemberRole.Inherited);
            const result = await getNodeEffectiveRole(node, mockDrive);

            expect(result).toBe(MemberRole.Viewer);
            expect(mockDrive.getNode).not.toHaveBeenCalled();
        });
    });

    describe('when has parent nodes', () => {
        it('should traverse up to parent if role is lower than Admin', async () => {
            const parentNode = createMockNode('parent-node', MemberRole.Editor);
            const childNode = createMockNode('child-node', MemberRole.Inherited, 'parent-node');

            mockDrive.getNode.mockResolvedValue({ ok: true, value: parentNode });
            const result = await getNodeEffectiveRole(childNode, mockDrive);

            expect(mockDrive.getNode).toHaveBeenCalledWith('parent-node');
            expect(result).toBe(MemberRole.Editor);
        });

        it('should traverse up to granparent if role is lower than Admin', async () => {
            const grandparentNode = createMockNode('grandparent-node', MemberRole.Admin);
            const parentNode = createMockNode('parent-node', MemberRole.Editor, 'grandparent-node');
            const childNode = createMockNode('child-node', MemberRole.Viewer, 'parent-node');

            mockDrive.getNode
                .mockResolvedValueOnce({ ok: true, value: parentNode })
                .mockResolvedValueOnce({ ok: true, value: grandparentNode });

            const result = await getNodeEffectiveRole(childNode, mockDrive);

            expect(mockDrive.getNode).toHaveBeenCalledTimes(2);
            expect(mockDrive.getNode).toHaveBeenCalledWith('parent-node');
            expect(mockDrive.getNode).toHaveBeenCalledWith('grandparent-node');
            expect(result).toBe(MemberRole.Admin);
        });

        it('should stop traversing if parent has Admin role', async () => {
            const grandparentNode = createMockNode('grandparent-node', MemberRole.Inherited);
            const parentNode = createMockNode('parent-node', MemberRole.Admin, 'grandparent-node');
            const childNode = createMockNode('child-node', MemberRole.Viewer, 'parent-node');

            mockDrive.getNode
                .mockResolvedValueOnce({ ok: true, value: parentNode })
                .mockResolvedValueOnce({ ok: true, value: grandparentNode });

            const result = await getNodeEffectiveRole(childNode, mockDrive);

            expect(mockDrive.getNode).toHaveBeenCalledTimes(1);
            expect(mockDrive.getNode).toHaveBeenCalledWith('parent-node');
            expect(mockDrive.getNode).not.toHaveBeenCalledWith('grandparent-node');
            expect(result).toBe(MemberRole.Admin);
        });
    });
});
