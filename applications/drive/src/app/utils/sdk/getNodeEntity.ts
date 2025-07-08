import type { InvalidNameError, MaybeNode, NodeEntity } from '@proton/drive/index';

type GetNodeEntityType = {
    node: NodeEntity;
    errors: Map<'name' | 'activeRevision', Error | InvalidNameError>;
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
        node = {
            ...maybeNode.error,
            name: maybeNode.error.name.ok ? maybeNode.error.name.value : maybeNode.error.name.error.name,
            activeRevision: maybeNode.error.activeRevision?.ok ? maybeNode.error.activeRevision.value : undefined,
        };
    }

    return {
        node,
        errors,
    };
};
