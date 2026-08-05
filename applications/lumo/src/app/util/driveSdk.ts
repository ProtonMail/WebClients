import { c } from 'ttag';

import type { InvalidNameError, NodeEntity } from '@proton/drive';

export type NormalizedNode = Omit<NodeEntity, 'name'> & {
    name: string;
};

export type GetNodeEntityType = {
    node: NormalizedNode;
    errors: Map<'name' | 'unhandledError', Error | InvalidNameError>;
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
    const errors = new Map<'name' | 'unhandledError', Error | InvalidNameError>();

    if (!nodeEntity.name.ok) {
        errors.set('name', nodeEntity.name.error);
    }
    if (nodeEntity.errors?.length) {
        errors.set('unhandledError', nodeEntity.errors.at(0) as Error);
    }

    const node: NormalizedNode = {
        ...nodeEntity,
        name: getNodeName(nodeEntity),
    };

    return { node, errors };
};
