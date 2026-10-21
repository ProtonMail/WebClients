import type { NodeEntity } from '@proton/drive/sdk';

export const getNodeStorageSize = (node: NodeEntity) => {
    return node.activeRevision?.storageSize || node.totalStorageSize || 0;
};
