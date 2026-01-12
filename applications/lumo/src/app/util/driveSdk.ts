import { c } from 'ttag';

import type { InvalidNameError, MaybeNode, NodeEntity } from '@proton/drive';
import { Logging } from '@proton/drive/modules/logging';

export type GetNodeEntityType = {
    node: NodeEntity;
    errors: Map<'name' | 'activeRevision' | 'unhandledError', Error | InvalidNameError>;
};

export function getNodeName(node: MaybeNode): string {
    if (node.ok) {
        return node.value.name;
    }
    const maybeName = node.error.name;
    if (maybeName.ok) {
        return maybeName.value;
    }
    if (maybeName.error instanceof Error) {
        return c('Error').t`⚠️ Undecryptable name`;
    }
    // Invalid name can still be used to display the node.
    return maybeName.error.name;
}

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

/**
 * The logging system for the Drive application.
 *
 * Use it to create a logger instance to log messages to the default log
 * handlers.
 *
 * ```typescript
 * const logger = logging.getLogger('my-module');
 * logger.info('Hello, world!');
 * ```
 */
export const logging = new Logging();

