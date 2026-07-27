const ESCAPED_ENTITY_MAP: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
};

const ESCAPED_ENTITY_REGEX = /&(?:amp|lt|gt|quot|#39);/g;

// Decode once; the shared `unescape` is greedy and would collapse `&amp;lt;` down to `<`.
const decodeEscapedEntitiesOnce = (value: string): string =>
    value.replace(ESCAPED_ENTITY_REGEX, (entity) => ESCAPED_ENTITY_MAP[entity] ?? entity);

/**
 * Turns the stored HTML-inert message (e.g. `&lt;test`) back into its plain-text form (`<test`)
 * for display. Never pass the result to an HTML sink.
 */
export const addSpecialCharactersForMessageDisplay = (content: string): string => decodeEscapedEntitiesOnce(content);
