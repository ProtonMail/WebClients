import type { NodeEntity } from '@proton/drive/index';

export const getNodeModifiedTime = (node: NodeEntity) => {
    const claimedModificationTime = node.activeRevision?.ok
        ? node.activeRevision.value.claimedModificationTime
        : undefined;
    const date = claimedModificationTime ?? node.creationTime;
    return Math.floor(date.getTime() / 1000);
};
