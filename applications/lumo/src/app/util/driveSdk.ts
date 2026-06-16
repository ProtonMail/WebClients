import { c } from 'ttag';

import type { InvalidNameError, NodeEntity, Revision } from '@proton/drive';

export type NormalizedNode = Omit<NodeEntity, 'name' | 'activeRevision'> & {
    name: string;
    activeRevision?: Revision;
};

export type GetNodeEntityType = {
    node: NormalizedNode;
    errors: Map<'name' | 'activeRevision' | 'unhandledError', Error | InvalidNameError>;
};

export function getNodeName(node: NodeEntity): string {
    const name = node.name;
    if (name.ok) {
        return name.value;
    }
    if (name.error instanceof Error) {
        return c('Error').t`⚠️ Undecryptable name`;
    }
    return name.error.name;
}

export const getNodeEntity = (nodeEntity: NodeEntity): GetNodeEntityType => {
    const errors = new Map<'name' | 'activeRevision' | 'unhandledError', Error | InvalidNameError>();

    if (!nodeEntity.name.ok) {
        errors.set('name', nodeEntity.name.error);
    }
    if (nodeEntity.activeRevision !== undefined && !nodeEntity.activeRevision.ok) {
        errors.set('activeRevision', nodeEntity.activeRevision.error);
    }
    if (nodeEntity.errors?.length) {
        errors.set('unhandledError', nodeEntity.errors.at(0) as Error);
    }

    const node: NormalizedNode = {
        ...nodeEntity,
        name: getNodeName(nodeEntity),
        activeRevision: nodeEntity.activeRevision?.ok ? nodeEntity.activeRevision.value : undefined,
    };

    return { node, errors };
};
