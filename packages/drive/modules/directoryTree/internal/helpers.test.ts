import { sendErrorReport } from '../../../legacy/errorHandling';
import type { NodeEntity, ProtonDriveClient } from '../../../sdk';
import { MemberRole } from '../../../sdk';
import { findEffectiveRole } from './helpers';

jest.mock('../../../legacy/errorHandling');

const createMockNode = (
    directRole: MemberRole,
    parentUid?: string | null,
    overrides?: Partial<NodeEntity>
): NodeEntity =>
    ({
        uid: 'test-uid',
        parentUid: parentUid ?? null,
        directRole,
        name: { ok: true, value: 'Test Node' },
        ...overrides,
    }) as NodeEntity;

describe('findEffectiveRole', () => {
    describe('early return for Admin role', () => {
        it('should return Admin immediately if node has Admin role', async () => {
            const mockDrive = {} as ProtonDriveClient;
            const node = createMockNode(MemberRole.Admin, 'parent-1');

            const result = await findEffectiveRole(mockDrive, node);

            expect(result).toBe(MemberRole.Admin);
        });
    });

    describe('root nodes without parent', () => {
        it('should return directRole when node has no parent', async () => {
            const mockDrive = {} as ProtonDriveClient;
            const node = createMockNode(MemberRole.Editor, null);

            const result = await findEffectiveRole(mockDrive, node);

            expect(result).toBe(MemberRole.Editor);
        });
    });

    describe('traversing parent hierarchy', () => {
        it('should load the parent hierarchy when parent exists', async () => {
            const parentNode = createMockNode(MemberRole.Editor, null);
            const childNode = createMockNode(MemberRole.Viewer, 'parent-1');

            const mockDrive = {
                getNodeHierarchy: jest.fn().mockResolvedValue([parentNode]),
            } as unknown as ProtonDriveClient;

            const result = await findEffectiveRole(mockDrive, childNode);

            expect(mockDrive.getNodeHierarchy).toHaveBeenCalledWith('parent-1');
            expect(result).toBe(MemberRole.Editor);
        });

        it('should look at every ancestor to find highest role', async () => {
            const rootNode = createMockNode(MemberRole.Admin, null);
            const parentNode = createMockNode(MemberRole.Editor, 'root-1');
            const childNode = createMockNode(MemberRole.Viewer, 'parent-1');

            const mockDrive = {
                getNodeHierarchy: jest.fn().mockResolvedValue([rootNode, parentNode]),
            } as unknown as ProtonDriveClient;

            const result = await findEffectiveRole(mockDrive, childNode);

            expect(result).toBe(MemberRole.Admin);
        });

        it('should propagate an error when the hierarchy cannot be loaded', async () => {
            const childNode = createMockNode(MemberRole.Viewer, 'parent-1');
            const error = new Error('Permission denied');

            const mockDrive = {
                getNodeHierarchy: jest.fn().mockRejectedValue(error),
            } as unknown as ProtonDriveClient;

            await expect(findEffectiveRole(mockDrive, childNode)).rejects.toBe(error);
        });
    });

    describe('role comparison logic', () => {
        it.each([
            [MemberRole.Editor, MemberRole.Viewer, MemberRole.Editor],
            [MemberRole.Viewer, MemberRole.Editor, MemberRole.Editor],
            [MemberRole.Inherited, MemberRole.Editor, MemberRole.Editor],
            [MemberRole.Inherited, MemberRole.Viewer, MemberRole.Viewer],
        ])('should combine parent %s and child %s into %s', async (parentRole, childRole, expected) => {
            const parentNode = createMockNode(parentRole, null);
            const childNode = createMockNode(childRole, 'parent-1');

            const mockDrive = {
                getNodeHierarchy: jest.fn().mockResolvedValue([parentNode]),
            } as unknown as ProtonDriveClient;

            const result = await findEffectiveRole(mockDrive, childNode);

            expect(result).toBe(expected);
        });
    });

    it('should report an error and fall back to Viewer when every role is Inherited', async () => {
        const parentNode = createMockNode(MemberRole.Inherited, null);
        const childNode = createMockNode(MemberRole.Inherited, 'parent-1');

        const mockDrive = {
            getNodeHierarchy: jest.fn().mockResolvedValue([parentNode]),
        } as unknown as ProtonDriveClient;

        const result = await findEffectiveRole(mockDrive, childNode);

        expect(result).toBe(MemberRole.Viewer);
        expect(sendErrorReport).toHaveBeenCalledTimes(1);
    });

    describe('nodes with name errors', () => {
        it('should work with nodes that have name errors (previously degraded nodes)', async () => {
            const parentNode = createMockNode(MemberRole.Editor, null, {
                name: { ok: false, error: new Error('Encrypted') },
            });
            const childNode = createMockNode(MemberRole.Viewer, 'parent-1', {
                name: { ok: false, error: new Error('Encrypted') },
            });

            const mockDrive = {
                getNodeHierarchy: jest.fn().mockResolvedValue([parentNode]),
            } as unknown as ProtonDriveClient;

            const result = await findEffectiveRole(mockDrive, childNode);

            expect(mockDrive.getNodeHierarchy).toHaveBeenCalledWith('parent-1');
            expect(result).toBe(MemberRole.Editor);
        });
    });

    describe('complex hierarchies', () => {
        it('should find highest role in deep hierarchy with a single hierarchy call', async () => {
            const level3Node = createMockNode(MemberRole.Admin, null);
            const level2Node = createMockNode(MemberRole.Editor, 'level-3');
            const level1Node = createMockNode(MemberRole.Viewer, 'level-2');
            const level0Node = createMockNode(MemberRole.Inherited, 'level-1');

            const mockDrive = {
                getNode: jest.fn(),
                getNodeHierarchy: jest.fn().mockResolvedValue([level3Node, level2Node, level1Node]),
            } as unknown as ProtonDriveClient;

            const result = await findEffectiveRole(mockDrive, level0Node);

            expect(mockDrive.getNodeHierarchy).toHaveBeenCalledTimes(1);
            expect(mockDrive.getNodeHierarchy).toHaveBeenCalledWith('level-1');
            expect(mockDrive.getNode).not.toHaveBeenCalled();
            expect(result).toBe(MemberRole.Admin);
        });
    });
});
