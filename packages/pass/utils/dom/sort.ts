const {
    DOCUMENT_POSITION_FOLLOWING,
    DOCUMENT_POSITION_PRECEDING,
    DOCUMENT_POSITION_CONTAINS,
    DOCUMENT_POSITION_CONTAINED_BY,
} = Node;

export const compareDomNodes = <T extends Node>(a: T, b: T): number => {
    if (a === b) return 0;
    const position = a.compareDocumentPosition(b);

    if (position & DOCUMENT_POSITION_FOLLOWING || position & DOCUMENT_POSITION_CONTAINED_BY) return -1;
    if (position & DOCUMENT_POSITION_PRECEDING || position & DOCUMENT_POSITION_CONTAINS) return 1;

    return 0;
};
