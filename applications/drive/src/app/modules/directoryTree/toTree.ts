import { SHARED_WITH_ME_ROOT_ID, makeTreeItemId } from './helpers';
import type { TreeStoreItem } from './types';

interface TreeItemWithChildren extends TreeStoreItem {
    children: Record<string, TreeItemWithChildren> | null;
}

export function toTree(loadedNodes: TreeStoreItem[], expandedTreeIds: Map<string, boolean>): TreeItemWithChildren[] {
    const groupedByParent = Object.groupBy(loadedNodes, (node: TreeStoreItem) => node.parentUid ?? 'root') as Record<
        string,
        TreeStoreItem[]
    >;
    // Manually creating "shared with me" group because of directly shared children of a share that need to appear twice
    groupedByParent[SHARED_WITH_ME_ROOT_ID] = loadedNodes
        .filter((node) => node.isSharedWithMe)
        .map((node) => ({
            ...node,
            treeItemId: makeTreeItemId(SHARED_WITH_ME_ROOT_ID, node.nodeUid),
        }));

    if (!groupedByParent.root) {
        // Tree is empty - no root items
        return [];
    }

    const tree = [];
    for (const rootNode of groupedByParent.root) {
        tree.push({
            ...rootNode,
            children: getChildren(rootNode.nodeUid, rootNode.treeItemId, groupedByParent, expandedTreeIds),
        });
    }
    return tree;
}

function getChildren(
    parentNodeUid: string,
    treeItemId: string,
    groupedByParent: Record<string, TreeStoreItem[]>,
    expandedTreeIds: Map<string, boolean>
) {
    if (!expandedTreeIds.get(treeItemId)) {
        return null;
    }

    if (!groupedByParent[parentNodeUid]) {
        // Expanded, but has no children
        return {};
    }

    const children: Record<string, TreeItemWithChildren> = {};
    for (const node of groupedByParent[parentNodeUid]) {
        children[node.nodeUid] = {
            ...node,
            children: getChildren(node.nodeUid, node.treeItemId, groupedByParent, expandedTreeIds),
        };
    }
    return children;
}
