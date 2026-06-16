import type { NodeEntity } from '@proton/drive';

export function getNodeDisplaySize(node: NodeEntity): number | undefined {
    const activeRevision = node.activeRevision?.ok ? node.activeRevision.value : undefined;
    if (activeRevision) {
        if (activeRevision.claimedSize) {
            return activeRevision.claimedSize;
        }
        if (activeRevision.storageSize) {
            return activeRevision.storageSize;
        }
    }

    return node.totalStorageSize;
}
