import type { InvalidNameError, MaybeNode, NodeEntity } from '@proton/drive/index';

import { getNodeName } from './getNodeName';

export type GetNodeEntityType = {
    node: NodeEntity;
    errors: Map<'name' | 'activeRevision' | 'unhandledError', Error | InvalidNameError>;
};

export const getNodeEntity = (maybeNode: MaybeNode): GetNodeEntityType => {
    let node: NodeEntity;
    const errors = new Map();

    if (maybeNode.ok) {
        node = maybeNode.value;
    } else {
        if (!maybeNode.error.name.ok) {
            errors.set('name', maybeNode.error.name.error);
        }
        if (maybeNode.error.activeRevision !== undefined && !maybeNode.error.activeRevision.ok) {
            errors.set('activeRevision', maybeNode.error.activeRevision.error);
        }
        if (maybeNode.error.errors?.length) {
            errors.set('unhandledError', maybeNode.error.errors?.at(0));
        }
        node = {
            ...maybeNode.error,
            name: getNodeName(maybeNode),
            activeRevision: maybeNode.error.activeRevision?.ok ? maybeNode.error.activeRevision.value : undefined,
        };
    }

    return {
        node,
        errors,
    };
};
