import type { NodeEntity } from '@proton/drive';
import { NodeType } from '@proton/drive';

export { getNodeName } from '@proton/drive/modules/nodes';

// TODO: create node module with high-level helpers and unify usage across the app

export function isNodeFile(node: NodeEntity): boolean {
    return node.type === NodeType.File;
}

export function getNodeMimeType(node?: NodeEntity): string | undefined {
    if (!node) {
        return undefined;
    }

    return node.mediaType;
}

export function getSharedStatus(node?: NodeEntity): '' | 'shared' | 'inactive' | undefined {
    if (!node) {
        return undefined;
    }

    if (!node.isShared) {
        return '';
    }
    if (node.trashTime) {
        return 'inactive';
    }
    return 'shared';
}

export function getNodeActiveRevisionUid(node?: NodeEntity): string | undefined {
    if (!node) {
        return undefined;
    }

    if (node.activeRevision?.ok && node.activeRevision.value) {
        return node.activeRevision.value.uid;
    }

    return undefined;
}

export function getNodeStorageSize(node: NodeEntity): number | undefined {
    if (node.activeRevision?.ok && node.activeRevision.value) {
        return node.activeRevision.value.storageSize;
    }

    return node.totalStorageSize ?? 0;
}
