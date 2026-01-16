import type { MaybeNode } from '@proton/drive';

export function getNodeDisplaySize(node: MaybeNode): number | undefined {
    const activeRevision = node.ok ? { ok: true, value: node.value.activeRevision } : node.error.activeRevision;
    if (activeRevision?.ok && activeRevision.value) {
        if (activeRevision.value.claimedSize) {
            return activeRevision.value.claimedSize;
        }
        if (activeRevision.value.storageSize) {
            return activeRevision.value.storageSize;
        }
    }

    return node.ok ? node.value.totalStorageSize : node.error.totalStorageSize;
}
