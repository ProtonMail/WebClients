import type { NodeEntity } from '@proton/drive/sdk';

export const getNodeModifiedTime = (node: NodeEntity) => {
    const date = node.activeRevision?.claimedModificationTime ?? node.creationTime;
    return Math.floor(date.getTime() / 1000);
};
