import type { NodeEntity } from '@proton/drive/index';

export const getNodeStorageSize = (node: NodeEntity) => node.activeRevision?.storageSize ?? node.totalStorageSize ?? 0;
