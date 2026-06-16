import type { NodeEntity } from '@proton/drive/index';

export const getNodeStorageSize = (node: NodeEntity) => {
    const revision = node.activeRevision?.ok ? node.activeRevision.value : undefined;
    return revision?.storageSize ?? node.totalStorageSize ?? 0;
};
