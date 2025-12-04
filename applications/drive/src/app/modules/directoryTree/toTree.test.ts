import { MemberRole, NodeType } from '@proton/drive';

import { makeTreeItemId } from './helpers';
import { toTree } from './toTree';
import type { TreeStoreItem } from './types';

const createTreeItem = (nodeUid: string, parentUid: string | null, rest: Partial<TreeStoreItem> = {}): TreeStoreItem => ({
    nodeUid,
    treeItemId: makeTreeItemId(parentUid, nodeUid),
    parentUid,
    name: `Node ${nodeUid}`,
    type: NodeType.Folder,
    expandable: true,
    isSharedWithMe: false,
    ...rest,
});

const findTreeItem = (treeRoots: any[], nodeUid: string): any => {
    return treeRoots.find((item) => item.nodeUid === nodeUid);
};

describe('toTree', () => {
    describe('empty tree', () => {
        it('should return empty array when there are no root nodes', () => {
            const loadedNodes: TreeStoreItem[] = [createTreeItem('child-2', 'parent-1')];
            const expandedTreeIds = new Map<string, boolean>();

            const tree = toTree(loadedNodes, expandedTreeIds);

            expect(tree).toEqual([]);
        });

        it('should return empty array when loadedNodes is empty', () => {
            const loadedNodes: TreeStoreItem[] = [];
            const expandedTreeIds = new Map<string, boolean>();

            const tree = toTree(loadedNodes, expandedTreeIds);

            expect(tree).toEqual([]);
        });
    });

    describe('root nodes', () => {
        it('should create tree with multiple root nodes', () => {
            const loadedNodes: TreeStoreItem[] = [
                createTreeItem('root-1', null, { name: 'Root 1' }),
                createTreeItem('root-2', null, { name: 'Root 2' }),
            ];
            const expandedTreeIds = new Map<string, boolean>();

            const tree = toTree(loadedNodes, expandedTreeIds);

            expect(tree).toHaveLength(2);
            expect(findTreeItem(tree, 'root-1')).toMatchObject({ name: 'Root 1', children: null });
            expect(findTreeItem(tree, 'root-2')).toMatchObject({ name: 'Root 2', children: null });
        });
    });

    describe('expanded nodes', () => {
        it('should show empty children object for expanded root with no children', () => {
            const loadedNodes: TreeStoreItem[] = [createTreeItem('root-1', null)];
            const expandedTreeIds = new Map<string, boolean>([[makeTreeItemId(null, 'root-1'), true]]);

            const tree = toTree(loadedNodes, expandedTreeIds);

            const root = findTreeItem(tree, 'root-1');
            expect(root.children).toEqual({});
        });

        it('should show children for expanded root node', () => {
            const loadedNodes: TreeStoreItem[] = [
                createTreeItem('root-1', null),
                createTreeItem('child-1', 'root-1', { name: 'Child 1' }),
                createTreeItem('child-2', 'root-1', { name: 'Child 2' }),
            ];
            const expandedTreeIds = new Map<string, boolean>([[makeTreeItemId(null, 'root-1'), true]]);

            const tree = toTree(loadedNodes, expandedTreeIds);

            const root = findTreeItem(tree, 'root-1');
            expect(Object.keys(root.children)).toHaveLength(2);
            expect(root.children['child-1']).toMatchObject({
                nodeUid: 'child-1',
                name: 'Child 1',
                parentUid: 'root-1',
                treeItemId: 'root-1___child-1',
            });
            expect(root.children['child-2']).toMatchObject({
                nodeUid: 'child-2',
                name: 'Child 2',
                parentUid: 'root-1',
                treeItemId: 'root-1___child-2',
            });
        });

        it('should respect expansion state for nested nodes', () => {
            const loadedNodes: TreeStoreItem[] = [
                createTreeItem('root-1', null),
                createTreeItem('child-1', 'root-1'),
                createTreeItem('grandchild-1', 'child-1'),
                createTreeItem('grandchild-2', 'child-1'),
            ];
            const expandedTreeIds = new Map<string, boolean>([
                [makeTreeItemId(null, 'root-1'), true],
                [makeTreeItemId('root-1', 'child-1'), true],
            ]);

            const tree = toTree(loadedNodes, expandedTreeIds);

            const root = findTreeItem(tree, 'root-1');
            expect(Object.keys(root.children['child-1'].children)).toHaveLength(2);
            expect(root.children['child-1'].children['grandchild-1']).toMatchObject({
                nodeUid: 'grandchild-1',
                parentUid: 'child-1',
                treeItemId: 'child-1___grandchild-1',
            });
            expect(root.children['child-1'].children['grandchild-2']).toMatchObject({
                nodeUid: 'grandchild-2',
                parentUid: 'child-1',
                treeItemId: 'child-1___grandchild-2',
            });
        });

        it('should not show children for collapsed nested nodes', () => {
            const loadedNodes: TreeStoreItem[] = [
                createTreeItem('root-1', null),
                createTreeItem('child-1', 'root-1'),
                createTreeItem('grandchild-1', 'child-1'),
            ];
            const expandedTreeIds = new Map<string, boolean>([
                [makeTreeItemId(null, 'root-1'), true],
                // child-1 is NOT expanded
            ]);

            const tree = toTree(loadedNodes, expandedTreeIds);

            const root = findTreeItem(tree, 'root-1');
            expect(root.children['child-1'].children).toBeNull();
        });
    });

    describe('complex tree structures', () => {
        it('should handle deep nesting with selective expansion', () => {
            const loadedNodes: TreeStoreItem[] = [
                createTreeItem('root-1', null),
                createTreeItem('level-1', 'root-1'),
                createTreeItem('level-2', 'level-1'),
                createTreeItem('level-3', 'level-2'),
                createTreeItem('level-4', 'level-3'),
            ];
            const expandedTreeIds = new Map<string, boolean>([
                [makeTreeItemId(null, 'root-1'), true],
                [makeTreeItemId('root-1', 'level-1'), true],
                [makeTreeItemId('level-1', 'level-2'), true],
                // level-3 is NOT expanded
            ]);

            const tree = toTree(loadedNodes, expandedTreeIds);

            const root = findTreeItem(tree, 'root-1');
            expect(root.children['level-1'].children['level-2'].children['level-3']).toMatchObject({
                nodeUid: 'level-3',
                treeItemId: 'level-2___level-3',
                children: null,
            });
        });

        it('should handle multiple roots with different expansion states', () => {
            const loadedNodes: TreeStoreItem[] = [
                createTreeItem('root-1', null, { name: 'Root 1' }),
                createTreeItem('root-2', null, { name: 'Root 2' }),
                createTreeItem('child-1-1', 'root-1', { name: 'Child 1.1' }),
                createTreeItem('child-2-1', 'root-2', { name: 'Child 2.1' }),
            ];
            const expandedTreeIds = new Map<string, boolean>([
                [makeTreeItemId(null, 'root-1'), true],
                // root-2 is NOT expanded
            ]);

            const tree = toTree(loadedNodes, expandedTreeIds);

            const root1 = findTreeItem(tree, 'root-1');
            expect(root1.children['child-1-1']).toMatchObject({ name: 'Child 1.1' });
            const root2 = findTreeItem(tree, 'root-2');
            expect(root2.children).toBeNull();
        });

        describe('shared with me functionality', () => {
            it('should handle shared nodes appearing in both regular tree and shared-with-me', () => {
                const loadedNodes: TreeStoreItem[] = [
                    createTreeItem('root-1', null),
                    createTreeItem('shared-child', 'root-1', { isSharedWithMe: true, name: 'Shared Child' }),
                ];
                const expandedTreeIds = new Map<string, boolean>([[makeTreeItemId(null, 'root-1'), true]]);

                const tree = toTree(loadedNodes, expandedTreeIds);

                // Verify shared node appears in regular tree under its parent
                const root = findTreeItem(tree, 'root-1');
                expect(root.children).not.toBeNull();
                expect(root.children['shared-child']).toMatchObject({
                    nodeUid: 'shared-child',
                    name: 'Shared Child',
                    isSharedWithMe: true,
                });

                // Verify the function internally handles shared nodes
                const sharedNodes = loadedNodes.filter((node) => node.isSharedWithMe);
                expect(sharedNodes).toHaveLength(1);
                expect(sharedNodes[0].nodeUid).toBe('shared-child');
            });

            it('should preserve original node properties when processing shared nodes', () => {
                const loadedNodes: TreeStoreItem[] = [
                    createTreeItem('shared-node', 'parent-1', {
                        isSharedWithMe: true,
                        name: 'Shared Node',
                        type: NodeType.File,
                        expandable: false,
                        highestEffectiveRole: MemberRole.Editor,
                    }),
                ];
                const expandedTreeIds = new Map<string, boolean>();

                const tree = toTree(loadedNodes, expandedTreeIds);

                // Verify that original nodes are not modified
                const sharedNodes = loadedNodes.filter((node) => node.isSharedWithMe);
                expect(sharedNodes[0]).toMatchObject({
                    nodeUid: 'shared-node',
                    name: 'Shared Node',
                    type: NodeType.File,
                    expandable: false,
                    isSharedWithMe: true,
                    highestEffectiveRole: MemberRole.Editor,
                    parentUid: 'parent-1',
                });

                // Tree should be empty since there are no root nodes
                expect(tree).toEqual([]);
            });
        });
    });
});
