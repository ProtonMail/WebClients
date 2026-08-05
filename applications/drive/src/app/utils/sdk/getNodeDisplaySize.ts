import type { NodeEntity } from '@proton/drive';

export function getNodeDisplaySize(node: NodeEntity): number | undefined {
    if (node.activeRevision) {
        if (node.activeRevision.claimedSize) {
            return node.activeRevision.claimedSize;
        }
        if (node.activeRevision.storageSize) {
            return node.activeRevision.storageSize;
        }
    }

    return node.totalStorageSize;
}
