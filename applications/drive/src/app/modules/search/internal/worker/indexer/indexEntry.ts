import type { Author, NodeEntity } from '@proton/drive';
import { splitExtension } from '@proton/shared/lib/helpers/file';

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
    sharedBy?: string;
    isShared?: boolean;
    isSharedPublicly?: boolean;
    keyAuthor?: Author;
    trashTime?: Date;
    activeRevisionContentAuthor?: Author;
    activeRevisionCreationTime?: Date;
    activeRevisionStorageSize?: number;
}

/**
 * Core attribute names that every index entry must have.
 * Additional attributes provided by indexer versions cannot use these names (compile-time enforced).
 */
export const CORE_ATTRIBUTE_NAMES = [
    'nodeUid',
    'filename',
    'filenameText',
    'path',
    'treeEventScopeId',
    'indexPopulatorId',
    'indexPopulatorVersion',
    'indexPopulatorGeneration',
    'creationTime',
    'modificationTime',
    'nodeType',
    'mediaType',
    'extension',
    'sharedBy',
    'isShared',
    'isSharedPublicly',
    'keyAuthor',
    'activeRevisionContentAuthor',
    'activeRevisionCreationTime',
    'activeRevisionStorageSize',
    'trashTime',
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

function resolveAuthor(author: Author): string {
    if (author.ok) {
        return author.value ?? '';
    }
    return author.error.claimedAuthor ?? '';
}

export function toCoreNodeFields(node: NodeEntity): CoreNodeFields {
    return {
        uid: node.uid,
        name: node.name,
        type: node.type,
        creationTime: node.creationTime,
        modificationTime: node.modificationTime,
        mediaType: node.mediaType,
        sharedBy: undefined,
        isShared: node.isShared,
        isSharedPublicly: node.isSharedPublicly,
        keyAuthor: node.keyAuthor,
        trashTime: node.trashTime,
        activeRevisionContentAuthor: node.activeRevision?.contentAuthor,
        activeRevisionCreationTime: node.activeRevision?.creationTime,
        activeRevisionStorageSize: node.activeRevision?.storageSize,
    };
}

export function extractExtension(filename: string): string {
    return splitExtension(filename)[1].toLowerCase();
}

/**
 * Strip all non-alphanumeric characters from a string.
 * Search library WASM tokenizer will use any special characters (space, #, _, -, (,), ., ...
 * as a token delimiter) which makes matching filenames quite impossible if
 * they are pack with those e.g. "My file_name #1.png" will be tokenized.
 *
 * Ideally we should be able to not consider these special characters for search
 * tokenization in filenames but this is not supported.
 * See issue:  See issue: https://protonag.atlassian.net/browse/DRVWEB-5345
 *
 * For now, we normalize filenames by stripping all special characters at indexing
 * and querying time. This allow to match complex filename like "My file_name #1.png"
 * but we don't support special character querying. For that example, "My file_name #1.png" will
 * ne stripped down to "Myfilename1png".
 *
 * Note: We use unicode replace to make sure this replace is i18n friendly.
 */
const stripSpecialChars = (s: string): string => s.replace(/[^\p{L}\p{N}]/gu, '');

/**
 * Normalize a filename for "tag" indexing: strip special chars + lowercase.
 * We use lowercase since querying tag attributes is case sensitive: So we will normalize to lowercase
 * When feeding the index and normalize queries (using the same utility) before querying the
 * index.
 * Searching over "text" attribute is not case sensitive so we don't need to lowercase the index value like
 * for "tag"s.
 */
export const normalizedFilenameForTag = (s: string): string => stripSpecialChars(s).toLowerCase();

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
            // Filename as tag — normalized (lowercase, special chars stripped) for
            // case-insensitive substring matching via *query* wildcard patterns.
            { name: 'filename', value: { kind: 'tag', value: normalizedFilenameForTag(node.name) } },
            // Filename as text — special chars stripped so the text processor sees
            // concatenated alphanumeric tokens for trigram / fuzzy matching. Not case sensitive.
            { name: 'filenameText', value: { kind: 'text', value: stripSpecialChars(node.name) } },
            { name: 'path', value: { kind: 'tag', value: parentPath } },
            { name: 'treeEventScopeId', value: { kind: 'tag', value: treeEventScopeId } },
            { name: 'indexPopulatorId', value: { kind: 'tag', value: indexPopulatorId } },
            { name: 'indexPopulatorVersion', value: { kind: 'integer', value: BigInt(indexPopulatorVersion) } },
            { name: 'indexPopulatorGeneration', value: { kind: 'integer', value: BigInt(indexPopulatorGeneration) } },
            { name: 'creationTime', value: { kind: 'integer', value: BigInt(node.creationTime.getTime()) } },
            { name: 'modificationTime', value: { kind: 'integer', value: BigInt(node.modificationTime.getTime()) } },
            { name: 'mediaType', value: { kind: 'tag', value: node.mediaType || '' } },
            { name: 'extension', value: { kind: 'tag', value: extractExtension(node.name) } },
            { name: 'sharedBy', value: { kind: 'tag', value: node.sharedBy || '' } },
            { name: 'isShared', value: { kind: 'boolean', value: node.isShared ?? false } },
            { name: 'isSharedPublicly', value: { kind: 'boolean', value: node.isSharedPublicly ?? false } },
            { name: 'keyAuthor', value: { kind: 'tag', value: node.keyAuthor ? resolveAuthor(node.keyAuthor) : '' } },
            {
                name: 'activeRevisionContentAuthor',
                value: {
                    kind: 'tag',
                    value: node.activeRevisionContentAuthor ? resolveAuthor(node.activeRevisionContentAuthor) : '',
                },
            },
            {
                name: 'activeRevisionCreationTime',
                value: { kind: 'integer', value: BigInt(node.activeRevisionCreationTime?.getTime() ?? 0) },
            },
            {
                name: 'activeRevisionStorageSize',
                value: { kind: 'integer', value: BigInt(node.activeRevisionStorageSize ?? 0) },
            },
            { name: 'trashTime', value: { kind: 'integer', value: BigInt(node.trashTime?.getTime() ?? 0) } },
            ...(additionalAttributes ?? []),
        ],
    };
}
