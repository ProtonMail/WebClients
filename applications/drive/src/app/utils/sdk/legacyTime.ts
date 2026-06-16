import type { NormalizedNode } from '@proton/drive/legacy/sdkUtils/getNodeEntity';

export const dateToLegacyTimestamp = (date: Date) => Math.floor(date.getTime() / 1000);

export const legacyTimestampToDate = (timestamp: number) => new Date(timestamp * 1000);

export const getLegacyModifiedTime = (node: NormalizedNode) => {
    const date = node.activeRevision?.claimedModificationTime
        ? node.activeRevision.claimedModificationTime
        : node.modificationTime;

    return dateToLegacyTimestamp(date);
};

export const getLegacyTrashedTime = (node: NormalizedNode) =>
    node.trashTime ? dateToLegacyTimestamp(node.trashTime) : null;
