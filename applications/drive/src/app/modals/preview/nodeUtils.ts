import type { NodeEntity } from '@proton/drive';
import { NodeType } from '@proton/drive';
import { parseAdditionalMetadata } from '@proton/drive/modules/extendedAttributes';

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

    return node.activeRevision?.uid;
}

/**
 * Clear-text media duration (seconds) captured at upload time. Needed for the
 * MSE seek bar: a fragmented MP4 carries no duration of its own, so MSE only
 * knows what it has buffered unless we feed it this value.
 */
export function getNodeMediaDuration(node?: NodeEntity): number | undefined {
    if (!node?.activeRevision) {
        return undefined;
    }
    return parseAdditionalMetadata(node.activeRevision.claimedAdditionalMetadata).media?.duration;
}

export function getNodeStorageSize(node: NodeEntity): number | undefined {
    if (node.activeRevision) {
        return node.activeRevision.storageSize;
    }

    return node.totalStorageSize ?? 0;
}
