// Attribute value variants that the search library WASM understands.
export type TagAttribute = { kind: 'tag'; value: string };
export type TextAttribute = { kind: 'text'; value: string };
export type BooleanAttribute = { kind: 'boolean'; value: boolean };
export type IntegerAttribute = { kind: 'integer'; value: bigint };
export type AttributeValue = TagAttribute | TextAttribute | BooleanAttribute | IntegerAttribute;

// Canonical representation of a index item to be added to the foundation search library WASM index.
// Both bulk and incremental indexers must produce this type.
export type IndexEntry = {
    documentId: string;
    attributes: { name: string; value: AttributeValue }[];
};
