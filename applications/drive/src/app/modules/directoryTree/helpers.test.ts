import type { DegradedNode, NodeEntity, ProtonDriveClient } from '@proton/drive';
import { MemberRole } from '@proton/drive';

import { findEffectiveRole } from './helpers';

const createMockNode = (
    directRole: MemberRole,
    parentUid?: string | null,
    overrides?: Partial<NodeEntity>
): NodeEntity =>
    ({
        uid: 'test-uid',
        parentUid: parentUid ?? null,
        directRole,
        name: 'Test Node',
        ...overrides,
    }) as NodeEntity;

const createMockDegradedNode = (
    directRole: MemberRole,
    parentUid?: string | null,
    overrides?: Partial<DegradedNode>
): DegradedNode =>
    ({
        uid: 'test-uid',
        parentUid: parentUid ?? null,
        directRole,
        name: { ok: false, error: new Error('Encrypted') },
        ...overrides,
    }) as DegradedNode;

describe('findEffectiveRole', () => {
    describe('early return for Admin role', () => {
        it('should return Admin immediately if node has Admin role', async () => {
            const mockDrive = {} as ProtonDriveClient;
            const node = createMockNode(MemberRole.Admin, 'parent-1');

            const result = await findEffectiveRole(mockDrive, node);

            expect(result).toBe(MemberRole.Admin);
        });

        it('should return Admin immediately even with previousHighestRole', async () => {
            const mockDrive = {} as ProtonDriveClient;
            const node = createMockNode(MemberRole.Admin, 'parent-1');

            const result = await findEffectiveRole(mockDrive, node, MemberRole.Viewer);

            expect(result).toBe(MemberRole.Admin);
        });
    });

    describe('root nodes without parent', () => {
        it('should return directRole when node has no parent and no previousHighestRole', async () => {
            const mockDrive = {} as ProtonDriveClient;
            const node = createMockNode(MemberRole.Editor, null);

            const result = await findEffectiveRole(mockDrive, node);

            expect(result).toBe(MemberRole.Editor);
        });

        it('should return most permissive role at root when previousHighestRole is provided', async () => {
            const mockDrive = {} as ProtonDriveClient;
            const node = createMockNode(MemberRole.Viewer, null);

            const result = await findEffectiveRole(mockDrive, node, MemberRole.Editor);

            expect(result).toBe(MemberRole.Editor);
        });
    });

    describe('traversing parent hierarchy', () => {
        it('should traverse to parent when parent exists and no previousHighestRole', async () => {
            const parentNode = createMockNode(MemberRole.Editor, null);
            const childNode = createMockNode(MemberRole.Viewer, 'parent-1');

            const mockDrive = {
                getNode: jest.fn().mockResolvedValue({ ok: true, value: parentNode }),
            } as unknown as ProtonDriveClient;

            const result = await findEffectiveRole(mockDrive, childNode);

            expect(mockDrive.getNode).toHaveBeenCalledWith('parent-1');
            expect(result).toBe(MemberRole.Editor);
        });

        it('should traverse multiple levels to find highest role', async () => {
            const rootNode = createMockNode(MemberRole.Admin, null);
            const parentNode = createMockNode(MemberRole.Editor, 'root-1');
            const childNode = createMockNode(MemberRole.Viewer, 'parent-1');

            const mockDrive = {
                getNode: jest
                    .fn()
                    .mockResolvedValueOnce({ ok: true, value: parentNode })
                    .mockResolvedValueOnce({ ok: true, value: rootNode }),
            } as unknown as ProtonDriveClient;

            const result = await findEffectiveRole(mockDrive, childNode);

            expect(result).toBe(MemberRole.Admin);
        });
    });

    describe('role comparison logic', () => {
        it('should prefer Editor over Viewer', async () => {
            const parentNode = createMockNode(MemberRole.Viewer, null);
            const childNode = createMockNode(MemberRole.Editor, 'parent-1');

            const mockDrive = {
                getNode: jest.fn().mockResolvedValue({ ok: true, value: parentNode }),
            } as unknown as ProtonDriveClient;

            const result = await findEffectiveRole(mockDrive, childNode);

            expect(result).toBe(MemberRole.Editor);
        });

        it('should prefer Editor over Inherited', async () => {
            const rootNode = createMockNode(MemberRole.Inherited, null);
            const childNode = createMockNode(MemberRole.Editor, 'root-1');

            const mockDrive = {
                getNode: jest.fn().mockResolvedValue({ ok: true, value: rootNode }),
            } as unknown as ProtonDriveClient;

            const result = await findEffectiveRole(mockDrive, childNode);

            expect(result).toBe(MemberRole.Editor);
        });

        it('should prefer Viewer over Inherited', async () => {
            const rootNode = createMockNode(MemberRole.Inherited, null);
            const childNode = createMockNode(MemberRole.Viewer, 'root-1');

            const mockDrive = {
                getNode: jest.fn().mockResolvedValue({ ok: true, value: rootNode }),
            } as unknown as ProtonDriveClient;

            const result = await findEffectiveRole(mockDrive, childNode);

            expect(result).toBe(MemberRole.Viewer);
        });

        it('should return Inherited when all nodes have Inherited role', async () => {
            const rootNode = createMockNode(MemberRole.Inherited, null);
            const childNode = createMockNode(MemberRole.Inherited, 'root-1');

            const mockDrive = {
                getNode: jest.fn().mockResolvedValue({ ok: true, value: rootNode }),
            } as unknown as ProtonDriveClient;

            const result = await findEffectiveRole(mockDrive, childNode);

            expect(result).toBe(MemberRole.Inherited);
        });
    });

    describe('degraded node handling', () => {
        it('should work with degraded nodes', async () => {
            const parentDegradedNode = createMockDegradedNode(MemberRole.Editor, null);
            const childDegradedNode = createMockDegradedNode(MemberRole.Viewer, 'parent-1');

            const mockDrive = {
                getNode: jest.fn().mockResolvedValue({ ok: false, error: parentDegradedNode }),
            } as unknown as ProtonDriveClient;

            const result = await findEffectiveRole(mockDrive, childDegradedNode);

            expect(mockDrive.getNode).toHaveBeenCalledWith('parent-1');
            expect(result).toBe(MemberRole.Editor);
        });

        it('should handle mix of regular and degraded nodes', async () => {
            const parentNode = createMockNode(MemberRole.Admin, null);
            const childDegradedNode = createMockDegradedNode(MemberRole.Viewer, 'parent-1');

            const mockDrive = {
                getNode: jest.fn().mockResolvedValue({ ok: true, value: parentNode }),
            } as unknown as ProtonDriveClient;

            const result = await findEffectiveRole(mockDrive, childDegradedNode);

            expect(result).toBe(MemberRole.Admin);
        });
    });

    describe('complex hierarchies', () => {
        it('should find highest role in deep hierarchy', async () => {
            const level3Node = createMockNode(MemberRole.Admin, null);
            const level2Node = createMockNode(MemberRole.Editor, 'level-3');
            const level1Node = createMockNode(MemberRole.Viewer, 'level-2');
            const level0Node = createMockNode(MemberRole.Inherited, 'level-1');

            const mockDrive = {
                getNode: jest
                    .fn()
                    .mockResolvedValueOnce({ ok: true, value: level1Node })
                    .mockResolvedValueOnce({ ok: true, value: level2Node })
                    .mockResolvedValueOnce({ ok: true, value: level3Node }),
            } as unknown as ProtonDriveClient;

            const result = await findEffectiveRole(mockDrive, level0Node);

            expect(mockDrive.getNode).toHaveBeenCalledTimes(3);
            expect(result).toBe(MemberRole.Admin);
        });

        it('should stop traversing once Admin is found', async () => {
            const level2Node = createMockNode(MemberRole.Viewer, null);
            const level1Node = createMockNode(MemberRole.Admin, 'level-2');
            const level0Node = createMockNode(MemberRole.Viewer, 'level-1');

            const mockDrive = {
                getNode: jest
                    .fn()
                    .mockResolvedValueOnce({ ok: true, value: level1Node })
                    .mockResolvedValueOnce({ ok: true, value: level2Node }),
            } as unknown as ProtonDriveClient;

            const result = await findEffectiveRole(mockDrive, level0Node);

            // Should stop after finding Admin, no need to go to level-2
            expect(mockDrive.getNode).toHaveBeenCalledTimes(1);
            expect(result).toBe(MemberRole.Admin);
        });
    });
});
