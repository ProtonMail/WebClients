import { type NodeEntity } from '@proton/drive';

export const dateToLegacyTimestamp = (date: Date) => Math.floor(date.getTime() / 1000);

export const getLegacyModifiedTime = (node: NodeEntity) => {
    const date = node.activeRevision?.claimedModificationTime
        ? node.activeRevision.claimedModificationTime
        : node.creationTime;

    return dateToLegacyTimestamp(date);
};

export const getLegacyTrashedTime = (node: NodeEntity) =>
    node.trashTime ? dateToLegacyTimestamp(node.trashTime) : null;
