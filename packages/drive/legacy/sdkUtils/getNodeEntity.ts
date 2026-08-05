import {
    type AlbumAttributes,
    type InvalidNameError,
    type NodeEntity,
    NodeType,
    type PhotoAttributes,
    type PhotoNode,
} from '@protontech/drive-sdk';

import { getNodeName } from '../../modules/nodes/internal/getNodeName';

// NodeEntity.name is a result type that must be unwrapped before use in legacy code.
// NormalizedNode provides a pre-unwrapped version for consumers that can't handle result types directly.
export type NormalizedNode = Omit<NodeEntity, 'name'> & {
    name: string;
};

export type GetNodeEntityType = {
    node: NormalizedNode;
    errors: Map<'name' | 'unhandledError', Error | InvalidNameError>;
    photoAttributes?: PhotoAttributes;
    albumAttributes?: AlbumAttributes;
};

// TODO: Consider moving to a modules/nodes package.
const isPhotoNode = (node: NodeEntity): node is PhotoNode => {
    return [NodeType.Photo, NodeType.Album].includes(node.type);
};

// TODO: Do not use. Just use the plain NodeEntity SDK type and getNodeName() for the name.
export const getNodeEntity = (nodeEntity: NodeEntity): GetNodeEntityType => {
    const errors = new Map<'name' | 'unhandledError', Error | InvalidNameError>();

    if (!nodeEntity.name.ok) {
        errors.set('name', nodeEntity.name.error);
    }
    if (nodeEntity.errors?.length) {
        errors.set('unhandledError', nodeEntity.errors?.at(0) as Error);
    }

    const node: NormalizedNode = {
        ...nodeEntity,
        name: getNodeName(nodeEntity),
    };

    return {
        node,
        errors,
        photoAttributes: isPhotoNode(nodeEntity) ? nodeEntity.photo : undefined,
        albumAttributes: isPhotoNode(nodeEntity) ? nodeEntity.album : undefined,
    };
};
