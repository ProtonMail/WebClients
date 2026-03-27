import type { TreeEventScopeId } from '../../shared/types';

// Attribute value variants that the search library WASM understands.
export type TagAttribute = { kind: 'tag'; value: string };
export type TextAttribute = { kind: 'text'; value: string };
export type BooleanAttribute = { kind: 'boolean'; value: boolean };
export type IntegerAttribute = { kind: 'integer'; value: bigint };
export type AttributeValue = TagAttribute | TextAttribute | BooleanAttribute | IntegerAttribute;

/**
 * Canonical representation of an index item to be added to the foundation search library WASM index.
 */
export type IndexEntry = {
    documentId: string;
    attributes: { name: string; value: AttributeValue }[];
};

/**
 * Node fields required by createIndexEntry. Any SDK node type that provides these can be indexed.
 */
export interface CoreNodeFields {
    uid: string;
    name: string;
    type: string;
    creationTime: Date;
    modificationTime: Date;
    mediaType?: string;
}

/**
 * Core attribute names that every index entry must have.
 * Additional attributes provided by indexer versions cannot use these names (compile-time enforced).
 */
export const CORE_ATTRIBUTE_NAMES = [
    'nodeUid',
    'filename',
    'path',
    'treeEventScopeId',
    'indexPopulatorId',
    'indexPopulatorVersion',
    'indexPopulatorGeneration',
    'creationTime',
    'modificationTime',
    'nodeType',
    'mediaType',
] as const;

type CoreAttributeName = (typeof CORE_ATTRIBUTE_NAMES)[number];

/**
 * Creates an IndexEntry with core attributes. Indexer versions can pass additional
 * attributes that are appended after the core ones.
 *
 * Core attributes cannot be overridden — passing an additional attribute with a
 * core name is a compile-time error.
 */
export interface CreateIndexEntryParams<N extends string = string> {
    node: CoreNodeFields;
    treeEventScopeId: TreeEventScopeId;
    parentPath: string;
    indexPopulatorId: string;
    indexPopulatorVersion: number;
    indexPopulatorGeneration: number;
    additionalAttributes?: { name: N extends CoreAttributeName ? never : N; value: AttributeValue }[];
}

export function createIndexEntry<N extends string>(params: CreateIndexEntryParams<N>): IndexEntry {
    const {
        node,
        treeEventScopeId,
        parentPath,
        indexPopulatorId,
        indexPopulatorVersion,
        indexPopulatorGeneration,
        additionalAttributes,
    } = params;

    return {
        documentId: node.uid,
        attributes: [
            { name: 'nodeUid', value: { kind: 'tag', value: node.uid } },
            { name: 'nodeType', value: { kind: 'tag', value: node.type } },
            { name: 'filename', value: { kind: 'text', value: node.name } },
            { name: 'path', value: { kind: 'tag', value: parentPath } },
            { name: 'treeEventScopeId', value: { kind: 'tag', value: treeEventScopeId } },
            { name: 'indexPopulatorId', value: { kind: 'tag', value: indexPopulatorId } },
            { name: 'indexPopulatorVersion', value: { kind: 'integer', value: BigInt(indexPopulatorVersion) } },
            { name: 'indexPopulatorGeneration', value: { kind: 'integer', value: BigInt(indexPopulatorGeneration) } },
            { name: 'creationTime', value: { kind: 'integer', value: BigInt(node.creationTime.getTime()) } },
            { name: 'modificationTime', value: { kind: 'integer', value: BigInt(node.modificationTime.getTime()) } },
            { name: 'mediaType', value: { kind: 'tag', value: node.mediaType || '' } },
            ...(additionalAttributes ?? []),
        ],
    };
}
