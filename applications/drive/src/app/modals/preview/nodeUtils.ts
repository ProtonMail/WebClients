import type { MaybeNode } from '@proton/drive';
import { NodeType } from '@proton/drive';

export { getNodeName } from '../../utils/sdk/getNodeName';

// TODO: create node module with high-level helpers and unify usage across the app

export function isNodeFile(node: MaybeNode): boolean {
    const type = node.ok ? node.value.type : node.error.type;
    return type === NodeType.File;
}

export function getNodeMimeType(node?: MaybeNode): string | undefined {
    if (!node) {
        return undefined;
    }

    return node.ok ? node.value.mediaType : node.error.mediaType;
}

export function getSharedStatus(node?: MaybeNode): '' | 'shared' | 'inactive' | undefined {
    if (!node) {
        return undefined;
    }

    const isTrashed = node.ok ? !!node.value.trashTime : !!node.error.trashTime;
    const isShared = node.ok ? node.value.isShared : node.error.isShared;

    if (!isShared) {
        return '';
    }
    if (isTrashed) {
        return 'inactive';
    }
    return 'shared';
}

export function getNodeActiveRevisionUid(node?: MaybeNode): string | undefined {
    if (!node) {
        return undefined;
    }

    const activeRevision = node.ok ? { ok: true, value: node.value.activeRevision } : node.error.activeRevision;
    if (activeRevision?.ok && activeRevision.value) {
        return activeRevision.value.uid;
    }

    return undefined;
}

export function getNodeDisplaySize(node?: MaybeNode): number | undefined {
    if (!node) {
        return undefined;
    }

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

export function getNodeStorageSize(node: MaybeNode): number | undefined {
    const activeRevision = node.ok ? { ok: true, value: node.value.activeRevision } : node.error.activeRevision;
    if (activeRevision?.ok && activeRevision.value) {
        return activeRevision.value.storageSize;
    }

    return node.ok ? node.value.totalStorageSize : (node.error.totalStorageSize ?? 0);
}
