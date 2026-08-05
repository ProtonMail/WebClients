import type { Author, NodeEntity } from '@proton/drive';
import { getNodeName } from '@proton/drive/modules/nodes';
import { splitExtension } from '@proton/shared/lib/helpers/file';

import { Logger } from '../../shared/Logger';
import { SEARCH_ENGINE_MAX_SEARCHABLE_FILENAME_LENGTH } from '../../shared/config';
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
    'filenameTag',
    'filenameText',
    'path',
    'treeEventScopeId',
    'indexPopulatorKind',
    'indexPopulatorVersion',
    'indexPopulatorGeneration',
    'reindexEpoch',
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
    indexPopulatorKind: string;
    indexPopulatorVersion: number;
    indexPopulatorGeneration: number;
    // Marks which subtree re-index run last wrote this entry (default 0). Used by the
    // deferred sweep to identify descendants a re-walk did not re-stamp (i.e. obsolete).
    reindexEpoch?: number;
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
        name: getNodeName(node),
        type: node.type,
        creationTime: node.creationTime,
        modificationTime: node.modificationTime,
        mediaType: node.mediaType,
        sharedBy: undefined,
        isShared: node.isShared,
        isSharedPublicly: node.isSharedByUrl,
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
 * The search library WASM text processor tokenizes "text" attributes, using any special
 * characters (space, #, _, -, (,), ., ...) as a token delimiter. Stripping them up front
 * gives the tokenizer a single concatenated alphanumeric run to work with.
 *
 * This applies to the "text" attribute only. "tag" attributes are not tokenized, so they
 * preserve special characters and do not need stripping.
 *
 * Note: We use unicode replace to make sure this replace is i18n friendly.
 */
const stripSpecialChars = (s: string): string => s.replace(/[^\p{L}\p{N}]/gu, '');

/**
 * Normalize a filename for "tag" indexing: lowercase only, special characters preserved.
 */
export const normalizedFilenameForTag = (s: string): string => s.toLowerCase();

/**
 * Normalize a filename for "text" indexing: strip special characters, do not lowercase.
 * Used for the fuzzy / trigram text searches.
 */
export const normalizedFilenameForText = (s: string): string => stripSpecialChars(s);

export function createIndexEntry<N extends string>(params: CreateIndexEntryParams<N>): IndexEntry {
    const {
        node,
        treeEventScopeId,
        parentPath,
        indexPopulatorKind,
        indexPopulatorVersion,
        indexPopulatorGeneration,
        reindexEpoch,
        additionalAttributes,
    } = params;

    let strippedFilenameForTextAttribute = normalizedFilenameForText(node.name);
    if (strippedFilenameForTextAttribute.length > SEARCH_ENGINE_MAX_SEARCHABLE_FILENAME_LENGTH) {
        Logger.error(
            `Filename exceeds max searchable length (${strippedFilenameForTextAttribute.length}/${SEARCH_ENGINE_MAX_SEARCHABLE_FILENAME_LENGTH})`
        );
        // Let's still index the first SEARCH_ENGINE_MAX_SEARCHABLE_FILENAME_LENGTH characters.
        strippedFilenameForTextAttribute = strippedFilenameForTextAttribute.slice(
            0,
            SEARCH_ENGINE_MAX_SEARCHABLE_FILENAME_LENGTH
        );
    }

    return {
        documentId: node.uid,
        attributes: [
            { name: 'nodeUid', value: { kind: 'tag', value: node.uid } },
            { name: 'nodeType', value: { kind: 'tag', value: node.type } },
            // Filename as tag - lowercased, special chars preserved, for case-insensitive
            // substring matching (including special characters).
            { name: 'filenameTag', value: { kind: 'tag', value: normalizedFilenameForTag(node.name) } },
            // Filename as text - special chars stripped so the text processor sees
            // concatenated alphanumeric tokens for trigram / fuzzy matching. Not case sensitive.
            { name: 'filenameText', value: { kind: 'text', value: strippedFilenameForTextAttribute } },
            { name: 'path', value: { kind: 'tag', value: parentPath } },
            { name: 'treeEventScopeId', value: { kind: 'tag', value: treeEventScopeId } },
            { name: 'indexPopulatorKind', value: { kind: 'tag', value: indexPopulatorKind } },
            { name: 'indexPopulatorVersion', value: { kind: 'integer', value: BigInt(indexPopulatorVersion) } },
            { name: 'indexPopulatorGeneration', value: { kind: 'integer', value: BigInt(indexPopulatorGeneration) } },
            { name: 'reindexEpoch', value: { kind: 'integer', value: BigInt(reindexEpoch ?? 0) } },
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
