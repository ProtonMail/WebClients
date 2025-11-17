import type { NodeEntity } from '@proton/drive/index';

export const getNodeModifiedTime = (node: NodeEntity) => {
    const date = node.activeRevision?.claimedModificationTime
        ? node.activeRevision.claimedModificationTime
        : node.creationTime;
    return Math.floor(date.getTime() / 1000);
};
